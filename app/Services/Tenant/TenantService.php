<?php

namespace App\Services\Tenant;

use App\Models\Module;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * TenantService
 *
 * Handles workspace provisioning, membership management, and plan comparison.
 *
 * ─── BUG FIX — tenant_id = 0 on subscription insert ─────────────────────────
 *
 * Root cause 1 — stancl's Tenant::create() id resolution:
 *   stancl's BaseTenant processes attributes through a custom __get/__set that
 *   separates direct columns from the JSON 'data' bag. After Tenant::create()
 *   returns, reading $tenant->id goes through Eloquent's getKey(). When you
 *   manually pass 'id' into create(), stancl's post-save attribute state can
 *   leave the PHP model object with an unresolved key — PHP casts null/unset
 *   to int 0. The DB row is correct (UUID was saved), but the in-memory model
 *   returned by create() is unreliable for reading the id back.
 *
 *   Fix: generate the UUID ONCE into $tenantId before calling create(), then
 *   use $tenantId (the PHP variable) for ALL subsequent operations. Never read
 *   $tenant->id after stancl's create(). Return a fresh model via Tenant::find().
 *
 * Root cause 2 — double Subscription creation:
 *   TenancyServiceProvider::configureTenantCreatedHook() also creates a
 *   Subscription inside the TenantCreated event (fired synchronously during
 *   Tenant::create()). This ran before TenantService got the $tenant back,
 *   meaning two Subscription::create() calls ran in the same transaction —
 *   the first with a potentially broken id, the second as a duplicate.
 *
 *   Fix: Subscription creation is ONLY here in TenantService. The
 *   TenancyServiceProvider::configureTenantCreatedHook() no longer creates
 *   Subscriptions (it only enables the initial module as a fallback for
 *   non-TenantService tenant creation paths like seeders).
 */
class TenantService
{
    /**
     * Provision a new tenant workspace.
     *
     * Creates in a single transaction:
     *   1. Tenant row with UUID id
     *   2. Domain row (subdomain registration with stancl)
     *   3. Subscription row (free plan, 14-day trial)
     *   4. TenantUser pivot row (owner role)
     *   5. Sets user.current_tenant_id
     *
     * Returns a fresh Tenant model loaded from the DB (not the post-create instance).
     */
    public function createTenant(User $user, array $data): Tenant
    {
        // Generate the UUID ONCE here. This $tenantId string is used for every
        // subsequent insert. We never read ->id back from the model returned by
        // Tenant::create() because of the stancl attribute resolution edge case.
        $tenantId = (string) Str::uuid();
        $slug     = $this->generateUniqueSlug($data['name']);

        DB::transaction(function () use ($user, $data, $tenantId, $slug) {

            // ── 1. Create the tenant row ──────────────────────────────────────
            Tenant::create([
                'id'            => $tenantId,
                'name'          => $data['name'],
                'slug'          => $slug,
                'email'         => $data['email'],
                'phone'         => $data['phone'] ?? null,
                'timezone'      => $data['timezone'] ?? 'UTC',
                'currency'      => $data['currency'] ?? 'USD',
                'plan'          => 'free',
                'status'        => 'trial',
                'max_users'     => 1,
                'max_modules'   => 1,
                'trial_ends_at' => now()->addDays(14),
            ]);

            // ── 2. Register subdomain with stancl/tenancy ─────────────────────
            // We must load the tenant fresh from DB for stancl's domain relation
            // to work correctly (the post-create() instance is not fully hydrated).
            $tenant = Tenant::find($tenantId);

            $appDomain = config('app.domain', config('app.url', 'localhost'));
            // Strip protocol if APP_URL was set as a full URL
            $appDomain = preg_replace('#^https?://#', '', $appDomain);

            $tenant->domains()->create([
                'domain' => $slug . '.' . $appDomain,
            ]);

            // ── 3. Subscription record ────────────────────────────────────────
            // Use $tenantId directly — NOT $tenant->id — to be 100% certain
            // the correct UUID string reaches the insert.
            Subscription::create([
                'tenant_id'     => $tenantId,
                'plan'          => 'free',
                'status'        => 'trialing',
                'billing_cycle' => 'monthly',
                'max_users'     => 1,
                'amount'        => 0,
                'currency'      => $data['currency'] ?? 'USD',
                'trial_ends_at' => now()->addDays(14),
            ]);

            // ── 4. Owner membership ───────────────────────────────────────────
            TenantUser::create([
                'tenant_id' => $tenantId,
                'user_id'   => $user->id,
                'role'      => 'owner',
                'is_active' => true,
                'joined_at' => now(),
            ]);

            // ── 5. Set as the user's active workspace ─────────────────────────
            $user->update(['current_tenant_id' => $tenantId]);
        });

        // Return a clean, fully-hydrated model from the DB
        return Tenant::with('subscription', 'enabledModules')->findOrFail($tenantId);
    }

    /**
     * Add a user to a tenant by email.
     * Creates the User account if they don't exist yet.
     */
    public function addMember(Tenant $tenant, string $email, string $role = 'member'): TenantUser
    {
        if (!$tenant->withinUserLimit()) {
            throw new \RuntimeException(
                "This workspace has reached its {$tenant->max_users}-user limit. " .
                "Please upgrade your plan to add more members."
            );
        }

        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name'     => explode('@', $email)[0],
                'password' => bcrypt(Str::random(24)),
            ]
        );

        $membership = TenantUser::firstOrCreate(
            ['tenant_id' => $tenant->id, 'user_id' => $user->id],
            ['role' => $role, 'is_active' => true, 'joined_at' => now()]
        );

        if (!$membership->wasRecentlyCreated) {
            $membership->update(['is_active' => true, 'role' => $role]);
        }

        // TODO: dispatch InviteUserToTenantNotification

        return $membership;
    }

    /** Soft-revoke a user's access (keeps the pivot row for audit history). */
    public function removeMember(Tenant $tenant, User $user): void
    {
        TenantUser::where('tenant_id', $tenant->id)
            ->where('user_id', $user->id)
            ->update(['is_active' => false]);

        // If this was the user's active workspace, auto-select their next one
        if ($user->current_tenant_id === $tenant->id) {
            $next = TenantUser::where('user_id', $user->id)
                ->where('is_active', true)
                ->where('tenant_id', '!=', $tenant->id)
                ->first();

            $user->update(['current_tenant_id' => $next?->tenant_id]);
        }
    }

    /** Plan comparison data for the upgrade/plans page. */
    public function getPlanComparison(): array
    {
        return [
            [
                'key'           => 'free',
                'name'          => 'Free',
                'price_monthly' => 0,
                'price_annual'  => 0,
                'max_users'     => 1,
                'max_modules'   => 1,
                'description'   => 'Get started with one module, one user.',
                'features'      => [
                    '1 user seat',
                    '1 module of your choice',
                    '14-day trial of full access',
                    'Community support',
                ],
                'cta'           => 'Current Plan',
                'highlighted'   => false,
            ],
            [
                'key'           => 'starter',
                'name'          => 'Starter',
                'price_monthly' => 29,
                'price_annual'  => 278.40,
                'max_users'     => 5,
                'max_modules'   => 3,
                'description'   => 'Perfect for small teams getting started.',
                'features'      => [
                    'Up to 5 user seats',
                    'Up to 3 modules',
                    'Email support',
                    'Basic analytics',
                ],
                'cta'           => 'Upgrade to Starter',
                'highlighted'   => false,
            ],
            [
                'key'           => 'growth',
                'name'          => 'Growth',
                'price_monthly' => 79,
                'price_annual'  => 758.40,
                'max_users'     => 15,
                'max_modules'   => 9999,
                'description'   => 'Everything you need to scale your business.',
                'features'      => [
                    'Up to 15 user seats',
                    'All modules included',
                    'Priority email & phone support',
                    'Advanced analytics & reports',
                    'Supply chain management',
                ],
                'cta'           => 'Upgrade to Growth',
                'highlighted'   => true,
            ],
            [
                'key'           => 'enterprise',
                'name'          => 'Enterprise',
                'price_monthly' => 199,
                'price_annual'  => 1910.40,
                'max_users'     => 9999,
                'max_modules'   => 9999,
                'description'   => 'For large teams and complex operations.',
                'features'      => [
                    'Unlimited user seats',
                    'All modules included',
                    'HR & Leave management',
                    'Dedicated support manager',
                    'Custom domain',
                    'SLA guarantee',
                    'Full audit logs & compliance',
                ],
                'cta'           => 'Contact Sales',
                'highlighted'   => false,
            ],
        ];
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function generateUniqueSlug(string $name): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $i    = 1;

        while (Tenant::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }
}
