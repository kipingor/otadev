<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Models\TenantUser;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpFoundation\Response;

/**
 * EnsureActiveTenant
 *
 * Resolves the current tenant for every authenticated request and:
 *   1. Finds the tenant from the user's current_tenant_id (or auto-selects)
 *   2. Verifies active membership
 *   3. Checks tenant is not suspended or trial-expired
 *   4. Binds the tenant into the service container as 'current_tenant'
 *      → This is what HasTenantScope reads for automatic query filtering
 *   5. Shares tenant + role with Inertia via request attributes
 *      → HandleInertiaRequests reads this and passes it to every page
 */
class EnsureActiveTenant
{
    private const BYPASS_PREFIXES = [
        'onboarding.',
        'subscription.',
        'tenant.',
        'super-admin.',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if (!$user) {
            return $this->unauthenticatedResponse($request);
        }

        // ── Bypass: onboarding/subscription/admin routes always pass through ──
        $currentRouteName = $request->route()?->getName() ?? '';
        foreach (self::BYPASS_PREFIXES as $prefix) {
            if (str_starts_with($currentRouteName, $prefix)) {
                return $next($request);
            }
        }

        // ── Resolve tenant ────────────────────────────────────────────────────
        $tenant = $this->resolveTenant($user);

        if (!$tenant) {
            return $this->noTenantResponse($request);
        }

        // ── Membership check ──────────────────────────────────────────────────
        $membership = TenantUser::where('tenant_id', $tenant->id)
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->first();

        if (!$membership) {
            $user->update(['current_tenant_id' => null]);
            return $this->noTenantResponse($request);
        }

        // ── Tenant status checks ──────────────────────────────────────────────
        if ($tenant->isSuspended()) {
            return $this->redirectToNamedRoute($request, 'subscription.suspended',
                'This workspace has been suspended. Please contact support.');
        }

        if ($tenant->isTrial() && $tenant->trialHasExpired()) {
            return $this->redirectToNamedRoute($request, 'subscription.expired',
                'Your trial has expired. Please upgrade to continue.');
        }

        // ── CRITICAL: Bind tenant into service container ──────────────────────
        // HasTenantScope reads app('current_tenant') on every Eloquent query.
        // Without this binding, the global scope has no tenant to filter by
        // and ALL records from ALL tenants are returned — a security hole.
        app()->instance('current_tenant', $tenant);

        // ── Load modules + share with Inertia/controllers ─────────────────────
        $tenant->loadMissing('enabledModules');

        $request->attributes->set('current_tenant', $tenant);
        $request->attributes->set('tenant_role', $membership->role);

        // ── Throttled last-active update ──────────────────────────────────────
        if (!$membership->last_active_at || $membership->last_active_at->diffInMinutes(now()) > 5) {
            $membership->update(['last_active_at' => now()]);
        }

        return $next($request);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function resolveTenant($user): ?Tenant
    {
        if ($user->current_tenant_id) {
            $tenant = Tenant::find($user->current_tenant_id);
            if ($tenant) return $tenant;
        }

        $membership = TenantUser::where('user_id', $user->id)
            ->where('is_active', true)
            ->with('tenant')
            ->first();

        if ($membership?->tenant) {
            $user->update(['current_tenant_id' => $membership->tenant_id]);
            return $membership->tenant;
        }

        return null;
    }

    private function noTenantResponse(Request $request): Response
    {
        if ($request->expectsJson() || $request->inertia()) {
            return response()->json([
                'error'    => 'no_tenant',
                'message'  => 'No workspace found. Please complete onboarding.',
                'redirect' => '/onboarding/create',
            ], 401);
        }

        return Route::has('onboarding.create')
            ? redirect()->route('onboarding.create')->with('info', 'Please create a workspace to continue.')
            : redirect('/onboarding/create')->with('info', 'Please create a workspace to continue.');
    }

    private function unauthenticatedResponse(Request $request): Response
    {
        if ($request->expectsJson() || $request->inertia()) {
            return response()->json(['error' => 'unauthenticated'], 401);
        }
        return redirect()->route('login');
    }

    private function redirectToNamedRoute(Request $request, string $routeName, string $message): Response
    {
        if ($request->expectsJson() || $request->inertia()) {
            return response()->json([
                'error'    => $routeName,
                'message'  => $message,
                'redirect' => Route::has($routeName) ? route($routeName) : '/',
            ], 403);
        }

        return Route::has($routeName)
            ? redirect()->route($routeName)->with('warning', $message)
            : redirect('/')->with('warning', $message);
    }
}