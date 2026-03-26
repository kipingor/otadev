<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Module — a purchasable feature block (leads, accounting, hr, etc.)
 *
 * @property int    $id
 * @property string $key              e.g. 'leads', 'accounting'
 * @property string $name
 * @property string $description
 * @property string $icon             Lucide icon name
 * @property bool   $is_free          Available on the free/freemium plan
 * @property bool   $is_active
 * @property array  $plan_availability e.g. ['free','starter','growth','enterprise']
 */
class Module extends Model
{
    protected $fillable = [
        'key', 'name', 'description', 'icon',
        'is_free', 'is_active', 'sort_order', 'plan_availability',
    ];

    protected $casts = [
        'is_free'           => 'boolean',
        'is_active'         => 'boolean',
        'plan_availability' => 'array',
    ];

    // ── Relations ─────────────────────────────────────────────────────────────

    public function tenants(): BelongsToMany
    {
        return $this->belongsToMany(Tenant::class, 'tenant_modules', 'module_id', 'tenant_id')
            ->withPivot(['is_enabled', 'enabled_at'])
            ->withTimestamps();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public function isAvailableOnPlan(string $plan): bool
    {
        return in_array($plan, $this->plan_availability ?? []);
    }

    public static function freeModules(): \Illuminate\Database\Eloquent\Collection
    {
        return static::where('is_free', true)->where('is_active', true)->orderBy('sort_order')->get();
    }

    public static function forPlan(string $plan): \Illuminate\Database\Eloquent\Collection
    {
        return static::where('is_active', true)
            ->whereJsonContains('plan_availability', $plan)
            ->orderBy('sort_order')
            ->get();
    }
}