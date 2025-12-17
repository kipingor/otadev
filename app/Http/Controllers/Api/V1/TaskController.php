<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\TaskUpdated;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Task;
use App\Models\Project;
use App\Services\TaskService;
use Illuminate\Http\JsonResponse;

class TaskController extends Controller
{
    protected TaskService $service;

    public function __construct(TaskService $service)
    {
        $this->service = $service;
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'project_id' => 'required|integer|exists:projects,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'assigned_to' => 'nullable|exists:users,id',
            'endAt' => 'nullable|date',
            'estimated_hours' => 'nullable|integer',
        ]);

        $this->authorize('create', Task::class);

        $task = $this->service->create($data);

        return response()->json(['ok' => true, 'task' => $task]);
    }

    /**
     * Return tasks for a given project.
     */
    public function index(Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $tasks = $project->tasks()->with('assignee:id,name')->get();

        return response()->json($tasks);
    }


    public function update(Request $request, Task $task): JsonResponse
    {
        $data = $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:todo,in_progress,review,done',
            'assigned_to' => 'nullable|exists:users,id',
            'endAt' => 'nullable|date',
            'spent_hours' => 'nullable|integer',
        ]);
        $this->authorize('update', $task);

        $task = $this->service->update($task, $data);

        return response()->json(['ok' => true, 'task' => $task]);
    }


    public function destroy(Task $task): JsonResponse
    {
        $this->authorize('delete', $task);

        $this->service->delete($task);

        return response()->json(['ok' => true]);
    }
}
