<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\User;
use App\Models\Activity;
use App\Models\LeadDocument;
use App\Models\Proposal;
use App\Models\Opportunity;
use App\Services\Lead\LeadService;
use App\Services\Pipeline\PipelineService;
use App\Services\DashboardMetricsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardMetricsService $metricsService
    ) {}

    /**
     * Get comprehensive dashboard metrics
     */
    public function metrics(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Lead::class);

        $metrics = $this->metricsService->getComprehensiveMetrics();

        return response()->json($metrics);
    }

    /**
     * Get recent activities
     */
    public function recentActivities(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Lead::class);

        $limit = $request->integer('limit', 20);

        $activities = Activity::with(['lead', 'user'])
            ->latest()
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $activities,
        ]);
    }

    /**
     * Get top performing users
     */
    public function topPerformers(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Lead::class);

        $limit = $request->integer('limit', 10);
        $period = $request->input('period', 'month');

        $performers = $this->metricsService->getTopPerformers($limit, $period);

        return response()->json([
            'success' => true,
            'data' => $performers,
            'period' => $period,
        ]);
    }

    /**
     * Get chart data for leads over time
     */
    public function leadsChart(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Lead::class);

        $days = $request->integer('days', 30);
        $data = $this->metricsService->getLeadsOverTime($days);

        return response()->json([
            'success' => true,
            'data' => $data,
            'period' => $days . ' days',
        ]);
    }
}