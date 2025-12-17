<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\ProjectTask;
use App\Http\Resources\ProjectTaskResource;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ProjectTaskController extends Controller
{
    public function index()
    {
        return ProjectTaskResource::collection(ProjectTask::paginate(20));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'task_id' => 'required|exists:tasks,id',
            'assigned_by' => 'nullable|exists:users,id',
        ]);

        return new ProjectTaskResource(ProjectTask::create($data));
    }

    public function show(ProjectTask $projectTask)
    {
        return new ProjectTaskResource($projectTask);
    }

    public function update(Request $request, ProjectTask $projectTask)
    {
        $projectTask->update($request->all());

        return new ProjectTaskResource($projectTask);
    }

    public function destroy(ProjectTask $projectTask)
    {
        $projectTask->delete();

        return response()->noContent();
    }
}
