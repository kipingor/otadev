<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

/**
 * StaffProfile model represents employees and contractors in the system.
 */
class StaffProfile extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'employee_number',
        'first_name',
        'last_name',
        'email',
        'phone',
        'role',           // job title, not app role
        'hourly_rate',
        'monthly_salary',
        'skills',
        'is_contractor',
        'is_available',
    ];

    protected $casts = [
        'skills'         => 'array',
        'hourly_rate'    => 'decimal:2',
        'monthly_salary' => 'decimal:2',
        'is_contractor'  => 'boolean',
        'is_available'   => 'boolean',
    ];

    // ── Relations ─────────────────────────────────────────────────────────────

    /** The User account linked to this staff member (nullable — contractors may not have accounts). */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id', 'staff_profile_id');
    }

    /** Leave requests submitted for this staff member. */
    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class, 'staff_profile_id');
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeAvailable(Builder $query): Builder
    {
        return $query->where('is_available', true);
    }

    public function scopeContractors(Builder $query): Builder
    {
        return $query->where('is_contractor', true);
    }

    public function scopeEmployees(Builder $query): Builder
    {
        return $query->where('is_contractor', false);
    }

    // ── Accessors ─────────────────────────────────────────────────────────────

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    public function getTypeAttribute(): string
    {
        return $this->is_contractor ? 'Contractor' : 'Employee';
    }
}