<?php

namespace App\Services\Project;

use App\Models\Project;
use App\Models\User;
use App\Events\ProjectCreated;
use App\Events\ProjectCompleted;
use Illuminate\Support\Facades\DB;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class ProjectService
{
    /**
     * Get paginated list of projects with filters
     */
    public function list(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Project::query()->with(['tasks', 'milestones']);

        // Apply filters
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', "%{$filters['search']}%")
                  ->orWhere('description', 'like', "%{$filters['search']}%");
            });
        }

        return $query->latest()->paginate($perPage);
    }

    /**
     * Create a new project
     */
    public function create(array $data): Project
    {
        return DB::transaction(function () use ($data) {
            $project = Project::create($data);

            event(new ProjectCreated($project));

            return $project->load(['tasks', 'milestones']);
        });
    }

    /**
     * Update an existing project
     */
    public function update(Project $project, array $data): Project
    {
        return DB::transaction(function () use ($project, $data) {
            $project->update($data);

            return $project->refresh()->load(['tasks', 'milestones']);
        });
    }

    /**
     * Delete a project
     */
    public function delete(Project $project): bool
    {
        return DB::transaction(function () use ($project) {
            // Delete related tasks and milestones
            $project->tasks()->delete();
            $project->milestones()->delete();

            return $project->delete();
        });
    }

    /**
     * Add team member to project
     */
    public function addTeamMember(Project $project, int $userId, ?string $role = null): void
    {
        DB::transaction(function () use ($project, $userId, $role) {
            // Check if already a member
            $existing = $project->team()->where('user_id', $userId)->exists();

            if (!$existing) {
                $project->team()->attach($userId, [
                    'role' => $role,
                    'joined_at' => now(),
                ]);
            }
        });
    }

    /**
     * Remove team member from project
     */
    public function removeTeamMember(Project $project, int $userId): void
    {
        DB::transaction(function () use ($project, $userId) {
            $project->team()->detach($userId);
        });
    }

    /**
     * Update team member role
     */
    public function updateTeamMemberRole(Project $project, int $userId, string $role): void
    {
        DB::transaction(function () use ($project, $userId, $role) {
            $project->team()->updateExistingPivot($userId, [
                'role' => $role,
            ]);
        });
    }

    /**
     * Calculate project progress
     */
    public function calculateProgress(Project $project): array
    {
        $totalTasks = $project->tasks()->count();
        $completedTasks = $project->tasks()->whereNotNull('completed_at')->count();
        
        $totalMilestones = $project->milestones()->count();
        $completedMilestones = $project->milestones()->whereNotNull('completed_at')->count();

        $taskProgress = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 2) : 0;
        $milestoneProgress = $totalMilestones > 0 ? round(($completedMilestones / $totalMilestones) * 100, 2) : 0;

        // Overall progress (weighted: 70% tasks, 30% milestones)
        $overallProgress = round(($taskProgress * 0.7) + ($milestoneProgress * 0.3), 2);

        return [
            'overall' => $overallProgress,
            'tasks' => [
                'total' => $totalTasks,
                'completed' => $completedTasks,
                'progress' => $taskProgress,
            ],
            'milestones' => [
                'total' => $totalMilestones,
                'completed' => $completedMilestones,
                'progress' => $milestoneProgress,
            ],
        ];
    }

    /**
     * Get project timeline
     */
    public function getTimeline(Project $project): array
    {
        $milestones = $project->milestones()
            ->orderBy('due_date')
            ->get()
            ->map(function ($milestone) {
                return [
                    'id' => $milestone->id,
                    'title' => $milestone->title,
                    'due_date' => $milestone->due_date,
                    'completed' => $milestone->completed_at !== null,
                    'completed_at' => $milestone->completed_at,
                    'type' => 'milestone',
                ];
            });

        $tasks = $project->tasks()
            ->whereNotNull('due_date')
            ->orderBy('due_date')
            ->get()
            ->map(function ($task) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'due_date' => $task->due_date,
                    'completed' => $task->completed_at !== null,
                    'completed_at' => $task->completed_at,
                    'type' => 'task',
                ];
            });

        $timeline = $milestones->merge($tasks)->sortBy('due_date')->values();

        return [
            'items' => $timeline,
            'start_date' => $project->start_date,
            'end_date' => $project->end_date,
            'current_date' => now()->toDateString(),
        ];
    }

    /**
     * Mark project as completed
     */
    public function markAsCompleted(Project $project): Project
    {
        return DB::transaction(function () use ($project) {
            $project->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            event(new ProjectCompleted($project));

            return $project->refresh();
        });
    }

    /**
     * Get projects by status
     */
    public function getByStatus(string $status): Collection
    {
        return Project::where('status', $status)
            ->with(['tasks', 'milestones'])
            ->latest()
            ->get();
    }

    /**
     * Get active projects
     */
    public function getActive(): Collection
    {
        return $this->getByStatus('in_progress');
    }

    /**
     * Get completed projects
     */
    public function getCompleted(): Collection
    {
        return $this->getByStatus('completed');
    }

    /**
     * Get projects on hold
     */
    public function getOnHold(): Collection
    {
        return $this->getByStatus('on_hold');
    }

    /**
     * Get overdue projects
     */
    public function getOverdue(): Collection
    {
        return Project::where('status', 'in_progress')
            ->whereNotNull('end_date')
            ->where('end_date', '<', now())
            ->with(['tasks', 'milestones'])
            ->get();
    }

    /**
     * Get projects by team member
     */
    public function getByTeamMember(User $user): Collection
    {
        return Project::whereHas('team', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
        ->with(['tasks', 'milestones'])
        ->latest()
        ->get();
    }

    /**
     * Calculate budget utilization
     */
    public function calculateBudgetUtilization(Project $project): array
    {
        if (!$project->budget) {
            return [
                'budget' => 0,
                'spent' => 0,
                'remaining' => 0,
                'utilization' => 0,
            ];
        }

        // This would typically come from expense tracking
        // For now, we'll return a placeholder
        $spent = $project->expenses()->sum('amount') ?? 0;
        $remaining = $project->budget - $spent;
        $utilization = round(($spent / $project->budget) * 100, 2);

        return [
            'budget' => $project->budget,
            'spent' => $spent,
            'remaining' => $remaining,
            'utilization' => $utilization,
        ];
    }

    /**
     * Get project statistics
     */
    public function getStatistics(): array
    {
        return [
            'total' => Project::count(),
            'by_status' => [
                'planning' => Project::where('status', 'planning')->count(),
                'in_progress' => Project::where('status', 'in_progress')->count(),
                'on_hold' => Project::where('status', 'on_hold')->count(),
                'completed' => Project::where('status', 'completed')->count(),
                'cancelled' => Project::where('status', 'cancelled')->count(),
            ],
            'overdue' => $this->getOverdue()->count(),
            'total_budget' => Project::sum('budget'),
            'average_completion_time' => $this->calculateAverageCompletionTime(),
        ];
    }

    /**
     * Calculate average completion time in days
     */
    protected function calculateAverageCompletionTime(): float
    {
        $completedProjects = Project::where('status', 'completed')
            ->whereNotNull('completed_at')
            ->get();

        if ($completedProjects->isEmpty()) {
            return 0;
        }

        $totalDays = $completedProjects->sum(function ($project) {
            return $project->created_at->diffInDays($project->completed_at);
        });

        return round($totalDays / $completedProjects->count(), 2);
    }

    /**
     * Update project status
     */
    public function updateStatus(Project $project, string $status): Project
    {
        $project->update(['status' => $status]);

        if ($status === 'completed') {
            $project->update(['completed_at' => now()]);
            event(new ProjectCompleted($project));
        }

        return $project->refresh();
    }

    /**
     * Check if project is at risk (overdue or behind schedule)
     */
    public function isAtRisk(Project $project): bool
    {
        // Check if overdue
        if ($project->end_date && now()->isAfter($project->end_date) && $project->status === 'in_progress') {
            return true;
        }

        // Check if behind schedule
        $progress = $this->calculateProgress($project);
        
        if ($project->start_date && $project->end_date) {
            $totalDays = $project->start_date->diffInDays($project->end_date);
            $daysElapsed = $project->start_date->diffInDays(now());
            
            if ($totalDays > 0) {
                $expectedProgress = ($daysElapsed / $totalDays) * 100;
                
                // If actual progress is 20% behind expected progress
                if ($progress['overall'] < ($expectedProgress - 20)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Get projects at risk
     */
    public function getAtRisk(): Collection
    {
        return Project::where('status', 'in_progress')
            ->get()
            ->filter(fn($project) => $this->isAtRisk($project));
    }

    /**
     * Clone a project
     */
    public function clone(Project $project, bool $includeTasks = true, bool $includeTeam = true): Project
    {
        return DB::transaction(function () use ($project, $includeTasks, $includeTeam) {
            $data = $project->toArray();
            
            // Remove unique fields
            unset($data['id'], $data['created_at'], $data['updated_at'], $data['completed_at']);
            
            // Update name
            $data['name'] = $data['name'] . ' (Copy)';
            $data['status'] = 'planning';
            
            $newProject = Project::create($data);

            // Clone tasks if requested
            if ($includeTasks) {
                foreach ($project->tasks as $task) {
                    $taskData = $task->toArray();
                    unset($taskData['id'], $taskData['created_at'], $taskData['updated_at']);
                    $taskData['project_id'] = $newProject->id;
                    $newProject->tasks()->create($taskData);
                }
            }

            // Clone team if requested
            if ($includeTeam) {
                foreach ($project->team as $member) {
                    $newProject->team()->attach($member->id, [
                        'role' => $member->pivot->role,
                        'joined_at' => now(),
                    ]);
                }
            }

            return $newProject->load(['tasks', 'milestones', 'team']);
        });
    }
}