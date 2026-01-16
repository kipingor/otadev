<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Services\Dashboard\DashboardMetricsService;
use App\Models\Activity;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct(
        protected DashboardMetricsService $metricsService
    ) {}

    /**
     * Display the dashboard.
     */
    public function index()
    {
        try {
            // Get dashboard metrics
            $metrics = $this->metricsService->getOverview();

            // Get recent activities
            $recentActivities = Activity::with('causer')
                ->latest()
                ->limit(10)
                ->get()
                ->map(function ($activity) {
                    return [
                        'id' => $activity->id,
                        'type' => $activity->type,
                        'description' => $activity->description,
                        'created_at' => $activity->created_at->toISOString(),
                        'causer' => $activity->causer ? [
                            'id' => $activity->causer->id,
                            'name' => $activity->causer->name,
                        ] : null,
                    ];
                });

            // Format metrics for frontend
            $formattedMetrics = [
                'overview' => [
                    'total_leads' => $metrics['total_leads'] ?? 0,
                    'active_leads' => $metrics['active_leads'] ?? 0,
                    'conversion_rate' => round($metrics['conversion_rate'] ?? 0, 1),
                    'total_opportunities' => $metrics['total_opportunities'] ?? 0,
                ],
                'leads_over_time' => $metrics['leads_over_time'] ?? [],
                'opportunity_pipeline' => $metrics['opportunity_pipeline'] ?? [],
                'revenue_over_time' => $metrics['revenue_over_time'] ?? [],
            ];

            return Inertia::render('dashboard/index', [
                'metrics' => $formattedMetrics,
                'recent_activities' => $recentActivities,
            ]);
        } catch (\Throwable $e) {
            \Log::error('Dashboard error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Return dashboard with empty data
            return Inertia::render('dashboard/index', [
                'metrics' => [
                    'overview' => [
                        'total_leads' => 0,
                        'active_leads' => 0,
                        'conversion_rate' => 0,
                        'total_opportunities' => 0,
                    ],
                    'leads_over_time' => [],
                    'opportunity_pipeline' => [],
                    'revenue_over_time' => [],
                ],
                'recent_activities' => [],
                'error' => 'Unable to load dashboard metrics',
            ]);
        }
    }

    /**
     * Get dashboard metrics via API.
     */
    public function metrics()
    {
        try {
            $metrics = $this->metricsService->getOverview();

            return response()->json([
                'success' => true,
                'data' => $metrics,
            ]);
        } catch (\Throwable $e) {
            \Log::error('Dashboard metrics API error', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Unable to load metrics',
            ], 500);
        }
    }

    /**
     * Clear dashboard cache.
     */
    public function clearCache()
    {
        try {
            $this->metricsService->clearCache();

            return response()->json([
                'success' => true,
                'message' => 'Dashboard cache cleared successfully',
            ]);
        } catch (\Throwable $e) {
            \Log::error('Dashboard cache clear error', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to clear cache',
            ], 500);
        }
    }
}