<?php

namespace App\Services;

use App\Models\Lead;
use App\Models\User;
use App\Models\LeadDocument;
use App\Models\Opportunity;
use App\Models\Project;
use App\Models\Task;
use App\Models\Proposal;
use App\Services\Lead\LeadService;
use App\Services\Pipeline\PipelineService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class DashboardMetricsService
{
    public function __construct(
        protected LeadService $leadService,
        protected PipelineService $pipelineService,
    ) {}

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
     * Get activity metrics
     */
    public function getActivityMetrics(): array
    {
        $weekAgo = now()->subWeek();

        return [
            'leads_created_this_week' => Lead::where('created_at', '>=', $weekAgo)->count(),
            'leads_updated_this_week' => Lead::where('updated_at', '>=', $weekAgo)->count(),
            'documents_uploaded_this_week' => LeadDocument::where('created_at', '>=', $weekAgo)->count(),
            'proposals_generated_this_week' => Proposal::where('created_at', '>=', $weekAgo)->count(),
        ];
    }

    /**
     * Get performance metrics
     */
    public function getPerformanceMetrics(): array
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
        $contactedLeads = Lead::whereNotNull('contacted_at')->get();

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
        $won = Lead::where('status', 'won')->count();
        $lost = Lead::where('status', 'lost')->count();
        $total = $won + $lost;

        return $total > 0 ? round(($won / $total) * 100, 2) : 0;
    }

    public function getLeadsOverTime(int $days = 30): array
    {
        $startDate = now()->subDays($days);

        return Lead::selectRaw('DATE(created_at) as date, COUNT(*) as count')
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

    public function getRevenueOverTime(int $days = 30): array
    {
        $startDate = now()->subDays($days);

        return Opportunity::selectRaw('DATE(created_at) as date, SUM(estimated_value) as revenue')
            ->where('stage', 'won')
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

    /**
     * Get top performers
     */
    public function getTopPerformers(int $limit = 10, string $period = 'month'): array
    {
        $dateFrom = match($period) {
            'month' => now()->subMonth(),
            'quarter' => now()->subMonths(3),
            'year' => now()->subYear(),
            default => now()->subMonth(),
        };

        return User::withCount([
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
        })
        ->toArray();
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

    public function getRecentActivity(int $limit = 10): array
    {
        // This would typically aggregate from multiple activity sources
        // For now, we'll return recent leads and opportunities
        $recentLeads = Lead::with('user')
            ->latest()
            ->limit($limit / 2)
            ->get()
            ->map(function ($lead) {
                return [
                    'type' => 'lead',
                    'title' => "New lead: {$lead->company_name}",
                    'description' => $lead->contact_email,
                    'created_at' => $lead->created_at,
                    'user' => $lead->user?->name
                ];
            });

        $recentOpportunities = Opportunity::with('owner')
            ->latest()
            ->limit($limit / 2)
            ->get()
            ->map(function ($opportunity) {
                return [
                    'type' => 'opportunity',
                    'title' => "Opportunity updated: {$opportunity->title}",
                    'description' => "Stage: {$opportunity->stage}",
                    'created_at' => $opportunity->updated_at,
                    'user' => $opportunity->owner?->name
                ];
            });

        return $recentLeads->concat($recentOpportunities)
            ->sortByDesc('created_at')
            ->take($limit)
            ->values()
            ->toArray();
    }

    private function getDocumentsProcessedCount(): int
    {
        // Count documents that have been processed (have AI summary)
        return LeadDocument::whereNotNull('ai_summary')->count();
    }

    /**
     * Return a compact example payload for frontend/dev tests.
     * This does not affect production metrics but provides deterministic
     * example data that can be used in client-side tests or storybook.
     */
    public function getExampleMetrics(): array
    {
        return [
            'overview' => [
                'leads' => 42,
                'opportunities' => 12,
                'open_pipeline' => 9,
                'documents' => 7,
                'active_projects' => 3,
                'completed_tasks' => 27,
            ],
            'leads_over_time' => [
                ['date' => now()->subDays(6)->format('Y-m-d'), 'leads' => 0, 'formatted_date' => now()->subDays(6)->format('M j')],
                ['date' => now()->subDays(5)->format('Y-m-d'), 'leads' => 1, 'formatted_date' => now()->subDays(5)->format('M j')],
                ['date' => now()->subDays(4)->format('Y-m-d'), 'leads' => 2, 'formatted_date' => now()->subDays(4)->format('M j')],
                ['date' => now()->subDays(3)->format('Y-m-d'), 'leads' => 3, 'formatted_date' => now()->subDays(3)->format('M j')],
                ['date' => now()->subDays(2)->format('Y-m-d'), 'leads' => 5, 'formatted_date' => now()->subDays(2)->format('M j')],
                ['date' => now()->subDays(1)->format('Y-m-d'), 'leads' => 8, 'formatted_date' => now()->subDays(1)->format('M j')],
                ['date' => now()->format('Y-m-d'),           'leads' => 23, 'formatted_date' => now()->format('M j')],
            ],
            'opportunity_pipeline' => [
                ['stage' => 'Prospect', 'count' => 4, 'value' => 12000],
                ['stage' => 'Qualified', 'count' => 3, 'value' => 8000],
                ['stage' => 'Proposal', 'count' => 2, 'value' => 15000],
            ],
            'revenue_over_time' => [
                ['month' => now()->subMonths(2)->format('Y-m'), 'revenue' => 12000.0, 'formatted_month' => now()->subMonths(2)->format('M Y')],
                ['month' => now()->subMonths(1)->format('Y-m'), 'revenue' => 18000.0, 'formatted_month' => now()->subMonths(1)->format('M Y')],
                ['month' => now()->format('Y-m'),             'revenue' => 23000.0, 'formatted_month' => now()->format('M Y')],
            ],
            'task_completion' => [
                'total' => 40,
                'completed' => 27,
                'in_progress' => 8,
                'pending' => 5,
                'completion_rate' => 67.5,
            ],
            'recent_activity' => [
                ['type' => 'lead', 'title' => 'New lead: Acme Co', 'description' => 'acme@example.com', 'created_at' => now()->subHours(2), 'user' => 'Alice'],
                ['type' => 'opportunity', 'title' => 'Opportunity updated: Project X', 'description' => 'Stage: Proposal', 'created_at' => now()->subDay(), 'user' => 'Bob'],
            ],
        ];
    }
}
