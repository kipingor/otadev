<?php

declare(strict_types=1);

use App\Http\Controllers\Web\Onboarding\OnboardingController;
use App\Http\Controllers\Web\Onboarding\SubscriptionController;
use App\Http\Controllers\Web\Onboarding\TenantSwitchController;
use App\Http\Controllers\SuperAdmin\TenantController as SuperAdminTenantController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

/*
|--------------------------------------------------------------------------
| Central Routes  (routes/central.php)
|--------------------------------------------------------------------------
| These routes run in the "central" application context — i.e. they are
| NOT scoped to any tenant and tenant_id global scopes are NOT active.
|
| Covers:
|   /           — marketing / welcome
|   /register   — new tenant signup (onboarding)
|   /onboarding — post-register workspace setup + module picker
|   /subscription — plan selection, upgrade, billing
|   /switch-tenant — switch between tenants for multi-membership users
|   /super-admin — internal admin panel (requires super-admin role)
|
| How stancl/tenancy loads this file:
|   In TenancyServiceProvider::boot() call:
|     $this->mapCentralRoutes();
|   Which uses routes/central.php as the central route file.
|
| In the current single-file web.php setup, add this content to the top
| of web.php BEFORE the authenticated group, or include it:
|   require base_path('routes/central.php');
*/

// ── Public root ───────────────────────────────────────────────────────────────
Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('web.dashboard');
    }
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('/welcome', fn () => redirect()->route('home'));

// ── Onboarding (post-registration workspace setup) ────────────────────────────
// After a user registers via Fortify, they are redirected here to:
//   1. Create their workspace (tenant)
//   2. Pick one free module (freemium)
//   3. Optionally upgrade immediately
Route::middleware(['auth', 'verified'])->prefix('onboarding')->name('onboarding.')->group(function () {
    Route::get('/',                      [OnboardingController::class, 'index'])->name('index');
    Route::get('/create',                [OnboardingController::class, 'create'])->name('create');
    Route::post('/create',               [OnboardingController::class, 'store'])->name('store');
    Route::get('/pick-module',           [OnboardingController::class, 'pickModule'])->name('pick-module');
    Route::post('/pick-module',          [OnboardingController::class, 'saveModule'])->name('save-module');
    Route::get('/complete',              [OnboardingController::class, 'complete'])->name('complete');
});

// ── Subscription management ───────────────────────────────────────────────────
Route::middleware(['auth', 'verified', 'tenant'])->prefix('subscription')->name('subscription.')->group(function () {
    Route::get('/plans',    [SubscriptionController::class, 'plans'])->name('plans');
    Route::post('/upgrade', [SubscriptionController::class, 'upgrade'])->name('upgrade');
    Route::post('/cancel',  [SubscriptionController::class, 'cancel'])->name('cancel');
    Route::get('/billing',  [SubscriptionController::class, 'billing'])->name('billing');

    // Status pages (no module check — must be accessible on any plan/state)
    Route::get('/expired',   [SubscriptionController::class, 'expired'])->name('expired');
    Route::get('/suspended', [SubscriptionController::class, 'suspended'])->name('suspended');

    // Stripe webhooks (no auth — Stripe posts here directly)
    Route::post('/webhook/stripe', [SubscriptionController::class, 'stripeWebhook'])
        ->name('webhook.stripe')
        ->withoutMiddleware(['auth', 'verified', 'tenant']);
});

// ── Tenant switcher (users who belong to multiple tenants) ────────────────────
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/switch-tenant',          [TenantSwitchController::class, 'index'])->name('tenant.switch');
    Route::post('/switch-tenant/{tenant}',[TenantSwitchController::class, 'switch'])->name('tenant.switch.post');
    Route::get('/create-tenant',          [TenantSwitchController::class, 'create'])->name('tenant.create');
});

// ── Super Admin panel ─────────────────────────────────────────────────────────
// Protected by Gate::define('manage-tenants') in TenancyServiceProvider.
Route::middleware(['auth', 'verified', 'can:manage-tenants'])
    ->prefix('super-admin')
    ->name('super-admin.')
    ->group(function () {
        Route::get('/',                          fn () => redirect()->route('super-admin.tenants.index'));
        Route::get('/tenants',                   [SuperAdminTenantController::class, 'index'])->name('tenants.index');
        Route::get('/tenants/{tenant}',          [SuperAdminTenantController::class, 'show'])->name('tenants.show');
        Route::patch('/tenants/{tenant}/plan',   [SuperAdminTenantController::class, 'updatePlan'])->name('tenants.plan');
        Route::patch('/tenants/{tenant}/status', [SuperAdminTenantController::class, 'updateStatus'])->name('tenants.status');
        Route::post('/tenants/{tenant}/impersonate', [SuperAdminTenantController::class, 'impersonate'])->name('tenants.impersonate');
    });