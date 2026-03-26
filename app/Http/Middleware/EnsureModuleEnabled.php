<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * EnsureModuleEnabled
 *
 * Usage in routes:
 *   Route::middleware(['auth', 'tenant', 'module:accounting'])->group(...)
 *
 * For Inertia requests, returns a 403 JSON response that the frontend
 * can intercept and display as an upgrade prompt.
 * For standard requests, redirects to the subscription upgrade page.
 *
 * The module keys map 1:1 with the 'key' column in the modules table:
 *   leads, pipeline, contacts, opportunities, projects, accounting,
 *   clients, analytics, supply_chain, hr
 */
class EnsureModuleEnabled
{
    public function handle(Request $request, Closure $next, string $moduleKey): Response
    {
        $tenant = $request->attributes->get('current_tenant');

        // If tenant wasn't resolved by EnsureActiveTenant, check directly
        if (!$tenant && tenancy()->tenant) {
            $tenant = tenancy()->tenant;
        }

        // No tenant context → let EnsureActiveTenant handle the redirect
        if (!$tenant) {
            return $next($request);
        }

        if (!$tenant->hasModule($moduleKey)) {
            if ($request->inertia() || $request->expectsJson()) {
                return response()->json([
                    'error'      => 'module_not_enabled',
                    'module'     => $moduleKey,
                    'message'    => 'This module is not included in your current plan.',
                    'upgrade_url' => route('subscription.plans'),
                ], 403);
            }

            return redirect()
                ->route('subscription.plans')
                ->with('warning', "The '{$moduleKey}' module requires a plan upgrade.");
        }

        return $next($request);
    }
}