<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Opportunity extends Model
{
    use HasFactory, SoftDeletes;

    public const STAGES = [
        'prospect',
        'proposal',
        'negotiation',
        'won',
        'lost',
    ];

    protected $fillable = [
        'lead_id',
        'title',
        'summary',
        'estimated_value',
        'currency',
        'stage',
        'owner_id',
        'expected_close_date',
        'ai_suggestions',
    ];

    protected $casts = [
        'ai_suggestions' => 'array',
        'estimated_value' => 'decimal:2',
        'expected_close_date' => 'datetime',
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
}
