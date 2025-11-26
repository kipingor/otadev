<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Services\DashboardMetricsService;
use Inertia\Inertia;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        private DashboardMetricsService $metricsService
    ) {}

    public function index(Request $request)
    {
        $data = [
            'user' => $request->user(),
            'metrics' => [
                'overview' => $this->metricsService->getOverviewMetrics(),
                'leads_over_time' => $this->metricsService->getLeadsOverTime(30),
                'opportunity_pipeline' => $this->metricsService->getOpportunityPipeline(),
                'revenue_over_time' => $this->metricsService->getRevenueOverTime(6),
                'task_completion' => $this->metricsService->getTaskCompletionRate(),
                'recent_activity' => $this->metricsService->getRecentActivity(10),
            ]
        ];

        return Inertia::render('dashboard', compact('data'));
    }

    public function metrics(Request $request)
    {
        // API endpoint for real-time metric updates
        return response()->json([
            'overview' => $this->metricsService->getOverviewMetrics(),
            'leads_over_time' => $this->metricsService->getLeadsOverTime(30),
            'opportunity_pipeline' => $this->metricsService->getOpportunityPipeline(),
            'revenue_over_time' => $this->metricsService->getRevenueOverTime(6),
            'task_completion' => $this->metricsService->getTaskCompletionRate(),
            'recent_activity' => $this->metricsService->getRecentActivity(10),
        ]);
    }
}
