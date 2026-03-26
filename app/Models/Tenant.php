<?php

namespace App\Models;

use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;
use Stancl\Tenancy\Database\Concerns\HasDomains;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Tenant model for single-database multi-tenancy (stancl/tenancy v3).
 */
class Tenant extends BaseTenant
{
    use HasDomains, SoftDeletes;

    public $incrementing = false;
    protected $keyType = 'string';

    public static function getCustomColumns(): array
    {
        return [
            'id', 'name', 'slug', 'email', 'phone', 'logo_path',
            'timezone', 'currency', 'plan', 'status', 'max_users',
            'max_modules', 'stripe_customer_id', 'trial_ends_at', 'suspended_at',
        ];
    }

    protected $fillable = [
        'id', 'name', 'slug', 'email', 'phone', 'logo_path',
        'timezone', 'currency', 'plan', 'status', 'max_users',
        'max_modules', 'stripe_customer_id', 'trial_ends_at', 'suspended_at', 'data',
    ];

    protected $casts = [
        'data'          => 'array',
        'trial_ends_at' => 'datetime',
        'suspended_at'  => 'datetime',
        'max_users'     => 'integer',
        'max_modules'   => 'integer',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function tenantUsers(): HasMany
    {
        return $this->hasMany(TenantUser::class, 'tenant_id', 'id');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'tenant_users', 'tenant_id', 'user_id')
            ->withPivot(['role', 'is_active', 'joined_at', 'last_active_at'])
            ->withTimestamps();
    }

    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class, 'tenant_id', 'id');
    }

    /**
     * All module pivot rows (including disabled ones).
     * Used by OnboardingController::saveModule() to disable all before enabling one:
     *   $tenant->tenantModules()->update(['is_enabled' => false]);
     *
     * FIX: This HasMany was missing, causing BadMethodCallException on saveModule.
     */
    public function tenantModules(): HasMany
    {
        return $this->hasMany(TenantModule::class, 'tenant_id', 'id');
    }

    /** All modules via pivot (BelongsToMany — use for ->sync, ->attach, ->detach). */
    public function modules(): BelongsToMany
    {
        return $this->belongsToMany(Module::class, 'tenant_modules', 'tenant_id', 'module_id')
            ->withPivot(['is_enabled', 'enabled_at'])
            ->withTimestamps();
    }

    /** Only currently enabled modules — used everywhere for access checks. */
    public function enabledModules(): BelongsToMany
    {
        return $this->modules()->wherePivot('is_enabled', true);
    }

    // ── Plan helpers ──────────────────────────────────────────────────────────

    public function isOnFreePlan(): bool    { return $this->plan === 'free'; }
    public function isTrial(): bool         { return $this->status === 'trial'; }
    public function isActive(): bool        { return in_array($this->status, ['active', 'trial']); }
    public function isSuspended(): bool     { return $this->status === 'suspended'; }

    public function trialHasExpired(): bool
    {
        return $this->isTrial() && $this->trial_ends_at?->isPast();
    }

    // ── Module helpers ────────────────────────────────────────────────────────

    public function hasModule(string $moduleKey): bool
    {
        return $this->enabledModules()->where('modules.key', $moduleKey)->exists();
    }

    public function enableModule(string $moduleKey): void
    {
        $module = Module::where('key', $moduleKey)->firstOrFail();
        $this->modules()->syncWithoutDetaching([
            $module->id => ['is_enabled' => true, 'enabled_at' => now()],
        ]);
    }

    public function disableModule(string $moduleKey): void
    {
        $module = Module::where('key', $moduleKey)->first();
        if ($module) {
            $this->modules()->updateExistingPivot($module->id, ['is_enabled' => false]);
        }
    }

    // ── User limit helpers ────────────────────────────────────────────────────

    public function activeUserCount(): int
    {
        return $this->tenantUsers()->where('is_active', true)->count();
    }

    public function withinUserLimit(): bool
    {
        return $this->activeUserCount() < $this->max_users;
    }

    // ── Plan upgrade ──────────────────────────────────────────────────────────

    public function upgradeToPlan(string $plan): void
    {
        $limits = [
            'free'       => ['max_users' => 1,    'max_modules' => 1],
            'starter'    => ['max_users' => 5,    'max_modules' => 3],
            'growth'     => ['max_users' => 15,   'max_modules' => 9999],
            'enterprise' => ['max_users' => 9999, 'max_modules' => 9999],
        ];
        $this->update(array_merge($limits[$plan] ?? $limits['free'], [
            'plan'   => $plan,
            'status' => 'active',
        ]));
    }

    public function getAppUrl(): string
    {
        $domain = $this->domains()->first();
        return $domain
            ? 'https://' . $domain->domain
            : 'https://' . $this->slug . '.' . config('app.domain', 'example.com');
    }
}