<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * SuperAdmin TenantController
 *
 * Internal admin panel for managing all tenants.
 * Protected by Gate::define('manage-tenants') — requires 'super-admin' role.
 *
 * Routes (all prefixed /super-admin/):
 *   GET  /tenants               — list all tenants with stats
 *   GET  /tenants/{tenant}      — single tenant detail
 *   PATCH /tenants/{tenant}/plan   — force-change plan
 *   PATCH /tenants/{tenant}/status — suspend / reactivate / cancel
 *   POST /tenants/{tenant}/impersonate — log in as a tenant user
 */
class TenantController extends Controller
{
    /** List all tenants with summary stats */
    public function index(Request $request): Response
    {
        $tenants = Tenant::withCount('tenantUsers')
            ->with('subscription')
            ->when($request->search, fn ($q) => $q->where('name', 'like', "%{$request->search}%")
                ->orWhere('email', 'like', "%{$request->search}%"))
            ->when($request->plan,   fn ($q) => $q->where('plan',   $request->plan))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->orderByDesc('created_at')
            ->paginate(25)
            ->withQueryString();

        $stats = [
            'total'      => Tenant::count(),
            'active'     => Tenant::where('status', 'active')->count(),
            'trial'      => Tenant::where('status', 'trial')->count(),
            'suspended'  => Tenant::where('status', 'suspended')->count(),
            'mrr'        => Tenant::join('subscriptions', 'tenants.id', '=', 'subscriptions.tenant_id')
                ->where('subscriptions.status', 'active')
                ->where('subscriptions.billing_cycle', 'monthly')
                ->sum('subscriptions.amount'),
        ];

        return Inertia::render('super-admin/tenants/index', [
            'tenants' => $tenants,
            'stats'   => $stats,
            'filters' => $request->only(['search', 'plan', 'status']),
        ]);
    }

    /** Single tenant detail view */
    public function show(Tenant $tenant): Response
    {
        $tenant->load([
            'tenantUsers.user',
            'subscription',
            'enabledModules',
        ]);

        return Inertia::render('super-admin/tenants/show', [
            'tenant'          => $tenant,
            'tenant_users'    => $tenant->tenantUsers->map(fn ($tu) => [
                'id'             => $tu->id,
                'name'           => $tu->user->name,
                'email'          => $tu->user->email,
                'role'           => $tu->role,
                'is_active'      => $tu->is_active,
                'joined_at'      => $tu->joined_at,
                'last_active_at' => $tu->last_active_at,
            ]),
            'enabled_modules' => $tenant->enabledModules->pluck('key'),
            'subscription'    => $tenant->subscription,
        ]);
    }

    /** Force-change a tenant's plan (bypasses Stripe — for support/admin use) */
    public function updatePlan(Request $request, Tenant $tenant): RedirectResponse
    {
        $data = $request->validate([
            'plan' => ['required', 'in:free,starter,growth,enterprise'],
        ]);

        $tenant->upgradeToPlan($data['plan']);

        // Auto-enable all plan-appropriate modules on upgrade
        if ($data['plan'] !== 'free') {
            $modules = \App\Models\Module::whereJsonContains('plan_availability', $data['plan'])
                ->where('is_active', true)
                ->get();

            foreach ($modules as $module) {
                $tenant->enableModule($module->key);
            }
        }

        return back()->with('success', "Plan updated to {$data['plan']}.");
    }

    /** Suspend, reactivate, or cancel a tenant */
    public function updateStatus(Request $request, Tenant $tenant): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:trial,active,suspended,cancelled'],
        ]);

        $update = ['status' => $data['status']];
        if ($data['status'] === 'suspended') {
            $update['suspended_at'] = now();
        }

        $tenant->update($update);

        return back()->with('success', "Tenant status updated to {$data['status']}.");
    }

    /**
     * Log in as a user within a tenant (impersonation).
     * Requires the stancl UserImpersonation feature to be enabled in config/tenancy.php,
     * OR you can implement a simple session-based impersonation here.
     */
    public function impersonate(Request $request, Tenant $tenant): RedirectResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
        ]);

        $targetUser = User::findOrFail($data['user_id']);

        // Verify this user belongs to the tenant
        $isMember = $tenant->tenantUsers()
            ->where('user_id', $targetUser->id)
            ->exists();

        abort_unless($isMember, 403, 'User does not belong to this tenant.');

        // Store the original admin's ID in session for un-impersonation
        session([
            'impersonator_id'  => Auth::id(),
            'impersonating_as' => $targetUser->id,
        ]);

        Auth::login($targetUser);
        $targetUser->update(['current_tenant_id' => $tenant->id]);

        return redirect()->route('web.dashboard')
            ->with('info', "Impersonating {$targetUser->name} in {$tenant->name}.");
    }
}