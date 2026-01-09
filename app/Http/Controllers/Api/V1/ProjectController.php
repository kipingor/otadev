<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Services\Project\ProjectService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function __construct(
        protected ProjectService $projectService
    ) {}

    /**
     * Display a listing of projects
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Project::class);

        $filters = $request->only(['status', 'search']);
        $perPage = $request->integer('per_page', 15);

        $projects = $this->projectService->list($filters, $perPage);

        return response()->json([
            'success' => true,
            'data' => $projects,
        ]);
    }

    /**
     * Store a newly created project
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Project::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:planning,in_progress,on_hold,completed,cancelled',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'budget' => 'nullable|numeric|min:0',
        ]);

        $project = Project::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Project created successfully',
            'data' => $project,
        ], 201);
    }

    /**
     * Display the specified project
     */
    public function show(Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $project->load(['tasks', 'milestones', 'team']);

        return response()->json([
            'success' => true,
            'data' => $project,
        ]);
    }

    /**
     * Update the specified project
     */
    public function update(Request $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'sometimes|required|in:planning,in_progress,on_hold,completed,cancelled',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'budget' => 'nullable|numeric|min:0',
        ]);

        $data = $project->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Project updated successfully',
            'data' => $data,
        ]);
    }

    /**
     * Remove the specified project
     */
    public function destroy(Project $project): JsonResponse
    {
        $this->authorize('delete', $project);

        $project->delete();

        return response()->json([
            'success' => true,
            'message' => 'Project deleted successfully',
        ]);
    }

    /**
     * Get project progress
     */
    public function progress(Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $progress = $this->projectService->calculateProgress($project);

        return response()->json([
            'success' => true,
            'data' => $progress,
        ]);
    }

    /**
     * Get project timeline
     */
    public function timeline(Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $timeline = $this->projectService->getTimeline($project);

        return response()->json([
            'success' => true,
            'data' => $timeline,
        ]);
    }

    /**
     * Add team member to project
     */
    public function addTeamMember(Request $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'role' => 'nullable|string|max:100',
        ]);

        $this->projectService->addTeamMember(
            $project,
            $validated['user_id'],
            $validated['role'] ?? null
        );

        return response()->json([
            'success' => true,
            'message' => 'Team member added successfully',
        ]);
    }

    /**
     * Remove team member from project
     */
    public function removeTeamMember(Request $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $this->projectService->removeTeamMember($project, $validated['user_id']);

        return response()->json([
            'success' => true,
            'message' => 'Team member removed successfully',
        ]);
    }
}