<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tender extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'owner_id', 'lead_id', 'opportunity_id', 'project_id',
        'title', 'reference_number', 'issuer',
        'document_path', 'document_name',
        'status', 'submission_deadline', 'submitted_at',
        'estimated_value', 'currency',
        'extracted_data', 'ai_analysis',
        'checklist', 'information_gaps', 'generated_documents',
        'agent_conversation', 'notes', 'metadata',
    ];

    protected $casts = [
        'submission_deadline'  => 'date',
        'submitted_at'         => 'date',
        'estimated_value'      => 'decimal:2',
        'extracted_data'       => 'array',
        'ai_analysis'          => 'array',
        'checklist'            => 'array',
        'information_gaps'     => 'array',
        'generated_documents'  => 'array',
        'agent_conversation'   => 'array',
        'metadata'             => 'array',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function opportunity(): BelongsTo
    {
        return $this->belongsTo(Opportunity::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function daysUntilDeadline(): ?int
    {
        if (!$this->submission_deadline) return null;
        return (int) now()->startOfDay()->diffInDays($this->submission_deadline, false);
    }

    public function checklistProgress(): array
    {
        $items   = $this->checklist ?? [];
        $total   = count($items);
        $done    = count(array_filter($items, fn($i) => $i['done'] ?? false));
        return [
            'total'   => $total,
            'done'    => $done,
            'percent' => $total > 0 ? (int) round($done / $total * 100) : 0,
        ];
    }

    public function unresolvedGaps(): int
    {
        return count(array_filter($this->information_gaps ?? [], fn($g) => !($g['resolved'] ?? false)));
    }
}