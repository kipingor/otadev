<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\PipelineStage;
use App\Models\User;
use App\Services\Lead\LeadService;
use App\Services\Lead\LeadStatusService;
use App\Http\Requests\Lead\StoreLeadRequest;
use App\Http\Requests\Lead\UpdateLeadRequest;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class LeadController extends Controller
{
    public function __construct(
        protected LeadService $leadService,
        protected LeadStatusService $leadStatusService
    ) {
    }

    public function index()
    {
        $this->authorize('viewAny', Lead::class);

        $leads = $this->leadService->list(
            request()->only(['owner_id', 'pipeline_stage_id', 'status', 'search']),
            perPage: request()->integer('per_page', 15)
        );
        
        return Inertia::render('leads/index', [
            'leads' => $leads,
            'filters' => request()->only(['owner_id', 'pipeline_stage_id', 'status', 'search', 'per_page']),
            'pipelineStages' => PipelineStage::orderBy('order')->get(),
            'users' => User::select('id', 'name')->get(),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Lead::class);

        return Inertia::render('leads/create', [
            'pipelineStages' => PipelineStage::orderBy('order')->get(),
            'users' => User::select('id', 'name', 'email')->get(),
        ]);
    }


    public function store(StoreLeadRequest $request): RedirectResponse
    {
        $lead = $this->leadService->create($request->validated());

        return redirect()
            ->route('leads.show', $lead)
            ->with('success', 'Lead created successfully.');
    }

    public function show(Lead $lead)
    {
        $this->authorize('view', $lead);

        $lead->load([
            'owner',
            'user',
            'pipelineStage',
            'questions',
            'leadDocuments',
            'opportunity',
            'proposals',
            'activities' => fn ($q) => $q->latest()->limit(10),
        ]);

        return Inertia::render('leads/show', [
            'lead' => $lead,
            'availableTransitions' => $this->leadStatusService->getAvailableTransitions($lead),
            'statusHistory' => $this->leadStatusService->getStatusHistory($lead),
        ]);
    }

    public function edit(Lead $lead): Response
    {
        $this->authorize('update', $lead);

        return Inertia::render('leads/edit', [
            'lead' => $lead->load(['owner', 'pipelineStage']),
            'pipelineStages' => PipelineStage::orderBy('order')->get(),
            'users' => User::select('id', 'name', 'email')->get(),
        ]);
    }

    public function update(UpdateLeadRequest $request, Lead $lead)
    {
        $this->leadService->update($lead, $request->validated());

        return back()->with('success', 'Lead updated.');
    }

    public function destroy(Lead $lead)
    {
        $this->authorize('delete', $lead);

        $this->leadService->delete($lead);

        return redirect()
            ->route('leads.index')
            ->with('success', 'Lead deleted.');
    }

    /**
     * Restore a soft-deleted lead
     */
    public function restore(int $id): RedirectResponse
    {
        $lead = Lead::withTrashed()->findOrFail($id);
        
        $this->authorize('restore', $lead);

        $this->leadService->restore($lead);

        return redirect()
            ->route('leads.show', $lead)
            ->with('success', 'Lead restored successfully.');
    }
}
