<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;
use Stancl\Tenancy\Events;
use Stancl\Tenancy\Listeners;
use Stancl\Tenancy\Middleware;
use Stancl\Tenancy\Events\TenancyBootstrapped;
use Stancl\Tenancy\Events\TenancyEnded;
use Stancl\Tenancy\Events\TenantCreated;

/**
 * TenancyServiceProvider
 *
 * Configured for single-database tenancy.
 *
 * ─── BUG FIX: Subscription creation removed from TenantCreated hook ──────────
 *
 * Previously, configureTenantCreatedHook() created a Subscription record when
 * the TenantCreated event fired. TenantService::createTenant() ALSO created a
 * Subscription. This caused two problems:
 *
 * 1. The event fires synchronously DURING Tenant::create(), before TenantService
 *    gets the $tenant object back. If the event's $tenant->id resolved to 0
 *    (the stancl post-create id resolution edge case), the first Subscription
 *    insert failed with an FK violation, rolling back the entire transaction.
 *
 * 2. Even if the first succeeded, TenantService then attempted a second
 *    Subscription::create() — a duplicate in the same transaction.
 *
 * Fix: Subscription creation is now ONLY in TenantService::createTenant().
 * This hook is kept as a safety net for non-TenantService tenant creation
 * (e.g. seeders, artisan commands, tests), but it no longer creates Subscriptions.
 * ─────────────────────────────────────────────────────────────────────────────
 */
class TenancyServiceProvider extends ServiceProvider
{
    public static string $controllerNamespace = '';

    public function events(): array
    {
        return [
            Events\CreatingTenant::class  => [],
            Events\TenantCreated::class   => [
                // Single-DB mode: no CreateDatabase / MigrateDatabase jobs.
                // Subscription creation happens in TenantService::createTenant(),
                // NOT here — see class docblock for why.
            ],
            Events\SavingTenant::class    => [],
            Events\TenantSaved::class     => [],
            Events\UpdatingTenant::class  => [],
            Events\TenantUpdated::class   => [],
            Events\DeletingTenant::class  => [],
            Events\TenantDeleted::class   => [
                // Single-DB mode: no DeleteDatabase job.
                // Add data purge jobs here if you want to wipe tenant rows:
                // \App\Jobs\Tenant\PurgeTenantData::class,
            ],

            Events\CreatingDomain::class  => [],
            Events\DomainCreated::class   => [],
            Events\SavingDomain::class    => [],
            Events\DomainSaved::class     => [],
            Events\UpdatingDomain::class  => [],
            Events\DomainUpdated::class   => [],
            Events\DeletingDomain::class  => [],
            Events\DomainDeleted::class   => [],

            Events\DatabaseCreated::class    => [],
            Events\DatabaseMigrated::class   => [],
            Events\DatabaseSeeded::class     => [],
            Events\DatabaseRolledBack::class => [],
            Events\DatabaseDeleted::class    => [],

            Events\InitializingTenancy::class    => [],
            Events\TenancyInitialized::class     => [
                Listeners\BootstrapTenancy::class,
            ],
            Events\EndingTenancy::class          => [],
            Events\TenancyEnded::class           => [
                Listeners\RevertToCentralContext::class,
            ],
            Events\BootstrappingTenancy::class   => [],
            Events\TenancyBootstrapped::class    => [],
            Events\RevertingToCentralContext::class => [],
            Events\RevertedToCentralContext::class  => [],

            Events\SyncedResourceSaved::class => [
                Listeners\UpdateSyncedResource::class,
            ],
            Events\SyncedResourceChangedInForeignDatabase::class => [],
        ];
    }

    public function register(): void {}

    public function boot(): void
    {
        $this->bootEvents();

        // mapRoutes() REMOVED — loading tenant.php via booted() caused duplicate
        // route registration and the infinite redirect loop. All routes are in web.php.

        $this->makeTenancyMiddlewareHighestPriority();
        $this->configureSpatiePermissionCacheIsolation();
        $this->defineModuleGates();
        $this->defineTenantGates();
        $this->configureTenantCreatedHook();
    }

    // ── 1. Spatie Permission cache isolation ──────────────────────────────────

    private function configureSpatiePermissionCacheIsolation(): void
    {
        Event::listen(TenancyBootstrapped::class, function (TenancyBootstrapped $event) {
            $tenantId = $event->tenancy->tenant->id;
            config(['permission.cache.key' => "spatie.permission.cache.{$tenantId}"]);
            app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
        });

        Event::listen(TenancyEnded::class, function () {
            config(['permission.cache.key' => 'spatie.permission.cache']);
            app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
        });
    }

    // ── 2. Module Gates ───────────────────────────────────────────────────────

    private function defineModuleGates(): void
    {
        $moduleKeys = [
            'leads', 'pipeline', 'contacts', 'opportunities',
            'projects', 'accounting', 'clients', 'analytics',
            'supply_chain', 'hr',
        ];

        foreach ($moduleKeys as $key) {
            Gate::define("module:{$key}", function ($user) use ($key) {
                $tenant = $user->currentTenant;
                if (!$tenant || !$tenant->isActive()) {
                    return false;
                }
                return $tenant->hasModule($key);
            });
        }
    }

    // ── 3. Tenant-level Gates ─────────────────────────────────────────────────

    private function defineTenantGates(): void
    {
        Gate::define('tenant:invite-user', function ($user) {
            $tenant = $user->currentTenant;
            return $tenant && $user->isAdminOf($tenant) && $tenant->withinUserLimit();
        });

        Gate::define('tenant:manage-billing', function ($user) {
            $tenant = $user->currentTenant;
            return $tenant && $user->isOwnerOf($tenant);
        });

        Gate::define('tenant:manage-settings', function ($user) {
            $tenant = $user->currentTenant;
            return $tenant && $user->isAdminOf($tenant);
        });

        Gate::define('manage-tenants', function ($user) {
            return $user->hasRole('super-admin');
        });

        Gate::before(function ($user) {
            if ($user->hasRole('super-admin')) {
                return true;
            }
        });
    }

    // ── 4. TenantCreated hook ─────────────────────────────────────────────────

    /**
     * Safety net for tenant creation paths that bypass TenantService
     * (e.g. seeders, artisan commands, tests that call Tenant::create() directly).
     *
     * IMPORTANT: This does NOT create a Subscription — that is TenantService's job.
     * If we also did it here we'd get a duplicate create inside the same transaction
     * (and a potential FK violation if $tenant->id isn't resolved yet at event time).
     *
     * This only enables an initial module from tenant data if set, as a convenience
     * for test/seeder flows that don't go through OnboardingController.
     */
    private function configureTenantCreatedHook(): void
    {
        Event::listen(TenantCreated::class, function (TenantCreated $event) {
            $tenant = $event->tenant;

            // Only enable initial_module if it was stored in tenant data
            // AND the modules table exists (guard against running before migrations).
            $initialModule = $tenant->data['initial_module'] ?? null;

            if ($initialModule && \Illuminate\Support\Facades\Schema::hasTable('modules')) {
                try {
                    $tenant->enableModule($initialModule);
                } catch (\Throwable $e) {
                    Log::warning('TenantCreated hook: could not enable initial module', [
                        'tenant_id' => $tenant->id,
                        'module'    => $initialModule,
                        'error'     => $e->getMessage(),
                    ]);
                }
            }
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    protected function bootEvents(): void
    {
        foreach ($this->events() as $event => $listeners) {
            foreach ($listeners as $listener) {
                if ($listener instanceof \Stancl\JobPipeline\JobPipeline) {
                    $listener = $listener->toListener();
                }
                Event::listen($event, $listener);
            }
        }
    }

    protected function makeTenancyMiddlewareHighestPriority(): void
    {
        $tenancyMiddleware = [
            Middleware\PreventAccessFromCentralDomains::class,
            Middleware\InitializeTenancyByDomain::class,
            Middleware\InitializeTenancyBySubdomain::class,
            Middleware\InitializeTenancyByDomainOrSubdomain::class,
            Middleware\InitializeTenancyByPath::class,
            Middleware\InitializeTenancyByRequestData::class,
        ];

        foreach (array_reverse($tenancyMiddleware) as $middleware) {
            $this->app[\Illuminate\Contracts\Http\Kernel::class]
                ->prependToMiddlewarePriority($middleware);
        }
    }
}
