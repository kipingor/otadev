<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * TenantModule
 *
 * Explicit pivot model for the tenant_modules table.
 * Used by Tenant::tenantModules() (HasMany) for bulk updates like:
 *   $tenant->tenantModules()->update(['is_enabled' => false]);
 *
 * The BelongsToMany relation Tenant::modules() also uses this table
 * but goes through Eloquent's pivot mechanism, not this model directly.
 */
class TenantModule extends Model
{
    protected $table = 'tenant_modules';

    protected $fillable = [
        'tenant_id', 'module_id', 'is_enabled', 'enabled_at',
    ];

    protected $casts = [
        'is_enabled'  => 'boolean',
        'enabled_at'  => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id', 'id');
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }
}