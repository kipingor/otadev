<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeadQuestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'lead_id', 'question', 'answer', 'is_ai_generated', 'asked_by', 'answered'
    ];
    
    
    public function lead()
    {
    return $this->belongsTo(Lead::class, 'lead_id');
    }

    public function user()
    {
    return $this->belongsTo(User::class, 'asked_by');
    }
}
