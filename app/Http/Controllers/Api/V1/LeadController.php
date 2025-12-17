<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLeadRequest;
use App\Models\Lead;
use App\Services\LeadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    /**
     * Display a listing of leads.
     */
    protected LeadService $service;

    public function __construct(LeadService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['owner_id', 'pipeline_stage_id']);
        $leads = $this->service->list($filters, (int) $request->input('per_page', 15));

        return response()->json(['data' => $leads]);
    }

    /**
     * Store a newly created lead.
     */
    public function store(StoreLeadRequest $request): JsonResponse
    {
        $data = array_merge($request->validated(), ['created_by' => $request->user()->id]);
        $lead = $this->service->create($data);

        return response()->json([
            'message' => 'Lead created successfully',
            'data' => $lead->load('owner', 'user', 'pipelineStage'),
        ], 201);
    }

    /**
     * Display the specified lead.
     */
    public function show(Lead $lead): JsonResponse
    {
        $this->authorize('view', $lead);

        $lead->load('owner', 'user', 'pipelineStage', 'questions', 'leadDocuments', 'opportunity');

        return response()->json(['data' => $lead]);
    }

    /**
     * Update the specified lead.
     */
    public function update(StoreLeadRequest $request, Lead $lead): JsonResponse
    {
        $this->authorize('update', $lead);

        $lead = $this->service->update($lead, $request->validated());

        return response()->json([
            'message' => 'Lead updated successfully',
            'data' => $lead->load('owner', 'user', 'pipelineStage'),
        ]);
    }

    /**
     * Remove the specified lead.
     */
    public function destroy(Lead $lead, Request $request): JsonResponse
    {
        $this->authorize('delete', $lead);

        $this->service->delete($lead);

        return response()->json(['message' => 'Lead deleted successfully']);
    }
}
