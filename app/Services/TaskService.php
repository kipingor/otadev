<?php

namespace App\Services;

use App\Models\Task;
use App\Events\TaskUpdated;

class TaskService
{
    public function create(array $data): Task
    {
        $task = Task::create($data);
        return $task;
    }

    public function update(Task $task, array $data): Task
    {
        $task->update($data);
        try {
            event(new TaskUpdated($task->fresh()));
        } catch (\Throwable $e) {
            // ignore event failures
        }
        return $task->fresh();
    }

    public function delete(Task $task): void
    {
        $task->delete();
    }

    public function listForProject(int $projectId)
    {
        return \App\Models\Project::findOrFail($projectId)->tasks()->with('assignee:id,name')->get();
    }
}
