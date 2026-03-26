<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * HasTenantScope
 *
 * Applies automatic tenant_id filtering to every Eloquent query.
 * Add to any primary or secondary business model:
 *
 *   class Lead extends Model {
 *       use HasFactory, SoftDeletes, HasTenantScope;
 *   }
 *
 * ── CRITICAL: DO NOT ADD THIS TO ────────────────────────────────────────────
 *
 *   User          — has NO tenant_id column (has current_tenant_id instead).
 *                   Users are global; membership is via tenant_users pivot.
 *                   Adding HasTenantScope breaks ALL user queries app-wide.
 *
 *   Tenant        — the scope source itself; would create circular dependency
 *   TenantUser    — pivot table; queried globally to find memberships
 *   TenantModule  — tenant config; queried during tenant resolution
 *   Module        — global module registry
 *   Subscription  — looked up per tenant, not scoped by tenant_id
 *
 * ── SELF-PROTECTION ──────────────────────────────────────────────────────────
 *
 * This trait guards itself: if mistakenly added to User, it detects the
 * missing tenant_id column on boot and throws a clear error instead of
 * a cryptic "Column not found" SQL exception at query time.
 *
 * ── HOW IT WORKS ─────────────────────────────────────────────────────────────
 *
 * Every query: WHERE {table}.tenant_id = '{current_tenant_id}'
 * Every create: automatically sets tenant_id from app('current_tenant')
 *
 * Current tenant is bound by EnsureActiveTenant middleware:
 *   app()->instance('current_tenant', $tenant);
 *
 * When no tenant is in context (artisan, seeders), scope is silent.
 */
trait HasTenantScope
{
    /**
     * Models that must NEVER use this trait.
     * Checked on boot — throws immediately if violated.
     */
    private static array $forbiddenModels = [
        'User',
        'Tenant',
        'TenantUser',
        'TenantModule',
        'Module',
        'Subscription',
        'Domain',
    ];

    public static function bootHasTenantScope(): void
    {
        // ── Guard: refuse to boot on forbidden models ─────────────────────────
        $shortName = class_basename(static::class);
        if (in_array($shortName, self::$forbiddenModels, true)) {
            throw new \LogicException(
                "HasTenantScope cannot be used on {$shortName}. " .
                "This model is global infrastructure and must not be tenant-scoped. " .
                "Remove `use HasTenantScope` from {$shortName}."
            );
        }

        // ── Global scope: filter all queries by current tenant ────────────────
        static::addGlobalScope('tenant', function (Builder $query) {
            $tenant = self::resolveTenantFromContainer();
            if ($tenant) {
                $query->where(
                    (new static)->getTable() . '.tenant_id',
                    $tenant->id
                );
            }
        });

        // ── Creating event: auto-inject tenant_id ─────────────────────────────
        static::creating(function (Model $model) {
            if (empty($model->tenant_id)) {
                $tenant = self::resolveTenantFromContainer();
                if ($tenant) {
                    $model->tenant_id = $tenant->id;
                }
            }
        });
    }

    /**
     * Read the current tenant from the service container.
     *
     * Named resolveTenantFromContainer() — NOT currentTenant() — to avoid
     * collision with User::currentTenant() which is a BelongsTo relation.
     * PHP's MRO gives instance methods priority over trait static methods,
     * so a same-named instance method would shadow the trait's static version.
     */
    protected static function resolveTenantFromContainer(): ?\App\Models\Tenant
    {
        try {
            if (app()->bound('current_tenant')) {
                return app('current_tenant');
            }
        } catch (\Throwable) {
            // Container not fully booted (early bootstrapping)
        }

        return null;
    }

    /**
     * Remove tenant scope for this query — use in super-admin or cross-tenant
     * reporting where you need to see all tenants' data.
     *
     * Usage: Lead::withoutTenantScope()->where('status', 'won')->get();
     */
    public static function withoutTenantScope(): Builder
    {
        return static::withoutGlobalScope('tenant');
    }

    /**
     * Alias for cross-tenant queries in reporting/admin contexts.
     *
     * Usage: Lead::allTenants()->groupBy('tenant_id')->count();
     */
    public static function allTenants(): Builder
    {
        return static::withoutTenantScope();
    }
}
