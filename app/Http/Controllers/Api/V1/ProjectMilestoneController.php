<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\ProjectMilestone;
use App\Http\Resources\ProjectMilestoneResource;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ProjectMilestoneController extends Controller
{
    public function index()
    {
        return ProjectMilestoneResource::collection(ProjectMilestone::paginate(20));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'milestone_id' => 'required|exists:milestones,id',
            'assigned_at' => 'nullable|date',
        ]);

        return new ProjectMilestoneResource(ProjectMilestone::create($data));
    }

    public function show(ProjectMilestone $projectMilestone)
    {
        return new ProjectMilestoneResource($projectMilestone);
    }

    public function update(Request $request, ProjectMilestone $projectMilestone)
    {
        $projectMilestone->update($request->all());

        return new ProjectMilestoneResource($projectMilestone);
    }

    public function destroy(ProjectMilestone $projectMilestone)
    {
        $projectMilestone->delete();

        return response()->noContent();
    }
}
