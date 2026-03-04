<?php

namespace App\Models;

use App\Enums\LeadStatus;
use App\Enums\LeadType;
use App\Policies\LeadPolicy;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Jobs\ExecuteWorkflowJob;
use Number;

#[UsePolicy(LeadPolicy::class)]
class Lead extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The relationships that should always be eager loaded.
     *
     * @var array
     */
    protected $with = [];

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'title',
        'description',
        'type',
        'status',
        'created_by',
        'owner_id',
        'pipeline_stage_id',
        'order',
        'metadata',
        'ai_reviewed',
        'is_starred',
        'contacted_at',
        'qualified_at',
        'proposal_sent_at',
        'negotiation_started_at',
        'converted_to_opportunity_at',
        'won_at',
        'lost_at',
        'archived_at',
        'estimated_value',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'type' => LeadType::class,
        'status' => LeadStatus::class,
        'metadata' => 'array',
        'ai_reviewed' => 'boolean',
        'is_starred' => 'boolean',
        'order' => 'integer',
        'contacted_at' => 'datetime',
        'qualified_at' => 'datetime',
        'proposal_sent_at' => 'datetime',
        'negotiation_started_at' => 'datetime',
        'converted_to_opportunity_at' => 'datetime',
        'won_at' => 'datetime',
        'lost_at' => 'datetime',
        'archived_at' => 'datetime',
    ];

    /**
     * The attributes that should be appended to arrays.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'status_label',
        'status_color',
    ];

    protected static function booted()
    {
        static::created(function ($lead) {
            // Trigger "new_lead" workflows
            Workflow::where('enabled', true)
                ->where('trigger_type', 'new_lead')
                ->each(function ($workflow) use ($lead) {
                    ExecuteWorkflowJob::dispatch($workflow, $lead);
                });
        });

        static::updated(function ($lead) {
            // Trigger "status_change" workflows
            if ($lead->isDirty('status')) {
                Workflow::where('enabled', true)
                    ->where('trigger_type', 'status_change')
                    ->each(function ($workflow) use ($lead) {
                        ExecuteWorkflowJob::dispatch($workflow, $lead);
                    });
            }
        });
    }

    // ========== RELATIONSHIPS ==========

    /**
     * Get the user who created the lead.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the owner (assigned user) of the lead.
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Get the pipeline stage for this lead.
     */
    public function pipelineStage(): BelongsTo
    {
        return $this->belongsTo(PipelineStage::class, 'pipeline_stage_id');
    }

    /**
     * Get the questions for this lead.
     */
    public function questions(): HasMany
    {
        return $this->hasMany(LeadQuestion::class);
    }

    /**
     * Get the documents uploaded for this lead.
     */
    public function leadDocuments(): HasMany
    {
        return $this->hasMany(LeadDocument::class);
    }

    /**
     * Get the opportunity associated with this lead.
     */
    public function opportunity(): HasOne
    {
        return $this->hasOne(Opportunity::class);
    }

    /**
     * Get the proposals for this lead.
     */
    public function proposals(): HasMany
    {
        return $this->hasMany(Proposal::class);
    }

    /**
     * Get the emails associated with this lead.
     */
    public function emails(): HasMany
    {
        return $this->hasMany(Email::class);
    }

    /**
     * Get the activities for this lead.
     */
    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class, 'lead_id')->latest();
    }

    /**
     * Get the conversations for this lead.
     */
    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class);
    }

    /**
     * Get the tags for this lead.
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'lead_tag');
    }

    /**
     * Get the comments for this lead.
     */
    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable');
    }

    // ========== SCOPES ==========

    /**
     * Scope a query to only include leads of a given status.
     */
    public function scopeStatus($query, LeadStatus $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope a query to only include active leads.
     */
    public function scopeActive($query)
    {
        return $query->whereIn('status', LeadStatus::active());
    }

    /**
     * Scope a query to only include archived leads.
     */
    public function scopeArchived($query)
    {
        return $query->where('status', LeadStatus::ARCHIVED);
    }

    /**
     * Scope a query to only include won leads.
     */
    public function scopeWon($query)
    {
        return $query->where('status', LeadStatus::WON);
    }

    /**
     * Scope a query to only include lost leads.
     */
    public function scopeLost($query)
    {
        return $query->where('status', LeadStatus::LOST);
    }

    /**
     * Scope a query to filter by owner.
     */
    public function scopeOwnedBy($query, int $userId)
    {
        return $query->where('owner_id', $userId);
    }

    /**
     * Scope a query to filter by pipeline stage.
     */
    public function scopeInStage($query, int $stageId)
    {
        return $query->where('pipeline_stage_id', $stageId);
    }

    /**
     * Scope a query to only include starred leads.
     */
    public function scopeStarred($query)
    {
        return $query->where('is_starred', true);
    }

    // ========== ACCESSORS ==========

    /**
     * Get the status label.
     */
    public function getStatusLabelAttribute(): string
    {
        return $this->status->label();
    }

    /**
     * Get the status color.
     */
    public function getStatusColorAttribute(): string
    {
        return $this->status->color();
    }

    // ========== MUTATORS ==========

    /**
     * Set the metadata attribute.
     */
    public function setMetadataAttribute($value): void
    {
        $this->attributes['metadata'] = is_array($value)
            ? json_encode($value)
            : $value;
    }

    // ========== HELPER METHODS ==========

    /**
     * Check if lead is in a terminal status.
     */
    public function isTerminal(): bool
    {
        return $this->status->isTerminal();
    }

    /**
     * Check if lead can transition to given status.
     */
    public function canTransitionTo(LeadStatus $status): bool
    {
        return $this->status->canTransitionTo($status);
    }

    /**
     * Check if lead has been contacted.
     */
    public function isContacted(): bool
    {
        return $this->contacted_at !== null;
    }

    /**
     * Check if lead has been qualified.
     */
    public function isQualified(): bool
    {
        return $this->qualified_at !== null;
    }

    /**
     * Check if lead has been converted to opportunity.
     */
    public function isConverted(): bool
    {
        return $this->converted_to_opportunity_at !== null;
    }

    /**
     * Get days since creation.
     */
    public function daysSinceCreation(): int
    {
        return $this->created_at->diffInDays(now());
    }

    /**
     * Get days in current stage.
     */
    public function daysInCurrentStage(): int
    {
        // This would need activity tracking to be accurate
        // For now, return days since last status change
        $lastStatusChange = $this->updated_at;
        return $lastStatusChange->diffInDays(now());
    }

    /**
     * Get the relationships that should be eager loaded on index queries.
     * ✅ IMPROVEMENT: Use this in LeadService to prevent N+1 queries
     */
    public static function indexQuery()
    {
        return self::with(['owner:id,name,email', 'pipelineStage:id,key,name']);
    }

    /**
     * Get the relationships that should be eager loaded on show queries.
     */
    public static function detailQuery()
    {
        return self::with([
            'owner:id,name,email',
            'user:id,name,email',
            'pipelineStage:id,key,name',
            'questions',
            'leadDocuments',
            'opportunity',
            'proposals',
        ]);
    }
}
