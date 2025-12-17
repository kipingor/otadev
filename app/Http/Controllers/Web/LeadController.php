<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Services\LeadService;
use App\Http\Requests\Lead\StoreLeadRequest;
use App\Http\Requests\Lead\UpdateLeadRequest;
use Inertia\Inertia;

class LeadController extends Controller
{
    public function __construct(
        protected LeadService $leadService
    ) {}

    public function index()
    {
        return Inertia::render('Leads/Index', [
            'leads' => Lead::latest()->paginate(15),
        ]);
    }

    public function store(StoreLeadRequest $request)
    {
        $lead = $this->leadService->create($request->validated());

        return redirect()
            ->route('leads.show', $lead)
            ->with('success', 'Lead created successfully.');
    }

    public function show(Lead $lead)
    {
        $this->authorize('view', $lead);

        return Inertia::render('Leads/Show', [
            'lead' => $lead,
        ]);
    }

    public function update(UpdateLeadRequest $request, Lead $lead)
    {
        $this->authorize('update', $lead);

        $this->leadService->update($lead, $request->validated());

        return back()->with('success', 'Lead updated.');
    }

    public function destroy(Lead $lead)
    {
        $this->authorize('delete', $lead);

        $lead->delete();

        return redirect()
            ->route('leads.index')
            ->with('success', 'Lead deleted.');
    }
}
