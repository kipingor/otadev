<?php

// ─────────────────────────────────────────────────────────────────────────────
// USAGE NOTE — replacing app/Models/Client.php
//
// The Client model was a subclass of User pointing to the same `users` table.
// User already carries is_client, client_since, and all client relations.
//
// Replace all Client:: usages with User::clients() scope or User::client().
//
// Before:  Client::find($id)
// After:   User::client()->find($id)   (or just User::find($id) — same row)
//
// Before:  Client::all()
// After:   User::clients()->get()
// ─────────────────────────────────────────────────────────────────────────────

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasFactory, Notifiable, TwoFactorAuthenticatable, HasRoles;

    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar',
        'role',
        // Client fields (previously separate Client model)
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

    // ── Client Scopes (replaces Client model) ─────────────────────────────────

    /**
     * Scope to only client users.
     * Usage: User::clients()->get()
     */
    public function scopeClients(Builder $query): Builder
    {
        return $query->where('is_client', true);
    }

    /**
     * Scope to a single client.
     * Usage: User::client()->find($id)
     */
    public function scopeClient(Builder $query): Builder
    {
        return $query->where('is_client', true);
    }

    /**
     * Convert this user into a client.
     */
    public function convertToClient(): static
    {
        $this->update([
            'is_client'    => true,
            'client_since' => $this->client_since ?? now(),
        ]);
        return $this;
    }

    // ── Relations ─────────────────────────────────────────────────────────────

    /** Projects where this user is the client. */
    public function projects(): HasMany
    {
        return $this->hasMany(Project::class, 'client_id');
    }

    /** Invoices issued to this client. */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'client_id');
    }

    /** Follow-up tasks for this client. */
    public function clientFollowUps(): HasMany
    {
        return $this->hasMany(ClientFollowUp::class, 'client_id');
    }

    /** Reports generated for this client. */
    public function clientReports(): HasMany
    {
        return $this->hasMany(ClientReport::class, 'client_id');
    }

    /** Leads associated with this client. */
    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class, 'client_id');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public function getIsClientAttribute(): bool
    {
        return (bool) $this->attributes['is_client'];
    }

    public function getDisplayRoleAttribute(): string
    {
        return $this->is_client ? 'Client' : ucfirst($this->role ?? 'user');
    }
}