<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Policies\ActivityPolicy;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;

#[UsePolicy(ActivityPolicy::class)]
class Activity extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'description',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
