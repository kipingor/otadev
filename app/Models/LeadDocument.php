<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadDocument extends Model
{
    /**
     * Status constants
     */
    public const STATUS_QUEUED = 'queued';
    public const STATUS_PENDING = 'pending';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_SUCCEEDED = 'succeeded';
    public const STATUS_FAILED = 'failed';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'lead_id',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
        'processed',
        'status',
        'extracted_text',
        'metadata',
        'ai_summary',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'processed' => 'boolean',
        'metadata' => 'array',
        'ai_summary' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the lead that owns the document.
     */
    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    /**
     * Get all available statuses
     */
    public static function getStatuses(): array
    {
        return [
            self::STATUS_QUEUED,
            self::STATUS_PENDING,
            self::STATUS_PROCESSING,
            self::STATUS_SUCCEEDED,
            self::STATUS_FAILED,
        ];
    }

    /**
     * Check if document is queued
     */
    public function isQueued(): bool
    {
        return $this->status === self::STATUS_QUEUED;
    }

    /**
     * Check if document is pending
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Check if document is processing
     */
    public function isProcessing(): bool
    {
        return $this->status === self::STATUS_PROCESSING;
    }

    /**
     * Check if document processing succeeded
     */
    public function isSucceeded(): bool
    {
        return $this->status === self::STATUS_SUCCEEDED;
    }

    /**
     * Check if document processing failed
     */
    public function isFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }

    /**
     * Mark as processing
     */
    public function markAsProcessing(): void
    {
        $this->update(['status' => self::STATUS_PROCESSING]);
    }

    /**
     * Mark as succeeded
     */
    public function markAsSucceeded(): void
    {
        $this->update([
            'status' => self::STATUS_SUCCEEDED,
            'processed' => true,
        ]);
    }

    /**
     * Mark as failed
     */
    public function markAsFailed(?string $error = null): void
    {
        $metadata = $this->metadata ?? [];
        
        if ($error) {
            $metadata['processing_error'] = $error;
            $metadata['processing_failed_at'] = now()->toISOString();
        }

        $this->update([
            'status' => self::STATUS_FAILED,
            'processed' => false,
            'metadata' => $metadata,
        ]);
    }
}