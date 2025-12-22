<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Dashboard\DashboardMetricsService;
use App\Services\Lead\LeadService;
use App\Services\Pipeline\PipelineService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        protected LeadService $leadService,
        protected PipelineService $pipelineService
    ) {}

    /**
     * Get comprehensive dashboard metrics
     */
    public function metrics(Request $request): JsonResponse
    {
        $this->authorize('viewAny', \App\Models\Lead::class);

        $leadStats = $this->getLeadMetrics();
        $pipelineStats = $this->getPipelineMetrics();

        $data = [
            'overview' => [
                'total_leads' => $leadStats['total'] ?? 0,
                'active_leads' => $leadStats['by_status']['new'] ?? 0 + $leadStats['by_status']['contacted'] ?? 0,
                'conversion_rate' => $leadStats['conversion_rate'] ?? 0,
                'total_opportunities' => $pipelineStats['total_opportunities'] ?? 0,
            ],
            'leads_over_time' => $this->getLeadsOverTime(),
            'opportunity_pipeline' => $pipelineStats['stages'] ?? [],
            'revenue_over_time' => $this->getRevenueOverTime(),
        ];

        return response()->json($data);
    }

    /**
     * Get lead-specific metrics
     */
    protected function getLeadMetrics(): array
    {
        return $this->leadService->getStatistics();
    }

    /**
     * Get pipeline metrics
     */
    protected function getPipelineMetrics(): array
    {
        return $this->pipelineService->getAnalytics();
    }

    /**
     * Get activity metrics
     */
    protected function getActivityMetrics(): array
    {
        $weekAgo = now()->subWeek();

        return [
            'leads_created_this_week' => \App\Models\Lead::where('created_at', '>=', $weekAgo)->count(),
            'leads_updated_this_week' => \App\Models\Lead::where('updated_at', '>=', $weekAgo)->count(),
            'documents_uploaded_this_week' => \App\Models\LeadDocument::where('created_at', '>=', $weekAgo)->count(),
            'proposals_generated_this_week' => \App\Models\Proposal::where('created_at', '>=', $weekAgo)->count(),
        ];
    }

    /**
     * Get performance metrics
     */
    protected function getPerformanceMetrics(): array
    {
        return [
            'average_response_time' => $this->calculateAverageResponseTime(),
            'conversion_rate' => $this->leadService->getStatistics()['conversion_rate'],
            'win_rate' => $this->calculateWinRate(),
            'pipeline_velocity' => $this->pipelineService->getVelocity(),
        ];
    }

    /**
     * Calculate average response time (time from creation to first contact)
     */
    protected function calculateAverageResponseTime(): float
    {
        $contactedLeads = \App\Models\Lead::whereNotNull('contacted_at')->get();

        if ($contactedLeads->isEmpty()) {
            return 0;
        }

        $totalHours = $contactedLeads->sum(function ($lead) {
            return $lead->created_at->diffInHours($lead->contacted_at);
        });

        return round($totalHours / $contactedLeads->count(), 2);
    }

    /**
     * Calculate win rate (won / (won + lost))
     */
    protected function calculateWinRate(): float
    {
        $won = \App\Models\Lead::where('status', 'won')->count();
        $lost = \App\Models\Lead::where('status', 'lost')->count();
        $total = $won + $lost;

        return $total > 0 ? round(($won / $total) * 100, 2) : 0;
    }

    /**
     * Get recent activities
     */
    public function recentActivities(Request $request): JsonResponse
    {
        $this->authorize('viewAny', \App\Models\Lead::class);

        $limit = $request->integer('limit', 20);

        $activities = \App\Models\Activity::with(['lead', 'user'])
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
        $this->authorize('viewAny', \App\Models\Lead::class);

        $limit = $request->integer('limit', 10);
        $period = $request->input('period', 'month');

        $dateFrom = match($period) {
            'month' => now()->subMonth(),
            'quarter' => now()->subMonths(3),
            'year' => now()->subYear(),
            default => now()->subMonth(),
        };

        $performers = \App\Models\User::withCount([
            'ownedLeads as won_count' => fn($q) => $q
                ->where('status', 'won')
                ->where('won_at', '>=', $dateFrom)
        ])
        ->withCount([
            'ownedLeads as total_count' => fn($q) => $q
                ->where('created_at', '>=', $dateFrom)
        ])
        ->having('won_count', '>', 0)
        ->orderByDesc('won_count')
        ->limit($limit)
        ->get()
        ->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'won_count' => $user->won_count,
                'total_count' => $user->total_count,
                'win_rate' => $user->total_count > 0 
                    ? round(($user->won_count / $user->total_count) * 100, 2) 
                    : 0,
            ];
        });

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
        $this->authorize('viewAny', \App\Models\Lead::class);

        $days = $request->integer('days', 30);
        $startDate = now()->subDays($days);

        $data = \App\Models\Lead::selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->where('created_at', '>=', $startDate)
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn($item) => [
                'date' => $item->date,
                'count' => $item->count,
            ]);

        return response()->json([
            'success' => true,
            'data' => $data,
            'period' => $days . ' days',
        ]);
    }

    /**
     * Get leads over time for dashboard
     */
    protected function getLeadsOverTime(): array
    {
        $days = 30;
        $startDate = now()->subDays($days);

        return \App\Models\Lead::selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->where('created_at', '>=', $startDate)
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn($item) => [
                'date' => $item->date,
                'count' => $item->count,
            ])
            ->toArray();
    }

    /**
     * Get revenue over time
     */
    protected function getRevenueOverTime(): array
    {
        $days = 30;
        $startDate = now()->subDays($days);

        return \App\Models\Opportunity::selectRaw('DATE(created_at) as date, SUM(value) as revenue')
            ->where('status', 'won')
            ->where('created_at', '>=', $startDate)
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn($item) => [
                'date' => $item->date,
                'revenue' => (float) $item->revenue,
            ])
            ->toArray();
    }
}