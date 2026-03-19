<?php
namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\TimeLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * FIX: pages/time-logs/ existed with no backend route or controller.
 */
class TimeLogController extends Controller
{
    public function index(Request $request): Response
    {
        $logs = TimeLog::with('user:id,name', 'project:id,name', 'task:id,title')
            ->when($request->filled('project_id'), fn ($q) => $q->where('project_id', $request->project_id))
            ->when($request->filled('user_id'),    fn ($q) => $q->where('user_id', $request->user_id))
            ->latest('started_at')
            ->paginate(30)
            ->withQueryString();

        return Inertia::render('time-logs/index', [
            'logs'     => $logs,
            'filters'  => $request->only(['project_id', 'user_id']),
            'totals'   => [
                'today' => TimeLog::where('user_id', Auth::id())
                    ->whereDate('started_at', today())->sum('duration_minutes'),
                'week'  => TimeLog::where('user_id', Auth::id())
                    ->where('started_at', '>=', now()->startOfWeek())->sum('duration_minutes'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('time-logs/create', [
            'projects' => \App\Models\Project::select(['id', 'name'])->where('status', 'active')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'project_id'       => ['required', 'exists:projects,id'],
            'task_id'          => ['nullable', 'exists:tasks,id'],
            'description'      => ['nullable', 'string'],
            'duration_minutes' => ['required', 'integer', 'min:1'],
            'started_at'       => ['required', 'date'],
            'billable'         => ['boolean'],
        ]);

        $data['user_id'] = Auth::id();
        TimeLog::create($data);

        return redirect()->route('web.time-logs.index')->with('success', 'Time logged.');
    }
}