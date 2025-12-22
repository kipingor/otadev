<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Opportunity;
use App\Services\Opportunity\OpportunityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OpportunityController extends Controller
{
    public function __construct(
        protected OpportunityService $opportunityService
    ) {}

    /**
     * Display a listing of opportunities
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Opportunity::class);

        $filters = $request->only(['status', 'lead_id', 'min_value', 'max_value']);
        $perPage = $request->integer('per_page', 15);

        $opportunities = $this->opportunityService->list($filters, $perPage);

        return response()->json([
            'success' => true,
            'data' => $opportunities,
        ]);
    }

    /**
     * Store a newly created opportunity
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Opportunity::class);

        $validated = $request->validate([
            'lead_id' => 'required|exists:leads,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'value' => 'required|numeric|min:0',
            'probability' => 'required|integer|min:0|max:100',
            'expected_close_date' => 'nullable|date',
            'status' => 'required|in:open,won,lost,abandoned',
        ]);

        $opportunity = $this->opportunityService->create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Opportunity created successfully',
            'data' => $opportunity,
        ], 201);
    }

    /**
     * Display the specified opportunity
     */
    public function show(Opportunity $opportunity): JsonResponse
    {
        $this->authorize('view', $opportunity);

        $opportunity->load(['lead.owner', 'lead.pipelineStage']);

        return response()->json([
            'success' => true,
            'data' => $opportunity,
        ]);
    }

    /**
     * Update the specified opportunity
     */
    public function update(Request $request, Opportunity $opportunity): JsonResponse
    {
        $this->authorize('update', $opportunity);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'value' => 'sometimes|required|numeric|min:0',
            'probability' => 'sometimes|required|integer|min:0|max:100',
            'expected_close_date' => 'nullable|date',
            'status' => 'sometimes|required|in:open,won,lost,abandoned',
        ]);

        $opportunity = $this->opportunityService->update($opportunity, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Opportunity updated successfully',
            'data' => $opportunity,
        ]);
    }

    /**
     * Remove the specified opportunity
     */
    public function destroy(Opportunity $opportunity): JsonResponse
    {
        $this->authorize('delete', $opportunity);

        $this->opportunityService->delete($opportunity);

        return response()->json([
            'success' => true,
            'message' => 'Opportunity deleted successfully',
        ]);
    }

    /**
     * Mark opportunity as won
     */
    public function markAsWon(Opportunity $opportunity): JsonResponse
    {
        $this->authorize('update', $opportunity);

        $opportunity = $this->opportunityService->markAsWon($opportunity);

        return response()->json([
            'success' => true,
            'message' => 'Opportunity marked as won',
            'data' => $opportunity,
        ]);
    }

    /**
     * Mark opportunity as lost
     */
    public function markAsLost(Request $request, Opportunity $opportunity): JsonResponse
    {
        $this->authorize('update', $opportunity);

        $validated = $request->validate([
            'reason' => 'nullable|string|max:1000',
        ]);

        $opportunity = $this->opportunityService->markAsLost(
            $opportunity,
            $validated['reason'] ?? null
        );

        return response()->json([
            'success' => true,
            'message' => 'Opportunity marked as lost',
            'data' => $opportunity,
        ]);
    }

    /**
     * Get opportunity statistics
     */
    public function statistics(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Opportunity::class);

        $stats = $this->opportunityService->getStatistics();

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}