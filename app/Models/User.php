<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

/**
 * User model.
 *
 * ── WHY HasTenantScope MUST NOT BE USED HERE ────────────────────────────────
 *
 * Users are GLOBAL — one user can belong to multiple tenants.
 * The users table has NO tenant_id column; it has current_tenant_id (session).
 * Tenant membership is expressed via the tenant_users pivot table.
 *
 * The automated patch script incorrectly added HasTenantScope to this model.
 * Every User query then got WHERE users.tenant_id = ? appended, causing:
 *   SQLSTATE[42S22]: Column not found: 1054 Unknown column 'users.tenant_id'
 *
 * This broke login, onboarding, the dashboard, and any query touching User.
 */
class User extends Authenticatable
{
    use HasFactory, Notifiable, TwoFactorAuthenticatable, HasRoles;
    // HasTenantScope intentionally NOT included — see docblock above.

    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar',
        'role',
        'current_tenant_id',
        'is_client',
        'client_since',
        'company',
        'phone',
        'address',
        'website',
        'notes',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password'          => 'hashed',
        'is_client'         => 'boolean',
        'client_since'      => 'date',
    ];

    // ── Tenant Relations ──────────────────────────────────────────────────────

    public function currentTenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'current_tenant_id', 'id');
    }

    public function tenants(): BelongsToMany
    {
        return $this->belongsToMany(Tenant::class, 'tenant_users', 'user_id', 'tenant_id')
            ->withPivot(['role', 'is_active', 'joined_at', 'last_active_at'])
            ->withTimestamps();
    }

    public function currentTenantMembership(): ?TenantUser
    {
        if (!$this->current_tenant_id) {
            return null;
        }
        return TenantUser::where('tenant_id', $this->current_tenant_id)
            ->where('user_id', $this->id)
            ->first();
    }

    public function tenantRole(string $tenantId): ?string
    {
        $pivot = TenantUser::where('tenant_id', $tenantId)
            ->where('user_id', $this->id)
            ->first();
        return $pivot?->role;
    }

    public function isOwnerOf(Tenant $tenant): bool
    {
        return $this->tenantRole($tenant->id) === 'owner';
    }

    public function isAdminOf(Tenant $tenant): bool
    {
        return in_array($this->tenantRole($tenant->id), ['owner', 'admin']);
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeClients(Builder $query): Builder
    {
        return $query->where('is_client', true);
    }

    public function scopeClient(Builder $query): Builder
    {
        return $query->where('is_client', true);
    }

    public function scopeForTenant(Builder $query, string $tenantId): Builder
    {
        return $query->whereHas('tenants', fn ($q) => $q->where('tenant_id', $tenantId));
    }

    public function convertToClient(): static
    {
        $this->update([
            'is_client'    => true,
            'client_since' => $this->client_since ?? now(),
        ]);
        return $this;
    }

    // ── Relations ─────────────────────────────────────────────────────────────

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class, 'client_id');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'client_id');
    }

    public function clientFollowUps(): HasMany
    {
        return $this->hasMany(ClientFollowUp::class, 'client_id');
    }

    public function clientReports(): HasMany
    {
        return $this->hasMany(ClientReport::class, 'client_id');
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class, 'client_id');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public function getIsClientAttribute(): bool
    {
        return (bool) ($this->attributes['is_client'] ?? false);
    }

    public function getDisplayRoleAttribute(): string
    {
        return $this->is_client ? 'Client' : ucfirst($this->role ?? 'user');
    }
}
