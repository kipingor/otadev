<?php

declare(strict_types=1);

use Stancl\Tenancy\Database\Models\Domain;
use App\Models\Tenant;

return [

    'tenant_model' => Tenant::class,

    /*
    |--------------------------------------------------------------------------
    | ID Generator
    |--------------------------------------------------------------------------
    | FIX: Was set to null, which disabled stancl's automatic UUID generation
    | and forced us to manually pass 'id' => Str::uuid() in Tenant::create().
    |
    | The problem: when id_generator = null, stancl's creating event skips ID
    | generation. We then pass 'id' manually — but after Tenant::create()
    | returns, $tenant->getKey() was calling castKey() which (if $keyType
    | wasn't reliably inherited as 'string') cast the UUID to (int) = 0.
    |
    | Fix: Use stancl's built-in UUIDGenerator. stancl's creating event
    | generates the UUID internally before the model is saved, ensuring it
    | is set as a proper string on the model instance. This also means
    | TenantService::createTenant() should NOT pass 'id' manually — stancl
    | will assign it, and $tenant->id will be the correct UUID string after save.
    */
    'id_generator' => Stancl\Tenancy\UUIDGenerator::class,

    'domain_model' => Domain::class,

    /*
    |--------------------------------------------------------------------------
    | Central Domains
    |--------------------------------------------------------------------------
    | Requests to these domains are treated as "central" — landing page,
    | onboarding, billing, super-admin. All other subdomains are tenants.
    | APP_DOMAIN in .env should match your base domain (e.g. example.com).
    */
    'central_domains' => [
        env('APP_DOMAIN', 'localhost'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Tenancy Bootstrappers
    |--------------------------------------------------------------------------
    | Single-DB mode: DatabaseTenancyBootstrapper is intentionally EXCLUDED.
    | All data lives in one DB separated by tenant_id columns + global scopes.
    |
    | CacheTenancyBootstrapper: prefixes every cache key with the tenant ID.
    |   This is essential for Spatie Permission cache isolation — without it,
    |   tenant A's role cache could be served to tenant B.
    |
    | FilesystemTenancyBootstrapper: isolates uploaded files per tenant.
    | QueueTenancyBootstrapper: carries tenant context into queued jobs.
    */
    'bootstrappers' => [
        Stancl\Tenancy\Bootstrappers\CacheTenancyBootstrapper::class,
        Stancl\Tenancy\Bootstrappers\FilesystemTenancyBootstrapper::class,
        Stancl\Tenancy\Bootstrappers\QueueTenancyBootstrapper::class,
    ],

    /*
    |--------------------------------------------------------------------------
    | Database
    |--------------------------------------------------------------------------
    | Single-DB tenancy: no separate tenant databases are created.
    */
    'database' => [
        'central_connection'       => env('DB_CONNECTION', 'mysql'),
        'template_tenant_connection' => null,
    ],

    /*
    |--------------------------------------------------------------------------
    | Cache
    |--------------------------------------------------------------------------
    */
    'cache' => [
        'tag_base' => 'tenant',
    ],

    /*
    |--------------------------------------------------------------------------
    | Filesystem
    |--------------------------------------------------------------------------
    | Tenant uploads are stored under storage/app/tenants/{tenant_id}/.
    */
    'filesystem' => [
        'suffix_base' => 'tenant',
        'disks'       => ['local', 'public'],
        'root_override' => [
            'local'  => '%storage_path%/app/tenants/%tenant%/',
            'public' => '%storage_path%/app/public/tenants/%tenant%/',
        ],
    ],

    'features' => [],

    'migration_parameters' => [
        '--force' => true,
        '--path'  => database_path('migrations/tenant'),
    ],

    'seeder_parameters' => [
        '--class' => 'Database\Seeders\TenantSeeder',
    ],
];