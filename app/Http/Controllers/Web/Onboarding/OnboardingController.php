<?php

namespace App\Http\Controllers\Web\Onboarding;

use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Models\Tenant;
use App\Services\Tenant\TenantService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * OnboardingController
 *
 * Handles three-step workspace creation:
 *   Step 1 — /onboarding/create      → workspace name, timezone, currency
 *   Step 2 — /onboarding/pick-module → choose one free module
 *   Step 3 — /onboarding/complete    → success + upgrade prompt
 *
 * ── MULTI-COMPANY FIX ────────────────────────────────────────────────────────
 *
 * The previous version checked `if ($user->current_tenant_id)` in create()
 * and redirected to the dashboard. This prevented users who already had one
 * workspace from creating additional ones via /create-tenant.
 *
 * Fix: the create() method accepts an optional `?adding=1` query param.
 * When present, the "already has a tenant" guard is bypassed so the user
 * can fill in details for a second (or third) workspace.
 *
 * The TenantSwitchController::create() route passes this automatically.
 *
 * ── REGISTRATION → ONBOARDING ────────────────────────────────────────────────
 *
 * Fortify's home is '/dashboard'. After registration, EnsureActiveTenant fires
 * and redirects the new user to /onboarding/create because they have no tenant.
 * This is correct behaviour — the registration page itself does not change,
 * but the flow automatically lands here immediately after account creation.
 *
 * To make this explicit, CreateNewUser (Fortify action) can be updated to
 * redirect straight to /onboarding after creating the user account.
 */
class OnboardingController extends Controller
{
    public function __construct(protected TenantService $tenantService)
    {
    }

    // ── Step 0: index redirect ────────────────────────────────────────────────

    public function index(): RedirectResponse
    {
        $user = Auth::user();

        if ($user->current_tenant_id) {
            return redirect()->route('web.dashboard');
        }

        return redirect()->route('onboarding.create');
    }

    // ── Step 1: workspace creation form ──────────────────────────────────────

    /**
     * @param Request $request
     *   ?adding=1  — bypass the "has existing tenant" redirect so users can
     *                create additional workspaces from the switcher page.
     */
    public function create(Request $request): Response|RedirectResponse
    {
        $user    = Auth::user();
        $adding  = $request->boolean('adding');

        // Only redirect to dashboard/pick-module if NOT explicitly creating
        // a new additional workspace. This allows multi-company users.
        if (!$adding && $user->current_tenant_id) {
            return redirect()->route('web.dashboard');
        }

        return Inertia::render('onboarding/create', [
            'timezones'  => timezone_identifiers_list(),
            'currencies' => ['KES', 'USD', 'EUR', 'GBP', 'ZAR', 'NGN', 'GHS'],
            'is_adding'  => $adding, // passed to frontend for context (e.g. different heading)
        ]);
    }

    // ── Step 1 submit ─────────────────────────────────────────────────────────

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:100'],
            'email'    => ['required', 'email', 'max:150'],
            'phone'    => ['nullable', 'string', 'max:20'],
            'timezone' => ['required', 'string', 'timezone'],
            'currency' => ['required', 'string', 'size:3'],
        ]);

        $user = Auth::user();

        // createTenant() sets user->current_tenant_id to the new tenant
        $this->tenantService->createTenant($user, $data);

        return redirect()->route('onboarding.pick-module');
    }

    // ── Step 2: module picker ─────────────────────────────────────────────────

    public function pickModule(): Response|RedirectResponse
    {
        $user = Auth::user();

        if (!$user->current_tenant_id) {
            return redirect()->route('onboarding.create');
        }

        $tenant = Tenant::find($user->current_tenant_id);

        return Inertia::render('onboarding/pick-module', [
            'free_modules'    => Module::freeModules(),
            'all_modules'     => Module::where('is_active', true)->orderBy('sort_order')->get(),
            'current_modules' => $tenant
                ? $tenant->enabledModules->pluck('key')->values()->toArray()
                : [],
        ]);
    }

    // ── Step 2 submit ─────────────────────────────────────────────────────────

    public function saveModule(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'module_key' => ['required', 'string', 'exists:modules,key'],
        ]);

        $user   = Auth::user();
        $tenant = Tenant::findOrFail($user->current_tenant_id);

        $module = Module::where('key', $data['module_key'])
            ->where('is_free', true)
            ->where('is_active', true)
            ->firstOrFail();

        // Free plan = 1 module: disable any previously enabled modules first
        $tenant->tenantModules()->update(['is_enabled' => false]);
        $tenant->enableModule($module->key);

        return redirect()->route('onboarding.complete');
    }

    // ── Step 3: completion screen ─────────────────────────────────────────────

    public function complete(): Response|RedirectResponse
    {
        $user   = Auth::user();
        $tenant = Tenant::find($user->current_tenant_id);

        if (!$tenant) {
            return redirect()->route('onboarding.create');
        }

        return Inertia::render('onboarding/complete', [
            'tenant'          => $tenant,
            'enabled_modules' => $tenant->enabledModules->pluck('key')->values(),
            'upgrade_plans'   => $this->tenantService->getPlanComparison(),
        ]);
    }
}
