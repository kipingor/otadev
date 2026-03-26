<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Concerns\HasTenantScope;

/**
 * BUG FIX — Expense model was missing a $casts definition entirely.
 *
 * The `lines` column is declared as JSON in the migration and the factory
 * produces PHP arrays for it, but without 'lines' => 'array' in $casts,
 * Eloquent passes the raw PHP array directly to PDO on save() which throws
 * "Array to string conversion".
 *
 * Invoice has the cast correctly; this model was simply missing it.
 * Additionally added proper casts for numeric/date fields so they return
 * the right types when accessed (avoids string math in service classes).
 */
class Expense extends Model
{
    use HasFactory, SoftDeletes, HasTenantScope;

    protected $fillable = [
        'tenant_id',
        'project_id',
        'entered_by',
        'vendor',
        'description',
        'amount',
        'currency',
        'incurred_at',
        'receipt_path',
        'lines',
        'notes',
        'category',
    ];

    // FIX: was missing entirely — 'lines' => 'array' is required so Eloquent
    // auto-encodes on save and auto-decodes on fetch, matching the json column type.
    protected $casts = [
        'lines'       => 'array',
        'amount'      => 'decimal:2',
        'incurred_at' => 'date',
    ];

    // ── Relations ─────────────────────────────────────────────────────────────

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    public function enteredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'entered_by');
    }

    // Keep old relation name for backwards compatibility
    public function user(): BelongsTo
    {
        return $this->enteredBy();
    }
}
