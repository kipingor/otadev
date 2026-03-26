<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Concerns\HasTenantScope;

class Invoice extends Model
{
    use HasFactory, SoftDeletes, HasTenantScope;

    protected $fillable = [
        'tenant_id',
        'project_id', 'client_id', 'number', 'status', 'currency',
        'issue_date', 'due_date', 'sent_at',
        'subtotal', 'tax', 'total',
        'lines', 'notes',
    ];

    protected $casts = [
        'lines'      => 'array',
        'subtotal'   => 'decimal:2',
        'tax'        => 'decimal:2',
        'total'      => 'decimal:2',
        'issue_date' => 'date',
        'due_date'   => 'date',
        'sent_at'    => 'datetime',
    ];

    // ── Status helpers ─────────────────────────────────────────────────────

    public function isOverdue(): bool
    {
        return $this->status !== 'paid'
            && $this->status !== 'cancelled'
            && $this->due_date
            && $this->due_date->isPast();
    }

    public function amountPaid(): float
    {
        return (float) $this->payments()->sum('amount');
    }

    public function amountDue(): float
    {
        return max(0, (float) $this->total - $this->amountPaid());
    }

    // ── Auto-generate invoice number ──────────────────────────────────────

    protected static function booted(): void
    {
        static::creating(function (Invoice $invoice) {
            if (empty($invoice->number)) {
                $year  = now()->year;
                $count = static::whereYear('created_at', $year)->withTrashed()->count() + 1;
                $invoice->number = sprintf('INV-%d-%04d', $year, $count);
            }
        });
    }

    // ── Relationships ──────────────────────────────────────────────────────

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function followUps(): HasMany
    {
        return $this->hasMany(ClientFollowUp::class);
    }
}
