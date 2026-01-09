<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Lead\StoreLeadRequest;
use App\Http\Requests\Lead\UpdateLeadRequest;
use App\Models\Lead;
use App\Services\Lead\LeadService;
use App\Services\Lead\LeadStatusService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function __construct(
        protected LeadService $leadService,
        protected LeadStatusService $leadStatusService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Lead::class);


        $filters = $request->only(['owner_id', 'pipeline_stage_id', 'status', 'type', 'search']);
        $leads = $this->leadService->list(
            $filters,
            perPage: $request->input('per_page', 15)
        );

        return response()->json([
            'success' => true,
            'data' => $leads
        ]);
    }

    /**
     * Store a newly created lead.
     */
    public function store(StoreLeadRequest $request): JsonResponse
    {
        $lead = $this->leadService->create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Lead created successfully',
            'data' => $lead,
        ], 201);
    }

    /**
     * Display the specified lead.
     */
    public function show(Lead $lead): JsonResponse
    {
        $this->authorize('view', $lead);

        $lead->load(['owner', 'user', 'pipelineStage', 'questions', 'leadDocuments', 'opportunity', 'proposals']);

        return response()->json([
            'success' => true,
            'data' => $lead,
            'meta' => [
                'available_transitions' => $this->leadStatusService->getAvailableTransitions($lead),
                'status_history' => $this->leadStatusService->getStatusHistory($lead),
            ]
        ]);
    }

    /**
     * Update the specified lead.
     */
    public function update(UpdateLeadRequest $request, Lead $lead): JsonResponse
    {
        $data = $this->leadService->update($lead, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Lead updated successfully',
            'data' => $data,
        ]);
    }

    /**
     * Remove the specified lead.
     */
    public function destroy(Lead $lead, Request $request): JsonResponse
    {
        $this->authorize('delete', $lead);

        $lead->delete();

        return response()->json([
            'success' => true,
            'message' => 'Lead deleted successfully',
        ]);
    }

    public function statistics(): JsonResponse
    {
        $this->authorize('viewAny', Lead::class);

        $statistics = $this->leadService->getStatistics();

        return response()->json([
            'success' => true,
            'data' => $statistics,
        ]);
    }

    public function transition(Request $request, Lead $lead): JsonResponse
    {
        $this->authorize('update', $lead);

        $request->validate([
            'status' => 'required|string',
            'reason' => 'nullable|string|max:1000',
        ]);

        $newStatus = \App\Enums\LeadStatus::from($request->status);

        if ($newStatus === \App\Enums\LeadStatus::LOST && $request->has('reason')) {
            $this->leadStatusService->markAsLost($lead, $request->reason);
        } else {
            $this->leadStatusService->transition($lead, $newStatus);
        }

        return response()->json([
            'success' => true,
            'message' => 'Lead status updated successfully',
            'data' => $lead->load(['owner', 'pipelineStage']),
        ]);
    }
}
