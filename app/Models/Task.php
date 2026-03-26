<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Concerns\HasTenantScope;

class Task extends Model
{
    use HasFactory, SoftDeletes, HasTenantScope;

     /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */

    protected $fillable = [
        'tenant_id',
        'project_id',
        'milestone_id',
        'title',
        'description',
        'assigned_to',
        'priority',
        'status',
        'startAt',
        'endAt',
        'estimated_hours',
        'spent_hours',
        'group',
        'metadata',
        'delay_reason',
        'mitigation',
        'completed_at',
        'due_date',
    ];

    protected $casts = [
        'startAt'      => 'date',
        'endAt'        => 'date',
        'completed_at' => 'date',
        'due_date'     => 'date',
        'metadata'     => 'array',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function milestone()
    {
        return $this->belongsTo(Milestone::class);
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function timeLogs()
    {
        return $this->hasMany(TimeLog::class);
    }

    public function comments()
    {
        return $this->morphMany(Comment::class, 'commentable')->orderBy('created_at');
    }

    public function dependencies()
    {
        return $this->belongsToMany(Task::class, 'task_dependencies', 'task_id', 'depends_on_task_id');
    }

    public function dependents()
    {
        return $this->belongsToMany(Task::class, 'task_dependencies', 'depends_on_task_id', 'task_id');
    }

    public function parent()
    {
        return $this->belongsTo(Task::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Task::class, 'parent_id')->orderBy('sort_order');
    }
}