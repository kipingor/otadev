<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lead extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'title',
        'description',
        'type', // document | conversation
        'created_by',
        'owner_id',
        'pipeline_stage_id',
        'metadata',
        'ai_reviewed',
        'contacted_at',
        'qualified_at',
        'converted_to_opportunity_at',
        'won_at',
        'lost_at',
        'archived_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'metadata' => 'array',
        'ai_reviewed' => 'boolean',
        'contacted_at' => 'datetime',
        'qualified_at' => 'datetime',
        'converted_to_opportunity_at' => 'datetime',
        'won_at' => 'datetime',
        'lost_at' => 'datetime',
        'archived_at' => 'datetime',
    ];

    /**
     * Get the user who created the lead.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the owner (assigned user) of the lead.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Get the pipeline stage for this lead.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function pipelineStage()
    {
        return $this->belongsTo(PipelineStage::class, 'pipeline_stage_id');
    }

    /**
     * Get the questions for this lead.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function questions()
    {
        return $this->hasMany(LeadQuestion::class);
    }

    /**
     * Get the opportunity associated with this lead.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasOne
     */
    public function opportunity()
    {
        return $this->hasOne(Opportunity::class);
    }
}
