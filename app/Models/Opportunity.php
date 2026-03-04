<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Policies\OpportunityPolicy;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[UsePolicy(OpportunityPolicy::class)]
class Opportunity extends Model
{
    use HasFactory, SoftDeletes;

    public const STAGES = [
        'qualification',
        'proposal',
        'negotiation',
        'closed_won',
        'closed_lost',
    ];

    protected $fillable = [
        'lead_id',
        'assigned_to',
        'owner_id',
        'title',
        'summary',
        'description',
        'estimated_value',
        'currency',
        'probability',
        'stage',
        'expected_close_date',
        'contact_name',
        'contact_email',
        'contact_phone',
        'ai_suggestions',
    ];

    protected $casts = [
        'ai_suggestions' => 'array',
        'estimated_value' => 'decimal:2',
        'probability'     => 'integer',
        'expected_close_date' => 'datetime:Y-m-d',
        'stage' => \App\Enums\OpportunityStage::class,
    ];

    public function lead()
    {
        return $this->belongsTo(Lead::class);
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function project()
    {
        return $this->hasOne(Project::class);
    }

    /**
     * Get the proposals for this opportunity.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function proposals()
    {
        return $this->hasMany(Proposal::class);
    }

    /**
     * Get the emails associated with this opportunity.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function emails()
    {
        return $this->hasMany(Email::class);
    }
}