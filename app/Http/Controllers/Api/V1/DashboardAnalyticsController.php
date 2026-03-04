<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Dashboard\DashboardAnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DashboardAnalyticsController extends Controller
{
    public function __construct(
        protected DashboardAnalyticsService $analyticsService
    ) {
    }

    /**
     * Get overview metrics
     */
    public function overview(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'owner_id' => 'nullable|integer|exists:users,id',
        ]);

        $metrics = $this->analyticsService->getOverviewMetrics($filters);

        return response()->json([
            'success' => true,
            'data' => $metrics,
        ]);
    }

    /**
     * Get leads by status distribution
     */
    public function leadsByStatus(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'date_from' => 'nullable|date',
            'owner_id' => 'nullable|integer|exists:users,id',
        ]);

        $data = $this->analyticsService->getLeadsByStatus($filters);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Get leads by source
     */
    public function leadsBySource(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'date_from' => 'nullable|date',
            'owner_id' => 'nullable|integer|exists:users,id',
        ]);

        $data = $this->analyticsService->getLeadsBySource($filters);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Get pipeline by stage
     */
    public function pipelineByStage(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'owner_id' => 'nullable|integer|exists:users,id',
        ]);

        $data = $this->analyticsService->getPipelineByStage($filters);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Get conversion funnel
     */
    public function conversionFunnel(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'date_from' => 'nullable|date',
            'owner_id' => 'nullable|integer|exists:users,id',
        ]);

        $data = $this->analyticsService->getConversionFunnel($filters);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Get leads over time
     */
    public function leadsOverTime(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'owner_id' => 'nullable|integer|exists:users,id',
            'group_by' => 'nullable|in:day,week,month',
        ]);

        $data = $this->analyticsService->getLeadsOverTime($filters);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Get activity statistics
     */
    public function activityStats(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'owner_id' => 'nullable|integer|exists:users,id',
        ]);

        $data = $this->analyticsService->getActivityStats($filters);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Get lead velocity
     */
    public function leadVelocity(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'date_from' => 'nullable|date',
            'owner_id' => 'nullable|integer|exists:users,id',
        ]);

        $data = $this->analyticsService->getLeadVelocity($filters);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Get team performance
     */
    public function teamPerformance(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
        ]);

        $data = $this->analyticsService->getTeamPerformance($filters);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Get win/loss analysis
     */
    public function winLossAnalysis(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'date_from' => 'nullable|date',
            'owner_id' => 'nullable|integer|exists:users,id',
        ]);

        $data = $this->analyticsService->getWinLossAnalysis($filters);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Get complete dashboard data
     */
    public function dashboard(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'owner_id' => 'nullable|integer|exists:users,id',
        ]);

        $data = [
            'overview' => $this->analyticsService->getOverviewMetrics($filters),
            'leads_by_status' => $this->analyticsService->getLeadsByStatus($filters),
            'leads_by_source' => $this->analyticsService->getLeadsBySource($filters),
            'pipeline_by_stage' => $this->analyticsService->getPipelineByStage($filters),
            'conversion_funnel' => $this->analyticsService->getConversionFunnel($filters),
            'lead_velocity' => $this->analyticsService->getLeadVelocity($filters),
            'win_loss' => $this->analyticsService->getWinLossAnalysis($filters),
        ];

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}
