<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLeadRequest;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    /**
     * Display a listing of leads.
     */
    public function index(Request $request): JsonResponse
    {
        $leads = Lead::with('owner', 'user', 'pipelineStage', 'questions', 'leadDocuments')
            ->when($request->query('owner_id'), function ($query) use ($request) {
                $query->where('owner_id', $request->query('owner_id'));
            })
            ->when($request->query('pipeline_stage_id'), function ($query) use ($request) {
                $query->where('pipeline_stage_id', $request->query('pipeline_stage_id'));
            })
            ->paginate(15);

        return response()->json(['data' => $leads]);
    }

    /**
     * Store a newly created lead.
     */
    public function store(StoreLeadRequest $request): JsonResponse
    {
        $lead = Lead::create(array_merge(
            $request->validated(),
            ['created_by' => $request->user()->id]
        ));

        activity()
            ->performedOn($lead)
            ->causedBy($request->user())
            ->log('Lead created');

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
        $lead->load('owner', 'user', 'pipelineStage', 'questions', 'leadDocuments', 'opportunity');

        return response()->json(['data' => $lead]);
    }

    /**
     * Update the specified lead.
     */
    public function update(StoreLeadRequest $request, Lead $lead): JsonResponse
    {
        $lead->update($request->validated());

        activity()
            ->performedOn($lead)
            ->causedBy($request->user())
            ->log('Lead updated');

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
        $lead->delete();

        activity()
            ->performedOn($lead)
            ->causedBy($request->user())
            ->log('Lead deleted');

        return response()->json(['message' => 'Lead deleted successfully']);
    }
}
