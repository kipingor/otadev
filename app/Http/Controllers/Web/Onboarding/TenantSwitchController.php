<?php

namespace App\Http\Controllers\Web\Onboarding;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * TenantSwitchController
 *
 * Manages workspace switching and new workspace creation for users
 * who belong to multiple tenants.
 */
class TenantSwitchController extends Controller
{
    /** Show the workspace switcher */
    public function index(): Response
    {
        $user = Auth::user();

        $memberships = TenantUser::where('user_id', $user->id)
            ->where('is_active', true)
            ->with(['tenant.subscription', 'tenant.enabledModules'])
            ->get()
            ->map(fn ($m) => [
                'tenant_id'       => $m->tenant_id,
                'name'            => $m->tenant->name,
                'slug'            => $m->tenant->slug,
                'plan'            => $m->tenant->plan,
                'logo_path'       => $m->tenant->logo_path,
                'role'            => $m->role,
                'is_current'      => $m->tenant_id === $user->current_tenant_id,
                'enabled_modules' => $m->tenant->enabledModules->pluck('key'),
            ]);

        return Inertia::render('onboarding/switch-tenant', [
            'memberships'       => $memberships,
            'current_tenant_id' => $user->current_tenant_id,
        ]);
    }

    /** Switch active workspace */
    public function switch(Request $request, string $tenantId): RedirectResponse
    {
        $user = Auth::user();

        $membership = TenantUser::where('tenant_id', $tenantId)
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->firstOrFail();

        $user->update(['current_tenant_id' => $tenantId]);
        $membership->update(['last_active_at' => now()]);

        return redirect()->route('web.dashboard')
            ->with('success', "Switched to workspace: {$membership->tenant->name}");
    }

    /**
     * Redirect to onboarding to create a NEW additional workspace.
     *
     * FIX: passes ?adding=1 so OnboardingController::create() bypasses
     * the "user already has a tenant → redirect to dashboard" guard.
     * Without this, users with an existing workspace could never create a second one.
     */
    public function create(): RedirectResponse
    {
        return redirect()->route('onboarding.create', ['adding' => 1]);
    }
}
