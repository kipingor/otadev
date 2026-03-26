<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\Module;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        // Use Vite manifest file hash for cache busting
        if (file_exists($manifest = public_path('build/manifest.json'))) {
            return md5_file($manifest);
        }

        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $tenant     = $request->attributes->get('current_tenant');
        $tenantRole = $request->attributes->get('tenant_role');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            
            // ── Tenant context (null on central/unauthenticated pages) ─────────
            'tenant' => $tenant ? [
                'id'           => $tenant->id,
                'name'         => $tenant->name,
                'slug'         => $tenant->slug,
                'plan'         => $tenant->plan,
                'status'       => $tenant->status,
                'logo_path'    => $tenant->logo_path,
                'timezone'     => $tenant->timezone,
                'currency'     => $tenant->currency,
                'max_users'    => $tenant->max_users,
                'is_trial'     => $tenant->isTrial(),
                'trial_ends_at'=> $tenant->trial_ends_at?->toISOString(),
                'trial_days_left' => $tenant->isTrial() && $tenant->trial_ends_at
                    ? max(0, (int) now()->diffInDays($tenant->trial_ends_at, false))
                    : null,
                'is_suspended' => $tenant->isSuspended(),
                'role'         => $tenantRole,
            ] : null,
 
            // ── Enabled module keys — the sidebar uses this to show/hide nav groups
            // Shape: string[] e.g. ['leads', 'pipeline', 'accounting']
            'enabled_modules' => $tenant
                ? $tenant->enabledModules->pluck('key')->toArray()
                : [],
 
            // ── All modules (for the subscription/upgrade pages) ──────────────
            // Only loaded on subscription pages to avoid the query on every request
            // Use lazy loading in the subscription controller instead; here we
            // just pass a lightweight flag so the frontend knows what exists.
        ];
    }
}
