<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Concerns\HasTenantScope;

class TimeLog extends Model
{
    use HasFactory, SoftDeletes, HasTenantScope;

    protected $fillable = [
        'tenant_id',
        'task_id',
        'user_id',
        'hours',
        'notes',
        'logged_at',
    ];

    protected $casts = [
        'logged_at' => 'datetime',
        'hours' => 'decimal:2',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
