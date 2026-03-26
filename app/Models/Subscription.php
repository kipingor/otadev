<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Subscription — mirrors the Stripe subscription record for a tenant.
 *
 * One per tenant. Updated via Stripe webhooks (SubscriptionController).
 *
 * IMPORTANT — tenant_id MUST be cast as 'string' (not integer).
 * The tenants table uses a string UUID primary key. If Eloquent tries to
 * cast tenant_id to int anywhere in the insert chain, it becomes 0 for
 * a UUID string — which fails the FK constraint.
 */
class Subscription extends Model
{
    protected $fillable = [
        'tenant_id',
        'stripe_subscription_id',
        'stripe_price_id',
        'plan',
        'billing_cycle',
        'status',
        'max_users',
        'amount',
        'currency',
        'trial_ends_at',
        'current_period_start',
        'current_period_end',
        'cancelled_at',
    ];

    protected $casts = [
        // Explicitly cast tenant_id as string to prevent PHP from ever coercing
        // a UUID string to integer 0 when binding to the DB query.
        'tenant_id'            => 'string',

        'amount'               => 'decimal:2',
        'max_users'            => 'integer',
        'trial_ends_at'        => 'datetime',
        'current_period_start' => 'datetime',
        'current_period_end'   => 'datetime',
        'cancelled_at'         => 'datetime',
    ];

    // ── Relations ─────────────────────────────────────────────────────────────

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id', 'id');
    }

    // ── Status Helpers ────────────────────────────────────────────────────────

    public function isActive(): bool    { return $this->status === 'active'; }
    public function isTrialing(): bool  { return $this->status === 'trialing'; }
    public function isPastDue(): bool   { return $this->status === 'past_due'; }
    public function isCancelled(): bool { return $this->status === 'cancelled'; }

    public function isAccessible(): bool
    {
        return in_array($this->status, ['active', 'trialing']);
    }

    public function daysUntilRenewal(): ?int
    {
        return $this->current_period_end
            ? (int) now()->diffInDays($this->current_period_end, false)
            : null;
    }

    public function formattedPrice(): string
    {
        $amt   = number_format((float) $this->amount, 2);
        $cycle = $this->billing_cycle === 'annual' ? 'year' : 'month';
        return "{$this->currency} {$amt} / {$cycle}";
    }

    // ── Plan Pricing ──────────────────────────────────────────────────────────

    public static function monthlyPriceFor(string $plan): float
    {
        return match ($plan) {
            'starter'    => 29.0,
            'growth'     => 79.0,
            'enterprise' => 199.0,
            default      => 0.0,
        };
    }

    public static function annualPriceFor(string $plan): float
    {
        return match ($plan) {
            'starter'    => 278.40,
            'growth'     => 758.40,
            'enterprise' => 1910.40,
            default      => 0.0,
        };
    }
}