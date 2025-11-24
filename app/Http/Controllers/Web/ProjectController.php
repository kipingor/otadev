<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Opportunity;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $projects = Project::with('client:id,name', 'owner:id,name', 'opportunity:id,title')
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('projects/index', compact('projects'));
    }

    public function create()
    {
        return Inertia::render('projects/create', $this->formOptions());
    }

    public function store(Request $request)
    {
        $data = $this->validate($request, $this->rules());

        $project = Project::create($data);

        return redirect()
            ->route('projects.show', $project->id)
            ->with('success', 'Project created.');
    }

    public function show(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/show', compact('project'));
    }

    public function edit(Project $project)
    {
        $project->load('client:id,name', 'owner:id,name', 'opportunity:id,title');

        return Inertia::render('projects/edit', array_merge(
            ['project' => $project],
            $this->formOptions()
        ));
    }

    public function update(Request $request, Project $project)
    {
        $data = $this->validate($request, $this->rules());

        $project->update($data);

        return redirect()
            ->route('projects.show', $project->id)
            ->with('success', 'Project updated.');
    }

    public function destroy(Project $project)
    {
        $project->delete();

        return redirect()
            ->route('projects.index')
            ->with('success', 'Project deleted.');
    }

    protected function formOptions(): array
    {
        return [
            'opportunities' => Opportunity::select('id', 'title')->orderBy('title')->get(),
            'clients' => User::select('id', 'name')->orderBy('name')->get(),
            'owners' => User::select('id', 'name')->orderBy('name')->get(),
            'statusOptions' => Project::STATUSES,
            'currencyOptions' => config('app.supported_currencies', ['USD', 'EUR', 'GBP']),
        ];
    }

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
}

