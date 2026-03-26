<?php

namespace App\Listeners\Tenant;

use Spatie\Permission\PermissionRegistrar;
use Stancl\Tenancy\Events\TenancyBootstrapped;
use Stancl\Tenancy\Events\TenancyEnded;

/**
 * FlushPermissionCache
 *
 * WHY THIS EXISTS:
 * Spatie Laravel Permission caches all roles and permissions in a single
 * cache key (`spatie.permission.cache`). In a multi-tenant app this is
 * a serious security problem — tenant A's permissions would be returned
 * for tenant B if the cache was warmed by tenant A's request first.
 *
 * HOW WE FIX IT:
 * 1. The CacheTenancyBootstrapper (in config/tenancy.php bootstrappers)
 *    automatically prefixes every cache key with the current tenant ID,
 *    so `spatie.permission.cache` becomes `tenant_{id}_spatie.permission.cache`.
 *
 * 2. BUT: the PermissionRegistrar holds a static in-memory cache
 *    ($this->permissions) that survives the cache prefix change within
 *    the same PHP process (e.g. Octane or long-running workers).
 *    We must call `forgetCachedPermissions()` to clear that static cache.
 *
 * 3. We do this on BOTH TenancyBootstrapped (entering tenant context) AND
 *    TenancyEnded (returning to central context) to ensure the registrar
 *    is always re-populated from the correct (now-prefixed) cache store.
 *
 * RESULT: Every tenant request gets its own isolated permission cache.
 * No cross-tenant permission leakage.
 */
class FlushPermissionCache
{
    public function __construct(
        protected PermissionRegistrar $permissionRegistrar
    ) {}

    public function handle(TenancyBootstrapped|TenancyEnded $event): void
    {
        $this->permissionRegistrar->forgetCachedPermissions();
    }
}