<?php

namespace App\Services\Dashboard;

use App\Models\Lead;
use App\Models\User;
use App\Models\LeadDocument;
use App\Models\Opportunity;
use App\Models\Project;
use App\Models\Task;
use App\Models\Proposal;
use App\Models\Activity;
use App\Services\Lead\LeadService;
use App\Services\Pipeline\PipelineService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class DashboardMetricsService
{
    public function __construct(
        protected LeadService $leadService,
        protected PipelineService $pipelineService,
    ) {
    }

    /**
     * Get comprehensive dashboard overview
     *
     * @param int|null $userId Filter by specific user (null = all users)
     * @param bool $useCache Whether to use cached results
     * @return array
     */
    public function getOverview(?int $userId = null, bool $useCache = true): array
    {
        $cacheKey = "dashboard.overview." . ($userId ?? 'all');
        
        if ($useCache) {
            return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($userId) {
                return $this->calculateOverview($userId);
            });
        }

        return $this->calculateOverview($userId);
    }

    /**
     * Calculate dashboard overview metrics
     *
     * @param int|null $userId
     * @return array
     */
    protected function calculateOverview(?int $userId = null): array
    {
        $leadStats = $this->leadService->getStatistics();
        $pipelineStats = $this->pipelineService->getAnalytics();

        return [
            'overview' => [
                'total_leads' => $leadStats['total'] ?? 0,
                'active_leads' => ($leadStats['status']['new'] ?? 0) + ($leadStats['status']['contacted'] ?? 0),
                'conversion_rate' => $leadStats['conversion_rate'] ?? 0,
                'total_opportunities' => $pipelineStats['total_opportunities'] ?? 0,
            ],
            'leads_over_time' => $this->getLeadsOverTime(30),
            'opportunity_pipeline' => $pipelineStats['stages'] ?? [],
            'revenue_over_time' => $this->getRevenueOverTime(30),
        ];
    }

    /**
     * Get comprehensive dashboard metrics
     */
    public function getComprehensiveMetrics(): array
    {
        return Cache::remember('dashboard_metrics', 300, function () {
            $leadStats = $this->leadService->getStatistics();
            $pipelineStats = $this->pipelineService->getAnalytics();

            return [
                'overview' => [
                    'total_leads' => $leadStats['total'] ?? 0,
                    'active_leads' => ($leadStats['status']['new'] ?? 0) +
                        ($leadStats['status']['contacted'] ?? 0),
                    'conversion_rate' => $leadStats['conversion_rate'] ?? 0,
                    'total_opportunities' => $pipelineStats['total_opportunities'] ?? 0,
                ],
                'leads_over_time' => $this->getLeadsOverTime(),
                'opportunity_pipeline' => $pipelineStats['stages'] ?? [],
                'revenue_over_time' => $this->getRevenueOverTime(),
            ];
        });
    }

    public function getOverviewMetrics(): array
    {
        return [
            'leads' => Lead::count(),
            'opportunities' => Opportunity::count(),
            'open_pipeline' => Opportunity::whereNotIn('stage', ['won', 'lost'])->count(),
            'documents' => $this->getDocumentsProcessedCount(),
            'active_projects' => Project::where('status', 'active')->count(),
            'completed_tasks' => Task::where('status', 'done')->count(),
        ];
    }

    /**
     * Get activity metrics for a time period
     *
     * @param string $period 'week', 'month', 'quarter', 'year'
     * @return array
     */
    public function getActivityMetrics(string $period = 'week'): array
    {
        $dateFrom = $this->getDateFromPeriod($period);

        return Cache::remember(
            "dashboard.activity.{$period}",
            now()->addMinutes(10),
            fn () => [
                'leads_created' => Lead::where('created_at', '>=', $dateFrom)->count(),
                'leads_updated' => Lead::where('updated_at', '>=', $dateFrom)->count(),
                'documents_uploaded' => LeadDocument::where('created_at', '>=', $dateFrom)->count(),
                'proposals_generated' => Proposal::where('created_at', '>=', $dateFrom)->count(),
                'period' => $period,
                'date_from' => $dateFrom->toDateString(),
            ]
        );
    }

    /**
     * Get performance metrics
     *
     * @return array
     */
    public function getPerformanceMetrics(): array
    {
        return Cache::remember(
            'dashboard.performance',
            now()->addMinutes(15),
            fn () => [
                'average_response_time' => $this->calculateAverageResponseTime(),
                'conversion_rate' => $this->leadService->getStatistics()['conversion_rate'] ?? 0,
                'win_rate' => $this->calculateWinRate(),
                'pipeline_velocity' => $this->pipelineService->getVelocity(),
            ]
        );
    }

    /**
     * Calculate average response time (creation to first contact)
     *
     * @return float Hours
     */
    public function calculateAverageResponseTime(): float
    {
        $contactedLeads = Lead::whereNotNull('contacted_at')
            ->select('created_at', 'contacted_at')
            ->get();

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
     *
     * @return float Percentage
     */
    public function calculateWinRate(): float
    {
        $stats = DB::table('leads')
            ->selectRaw("
                SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as won,
                SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) as lost
            ")
            ->first();

        $won = $stats->won ?? 0;
        $lost = $stats->lost ?? 0;
        $total = $won + $lost;

        return $total > 0 ? round(($won / $total) * 100, 2) : 0;
    }

    /**
     * Get leads created over time
     *
     * @param int $days Number of days to look back
     * @param string|null $groupBy 'day', 'week', 'month'
     * @return array
     */
    public function getLeadsOverTime(int $days = 30, ?string $groupBy = 'day'): array
    {
        $startDate = now()->subDays($days);
        
        $dateFormat = match($groupBy) {
            'week' => '%Y-%U',
            'month' => '%Y-%m',
            default => '%Y-%m-%d',
        };

        return Cache::remember(
            "dashboard.leads_over_time.{$days}.{$groupBy}",
            now()->addMinutes(10),
            function () use ($startDate, $dateFormat) {
                return Lead::selectRaw("DATE_FORMAT(created_at, '{$dateFormat}') as date, COUNT(*) as count")
                    ->where('created_at', '>=', $startDate)
                    ->groupBy('date')
                    ->orderBy('date')
                    ->get()
                    ->map(fn ($item) => [
                        'date' => $item->date,
                        'count' => $item->count,
                    ])
                    ->toArray();
            }
        );
    }

    public function getOpportunityPipeline(): array
    {
        $pipeline = Opportunity::select('stage', DB::raw('COUNT(*) as count'))
            ->whereNotIn('stage', ['won', 'lost'])
            ->groupBy('stage')
            ->get();

        return $pipeline->map(function ($item) {
            return [
                'stage' => $item->stage,
                'count' => $item->count,
                'value' => Opportunity::where('stage', $item->stage)
                    ->whereNotIn('stage', ['won', 'lost'])
                    ->sum('estimated_value') ?? 0
            ];
        })->toArray();
    }

    /**
     * Get revenue over time from won opportunities
     *
     * @param int $days Number of days to look back
     * @param string|null $groupBy 'day', 'week', 'month'
     * @return array
     */
    public function getRevenueOverTime(int $days = 30, ?string $groupBy = 'day'): array
    {
        $startDate = now()->subDays($days);
        
        $dateFormat = match($groupBy) {
            'week' => '%Y-%U',
            'month' => '%Y-%m',
            default => '%Y-%m-%d',
        };

        return Cache::remember(
            "dashboard.revenue_over_time.{$days}.{$groupBy}",
            now()->addMinutes(10),
            function () use ($startDate, $dateFormat) {
                return Opportunity::selectRaw("DATE_FORMAT(created_at, '{$dateFormat}') as date, SUM(estimated_value) as revenue")
                    ->where('stage', 'won')
                    ->where('created_at', '>=', $startDate)
                    ->groupBy('date')
                    ->orderBy('date')
                    ->get()
                    ->map(fn ($item) => [
                        'date' => $item->date,
                        'revenue' => (float) $item->revenue,
                    ])
                    ->toArray();
            }
        );
    }

    /**
     * Get leads chart data with customizable period
     *
     * @param int $days
     * @return array
     */
    public function getLeadsChartData(int $days = 30): array
    {
        return [
            'data' => $this->getLeadsOverTime($days),
            'period' => $days . ' days',
            'start_date' => now()->subDays($days)->toDateString(),
            'end_date' => now()->toDateString(),
        ];
    }

    /**
     * Get conversion funnel data
     *
     * @return array
     */
    public function getConversionFunnel(): array
    {
        return Cache::remember(
            'dashboard.conversion_funnel',
            now()->addMinutes(15),
            function () {
                $stats = DB::table('leads')
                    ->selectRaw("
                        COUNT(*) as total,
                        SUM(CASE WHEN status IN ('new', 'contacted', 'qualified') THEN 1 ELSE 0 END) as in_progress,
                        SUM(CASE WHEN status = 'proposal_sent' THEN 1 ELSE 0 END) as proposal,
                        SUM(CASE WHEN status = 'negotiation' THEN 1 ELSE 0 END) as negotiation,
                        SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as won,
                        SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) as lost
                    ")
                    ->first();

                return [
                    'total' => $stats->total ?? 0,
                    'in_progress' => $stats->in_progress ?? 0,
                    'proposal' => $stats->proposal ?? 0,
                    'negotiation' => $stats->negotiation ?? 0,
                    'won' => $stats->won ?? 0,
                    'lost' => $stats->lost ?? 0,
                ];
            }
        );
    }

    /**
     * Clear all dashboard caches
     *
     * @return void
     */
    public function clearCache(): void
    {
        $patterns = [
            'dashboard.overview.*',
            'dashboard.activity.*',
            'dashboard.performance',
            'dashboard.top_performers.*',
            'dashboard.leads_over_time.*',
            'dashboard.revenue_over_time.*',
            'dashboard.conversion_funnel',
        ];

        foreach ($patterns as $pattern) {
            Cache::forget($pattern);
        }
    }

    /**
     * Get top performing users for a period
     *
     * @param int $limit
     * @param string $period
     * @return \Illuminate\Support\Collection
     */
    public function getTopPerformers(int $limit = 10, string $period = 'month')
    {
        $dateFrom = $this->getDateFromPeriod($period);

        return Cache::remember(
            "dashboard.top_performers.{$period}.{$limit}",
            now()->addMinutes(30),
            function () use ($limit, $dateFrom) {
                return User::withCount([
                    'ownedLeads as won_count' => fn ($q) => $q
                        ->where('status', 'won')
                        ->where('won_at', '>=', $dateFrom)
                ])
                ->withCount([
                    'ownedLeads as total_count' => fn ($q) => $q
                        ->where('created_at', '>=', $dateFrom)
                ])
                ->having('won_count', '>', 0)
                ->orderByDesc('won_count')
                ->limit($limit)
                ->get()
                ->map(fn ($user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'won_count' => $user->won_count,
                    'total_count' => $user->total_count,
                    'win_rate' => $user->total_count > 0
                        ? round(($user->won_count / $user->total_count) * 100, 2)
                        : 0,
                ]);
            }
        );
    }

    /**
     * Get date from period string
     *
     * @param string $period
     * @return \Illuminate\Support\Carbon
     */
    protected function getDateFromPeriod(string $period): \Illuminate\Support\Carbon
    {
        return match($period) {
            'week' => now()->subWeek(),
            'month' => now()->subMonth(),
            'quarter' => now()->subMonths(3),
            'year' => now()->subYear(),
            default => now()->subWeek(),
        };
    }

    public function getTaskCompletionRate(): array
    {
        $totalTasks = Task::count();
        $completedTasks = Task::where('status', 'done')->count();
        $inProgressTasks = Task::where('status', 'in_progress')->count();
        $reviewTasks = Task::where('status', 'review')->count();
        $pendingTasks = Task::where('status', 'todo')->count();

        return [
            'total' => $totalTasks,
            'completed' => $completedTasks,
            'in_progress' => $inProgressTasks + $reviewTasks, // combine in_progress and review
            'pending' => $pendingTasks,
            'completion_rate' => $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 1) : 0
        ];
    }

    /**
     * Get recent activities with relationships
     *
     * @param int $limit
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getRecentActivities(int $limit = 20)
    {
        return Activity::with(['lead', 'user'])
            ->latest()
            ->limit($limit)
            ->get();
    }

    private function getDocumentsProcessedCount(): int
    {
        // Count documents that have been processed (have AI summary)
        return LeadDocument::whereNotNull('ai_summary')->count();
    }
}
