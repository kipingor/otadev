<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Opportunity;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

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

    public function archive(Project $project)
    {
        $project->update(['archived' => true]);

        return redirect()
            ->route('projects.index')
            ->with('success', 'Project archived.');
    }

    public function restore(Project $project)
    {
        $project->update(['archived' => false]);

        return redirect()
            ->route('projects.index')
            ->with('success', 'Project restored.');
    }

    public function archived()
    {
        $projects = Project::with('client:id,name', 'owner:id,name', 'opportunity:id,title')
            ->where('archived', true)
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('projects/archived', compact('projects'));
    }

    public function forceDelete(Project $project)
    {
        $project->forceDelete();

        return redirect()
            ->route('projects.index')
            ->with('success', 'Project permanently deleted.');
    }

    public function archiveMultiple(Request $request)
    {
        $request->validate([
            'project_ids' => ['required', 'array'],
            'project_ids.*' => ['exists:projects,id'],
        ]);

        Project::whereIn('id', $request->project_ids)->update(['archived' => true]);

        return redirect()
            ->route('projects.index')
            ->with('success', 'Selected projects archived.');
    }

    public function restoreMultiple(Request $request)
    {
        $request->validate([
            'project_ids' => ['required', 'array'],
            'project_ids.*' => ['exists:projects,id'],
        ]);

        Project::whereIn('id', $request->project_ids)->update(['archived' => false]);

        return redirect()
            ->route('projects.index')
            ->with('success', 'Selected projects restored.');
    }

    public function forceDeleteMultiple(Request $request)
    {
        $request->validate([
            'project_ids' => ['required', 'array'],
            'project_ids.*' => ['exists:projects,id'],
        ]);

        Project::whereIn('id', $request->project_ids)->forceDelete();

        return redirect()
            ->route('projects.index')
            ->with('success', 'Selected projects permanently deleted.');
    }

    public function dashboard(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/dashboard', compact('project'));
    }

    public function settings(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/settings', compact('project'));
    }

    public function statistics(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/statistics', compact('project'));
    }

    public function activities(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/activities', compact('project'));
    }

    public function tasks(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/tasks', compact('project'));
    }

    public function milestones(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/milestones', compact('project'));
    }

    public function documents(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/documents', compact('project'));
    }

    public function team(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/team', compact('project'));
    }

    public function finances(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/finances', compact('project'));
    }

    public function reports(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/reports', compact('project'));
    }

    public function notes(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/notes', compact('project'));
    }

    public function activitiesLog(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/activities-log', compact('project'));
    }

    public function timeline(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/timeline', compact('project'));
    }

    public function overview(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/overview', compact('project'));
    }

    public function ganttChart(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/gantt-chart', compact('project'));
    }

    public function calendar(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/calendar', compact('project'));
    }

    public function kanban(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/kanban', compact('project'));
    }

    public function chat(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/chat', compact('project'));
    }

    public function forum(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/forum', compact('project'));
    }

    public function wiki(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/wiki', compact('project'));
    }

    public function links(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/links', compact('project'));
    }

    public function integrations(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/integrations', compact('project'));
    }

    public function help(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/help', compact('project'));
    }

    public function faq(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/faq', compact('project'));
    }

    public function support(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/support', compact('project'));
    }

    public function feedback(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/feedback', compact('project'));
    }

    public function settingsGeneral(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/settings-general', compact('project'));
    }

    public function settingsPrivacy(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/settings-privacy', compact('project'));
    }

    public function settingsNotifications(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/settings-notifications', compact('project'));
    }

    public function settingsBilling(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/settings-billing', compact('project'));
    }

    public function settingsSecurity(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/settings-security', compact('project'));
    }

    public function settingsIntegrations(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/settings-integrations', compact('project'));
    }

    public function settingsAdvanced(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/settings-advanced', compact('project'));
    }

    public function settingsNotificationsAdvanced(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/settings-notifications-advanced', compact('project'));
    }

    public function settingsPermissions(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/settings-permissions', compact('project'));
    }

    public function settingsAuditLog(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/settings-audit-log', compact('project'));
    }

    public function settingsAPIAccess(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/settings-api-access', compact('project'));
    }

    public function settingsWebhooks(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/settings-webhooks', compact('project'));
    }

    public function settingsIntegrationsAdvanced(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/settings-integrations-advanced', compact('project'));
    }

    public function settingsDataExport(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/settings-data-export', compact('project'));
    }

    public function settingsDataImport(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/settings-data-import', compact('project'));
    }

    public function settingsNotificationsEmail(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/settings-notifications-email', compact('project'));
    }

    public function settingsNotificationsSMS(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/settings-notifications-sms', compact('project'));
    }

    public function settingsNotificationsPush(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/settings-notifications-push', compact('project'));
    }

    public function settingsNotificationsInApp(Project $project)
    {
        $project->load('client', 'owner', 'opportunity', 'tasks', 'milestones');

        return Inertia::render('projects/settings-notifications-in-app', compact('project'));
    }
}