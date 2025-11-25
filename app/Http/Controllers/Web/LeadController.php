<?php

namespace App\Http\Controllers\Web;

use App\Events\LeadUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Lead\StoreLeadRequest;
use App\Models\Lead;
use App\Services\AI\LeadAnalysisService;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Gate;

class LeadController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('viewAny', Lead::class);

        $leads = Lead::with('questions', 'opportunity', 'owner')
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('leads/index', compact('leads'));
    }

    public function create()
    {
        Gate::authorize('create', Lead::class);

        return Inertia::render('leads/create');
    }

    public function store(StoreLeadRequest $request, LeadAnalysisService $analysisService)
    {
        Gate::authorize('create', Lead::class);

        $data = $request->validated();
        $data['created_by'] = $request->user()->id;

        $lead = Lead::create($data);

        if ($lead->type === 'document' && $request->has('document_id')) {
            if (method_exists($analysisService, 'analyzeUploadedDocument')) {
                // Use a dynamic call to avoid static analyzer errors when the method
                // is not declared on the concrete class/interface available to the analyzer.
                call_user_func([$analysisService, 'analyzeUploadedDocument'], $lead, $request->input('document_id'));
            }
        }

        return redirect()->route('leads.show', $lead->id)->with('success', 'Lead created.');
    }

    public function show(Lead $lead)
    {
        Gate::authorize('view', $lead);

        $lead->load('questions', 'leadDocuments', 'opportunity');

        return Inertia::render('leads/show', compact('lead'));
    }

    public function edit(Lead $lead)
    {
        Gate::authorize('update', $lead);

        return Inertia::render('leads/edit', compact('lead'));
    }

    public function update(Request $request, Lead $lead)
    {
        Gate::authorize('update', $lead);

        $lead->update($request->all());

        LeadUpdated::dispatch($lead->fresh());

        return redirect()->route('leads.show', $lead->id)->with('success', 'Lead updated.');
    }
    public function destroy(Lead $lead)
    {
        Gate::authorize('delete', $lead);

        $lead->delete();

        return redirect()->route('leads.index')->with('success', 'Lead deleted.');
    }
}
