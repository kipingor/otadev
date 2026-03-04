<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Opportunity;
use App\Services\Opportunity\OpportunityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OpportunityController extends Controller
{
    public function __construct(
        protected OpportunityService $opportunityService
    ) {
    }

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
            'lead_id'             => 'required|exists:leads,id',
            'title'               => 'required|string|max:255',
            'description'         => 'nullable|string|max:5000',
            'estimated_value'     => 'required|numeric|min:0',  // DB column name (was 'amount')
            'probability'         => 'nullable|integer|min:0|max:100',
            'stage'               => 'required|in:qualification,proposal,negotiation,closed_won,closed_lost',
            'expected_close_date' => 'nullable|date',
            'contact_name'        => 'nullable|string|max:255',
            'contact_email'       => 'nullable|email|max:255',
            'contact_phone'       => 'nullable|string|max:50',
            'metadata'            => 'nullable|array',
        ]);

        // Auto-assign owner and creator
        $validated['owner_id'] = $request->input('owner_id', Auth::id());
        $validated['created_by'] = Auth::id();

        $opportunity = Opportunity::create($validated);
        $opportunity->load(['lead', 'owner']);

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
            'title'               => 'sometimes|required|string|max:255',
            'description'         => 'nullable|string|max:5000',
            'estimated_value'     => 'sometimes|required|numeric|min:0',  // DB column name (was 'amount')
            'probability'         => 'nullable|integer|min:0|max:100',
            'stage'               => 'sometimes|required|in:qualification,proposal,negotiation,closed_won,closed_lost',
            'expected_close_date' => 'nullable|date',
            'contact_name'        => 'nullable|string|max:255',
            'contact_email'       => 'nullable|email|max:255',
            'contact_phone'       => 'nullable|string|max:50',
            'metadata'            => 'nullable|array',
        ]);

        $opportunity->update($validated);
        $opportunity->load(['lead', 'owner']);

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

        $opportunity->delete();

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

    /**
     * Move opportunity to a different stage
     */
    public function moveStage(Request $request, Opportunity $opportunity): JsonResponse
    {
        $this->authorize('update', $opportunity);

        $validated = $request->validate([
            'stage' => 'required|in:qualification,proposal,negotiation,closed_won,closed_lost',
        ]);

        $opportunity->update([
            'stage' => $validated['stage'],
            'probability' => \App\Enums\OpportunityStage::from($validated['stage'])->defaultProbability(),
        ]);

        $opportunity->load(['lead', 'owner']);

        return response()->json([
            'success' => true,
            'message' => 'Opportunity stage updated',
            'data' => $opportunity,
        ]);
    }

    /**
     * Get opportunities for kanban board
     */
    public function kanban(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Opportunity::class);

        $query = Opportunity::with(['lead', 'owner'])
            ->where('owner_id', Auth::id());

        // Apply filters
        if ($request->has('search')) {
            $query->search($request->search);
        }

        if ($request->has('stage')) {
            $query->byStage(\App\Enums\OpportunityStage::from($request->stage));
        }

        $opportunities = $query->get()->groupBy(fn ($opp) => $opp->stage->value);

        $kanban = [];
        foreach (\App\Enums\OpportunityStage::cases() as $stage) {
            $kanban[$stage->value] = [
                'stage' => $stage->value,
                'label' => $stage->label(),
                'color' => $stage->color(),
                'opportunities' => $opportunities->get($stage->value, collect())->values(),
                'total_count' => $opportunities->get($stage->value, collect())->count(),
                'total_value' => $opportunities->get($stage->value, collect())->sum('amount'),
                'weighted_value' => $opportunities->get($stage->value, collect())->sum('weighted_value'),
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $kanban,
        ]);
    }
}