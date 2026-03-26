<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * TenantUser — pivot model for the tenant_users table.
 *
 * Tracks per-tenant membership role and last-active timestamp.
 *
 * IMPORTANT — tenant_id must be cast as 'string' for the same reason
 * as Subscription: the tenants table uses a UUID string primary key.
 */
class TenantUser extends Model
{
    protected $table = 'tenant_users';

    protected $fillable = [
        'tenant_id', 'user_id', 'role', 'is_active', 'joined_at', 'last_active_at',
    ];

    protected $casts = [
        'tenant_id'      => 'string',   // UUID FK — must not be cast to int
        'is_active'      => 'boolean',
        'joined_at'      => 'datetime',
        'last_active_at' => 'datetime',
    ];

    // ── Relations ─────────────────────────────────────────────────────────────

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id', 'id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ── Role helpers ──────────────────────────────────────────────────────────

    public function isOwner(): bool  { return $this->role === 'owner'; }
    public function isAdmin(): bool  { return in_array($this->role, ['owner', 'admin']); }
    public function isMember(): bool { return $this->role === 'member'; }

    // ── Activity tracking ─────────────────────────────────────────────────────

    /** Called by EnsureActiveTenant (throttled to once per 5 minutes). */
    public function touchActivity(): void
    {
        $this->update(['last_active_at' => now()]);
    }
}
