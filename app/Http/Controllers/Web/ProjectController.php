<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Opportunity;
use App\Models\Project;
use App\Models\User;
use App\Services\Project\ProjectService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class ProjectController extends Controller
{
    public function __construct(
        protected ProjectService $projectService
    ) {
    }

    /**
     * Display a listing of projects with enhanced data
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Project::class);

        // Build query with eager loading
        $query = Project::query()
            ->with([
                'client:id,name,email,avatar',
                'owner:id,name,email,avatar',
                'opportunity:id,title',
                'teamMembers:id,name,email,avatar',
            ])
            ->withCount(['tasks', 'milestones']);

        // Apply filters
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('description', 'like', "%{$request->search}%");
            });
        }

        if ($request->filled('owner_id')) {
            $query->where('owner_id', $request->owner_id);
        }

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        // Get paginated projects
        $projects = $query->latest()->paginate(15)->withQueryString();

        // Calculate progress for each project
        $projects->through(function ($project) {
            $progress = $this->projectService->calculateProgress($project);
            
            // Add computed fields
            $project->progress = $progress;
            $project->completedTasksCount = $progress['tasks']['completed'];
            $project->tasksCount = $progress['tasks']['total'];
            $project->teamMembersCount = $project->teamMembers->count();
            $project->overdue = $project->end_date && now()->isAfter($project->end_date) && $project->status === 'active';

            return $project;
        });

        // Get statistics
        $statistics = $this->projectService->getStatistics();

        return Inertia::render('projects/index', [
            'projects' => $projects,
            'filters' => $request->only(['status', 'search', 'owner_id', 'client_id']),
            'statistics' => $statistics,
        ]);
    }

    /**
     * Show the form for creating a new project
     */
    public function create()
    {
        $this->authorize('create', Project::class);

        return Inertia::render('projects/create', $this->formOptions());
    }

    /**
     * Store a newly created project
     */
    public function store(Request $request)
    {
        $this->authorize('create', Project::class);

        $data = $this->validate($request, $this->rules());

        $project = $this->projectService->create($data);

        return redirect()
            ->route('web.projects.show', $project->id)
            ->with('success', 'Project created successfully.');
    }

    /**
     * Display the specified project with comprehensive data
     */
    public function show(Project $project)
    {
        $this->authorize('view', $project);

        // Load all relationships
        $project->load([
            'client:id,name,email,avatar',
            'owner:id,name,email,avatar',
            'opportunity:id,title,estimated_value,stage',
            'tasks' => function ($query) {
                $query->with('assignee:id,name,email,avatar')
                    ->orderBy('status')
                    ->orderBy('priority', 'desc')
                    ->orderBy('created_at', 'desc');
            },
            'milestones' => function ($query) {
                $query->orderBy('due_date');
            },
            'teamMembers:id,name,email,avatar',
        ]);

        // Calculate project metrics
        $progress = $this->projectService->calculateProgress($project);
        $timeline = $this->projectService->getTimeline($project);
        $budget = $this->projectService->calculateBudgetUtilization($project);
        $isAtRisk = $this->projectService->isAtRisk($project);

        // Get recent activity (you can implement this based on your activity log)
        $recentActivity = [];

        return Inertia::render('projects/show', [
            'project' => $project,
            'progress' => $progress,
            'timeline' => $timeline,
            'budget' => $budget,
            'isAtRisk' => $isAtRisk,
            'recentActivity' => $recentActivity,
            'canManage' => Auth::user()->can('update', $project),
        ]);
    }

    /**
     * Show the form for editing the specified project
     */
    public function edit(Project $project)
    {
        $this->authorize('update', $project);

        $project->load([
            'client:id,name',
            'owner:id,name',
            'opportunity:id,title',
        ]);

        return Inertia::render('projects/edit', array_merge(
            ['project' => $project],
            $this->formOptions()
        ));
    }

    /**
     * Update the specified project
     */
    public function update(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $data = $this->validate($request, $this->rules());

        $this->projectService->update($project, $data);

        return redirect()
            ->route('web.projects.show', $project->id)
            ->with('success', 'Project updated successfully.');
    }

    /**
     * Remove the specified project
     */
    public function destroy(Project $project)
    {
        $this->authorize('delete', $project);

        $this->projectService->delete($project);

        return redirect()
            ->route('web.projects.index')
            ->with('success', 'Project deleted successfully.');
    }

    /**
     * Get form options for create/edit forms
     */
    protected function formOptions(): array
    {
        return [
            'opportunities' => Opportunity::select(['id', 'title'])
                ->orderBy('title')
                ->get(),
            'clients' => User::select(['id', 'name', 'email'])
                ->orderBy('name')
                ->get(),
            'owners' => User::select(['id', 'name', 'email'])
                ->orderBy('name')
                ->get(),
            'statusOptions' => Project::STATUSES,
            'currencyOptions' => ['USD', 'EUR', 'GBP', 'KES'],
        ];
    }

    /**
     * Validation rules
     */
    protected function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'opportunity_id' => ['nullable', Rule::exists('opportunities', 'id')],
            'client_id' => ['nullable', Rule::exists('users', 'id')],
            'owner_id' => ['nullable', Rule::exists('users', 'id')],
            'status' => ['required', Rule::in(Project::STATUSES)],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'budget' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:10'],
            'metadata' => ['nullable', 'array'],
        ];
    }

    /**
     * Update project status
     */
    public function updateStatus(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $request->validate([
            'status' => ['required', Rule::in(Project::STATUSES)],
        ]);

        $this->projectService->updateStatus($project, $request->status);

        return redirect()
            ->back()
            ->with('success', 'Project status updated successfully.');
    }

    /**
     * Clone a project
     */
    public function clone(Request $request, Project $project)
    {
        $this->authorize('create', Project::class);
        $this->authorize('view', $project);

        $request->validate([
            'include_tasks' => ['boolean'],
            'include_team' => ['boolean'],
        ]);

        $newProject = $this->projectService->clone(
            $project,
            $request->boolean('include_tasks', true),
            $request->boolean('include_team', true)
        );

        return redirect()
            ->route('web.projects.show', $newProject->id)
            ->with('success', 'Project cloned successfully.');
    }

    /**
     * Get projects at risk
     */
    public function atRisk()
    {
        $this->authorize('viewAny', Project::class);

        $projects = $this->projectService->getAtRisk();

        return Inertia::render('projects/at-risk', [
            'projects' => $projects,
        ]);
    }

    /**
     * Export project data
     */
    public function export(Project $project)
    {
        $this->authorize('view', $project);

        // Implement export logic here (PDF, Excel, etc.)
        // For now, return JSON
        $project->load(['tasks', 'milestones', 'teamMembers', 'client', 'owner']);

        return response()->json($project);
    }
}
