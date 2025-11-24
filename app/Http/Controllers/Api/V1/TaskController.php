<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\TaskUpdated;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Task;
use Illuminate\Http\JsonResponse;

class TaskController extends Controller
{
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


        $task = Task::create($data);


        return response()->json(['ok' => true, 'task' => $task]);
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


        $task->update($data);

        event(new TaskUpdated($task->fresh()));

        return response()->json(['ok' => true, 'task' => $task]);
    }


    public function destroy(Task $task): JsonResponse
    {
        $task->delete();


        return response()->json(['ok' => true]);
    }
}
