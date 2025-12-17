<?php

namespace App\Services;

use App\Models\Lead;
use App\Models\LeadDocument;
use App\Models\Opportunity;
use App\Models\Project;
use App\Models\Task;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardMetricsService
{
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

    public function getLeadsOverTime(int $days = 30): array
    {
        $startDate = Carbon::now()->subDays($days);
        
        $leads = Lead::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(*) as count')
        )
        ->where('created_at', '>=', $startDate)
        ->groupBy('date')
        ->orderBy('date')
        ->get();

        // Fill in missing dates with zero counts
        $data = [];
        for ($i = $days; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i)->format('Y-m-d');
            $count = $leads->where('date', $date)->first()?->count ?? 0;
            $data[] = [
                'date' => $date,
                'leads' => $count,
                'formatted_date' => Carbon::parse($date)->format('M j')
            ];
        }

        return $data;
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

    public function getRevenueOverTime(int $months = 6): array
    {
        $startDate = Carbon::now()->subMonths($months);
        
        // Use driver-specific date extraction to support sqlite in tests and
        // MySQL/Postgres in production. SQLite uses strftime, other drivers
        // can use YEAR()/MONTH() functions.
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            $revenue = Opportunity::select(
                DB::raw("strftime('%Y', updated_at) as year"),
                DB::raw("strftime('%m', updated_at) as month"),
                DB::raw('SUM(estimated_value) as revenue')
            )
            ->where('updated_at', '>=', $startDate)
            ->where('stage', 'won')
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get();
        } else {
            $revenue = Opportunity::select(
                DB::raw('YEAR(updated_at) as year'),
                DB::raw('MONTH(updated_at) as month'),
                DB::raw('SUM(estimated_value) as revenue')
            )
            ->where('updated_at', '>=', $startDate)
            ->where('stage', 'won')
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get();
        }

        // Fill in missing months with zero revenue
        $data = [];
        for ($i = $months; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $year = (string) $date->year;
            // sqlite's strftime('%m') returns zero-padded months
            $month = $driver === 'sqlite' ? str_pad($date->month, 2, '0', STR_PAD_LEFT) : $date->month;
            
            $monthRevenue = $revenue->where('year', $year)
                ->where('month', $month)
                ->first()?->revenue ?? 0;
                
            $data[] = [
                'month' => $date->format('Y-m'),
                'revenue' => (float) $monthRevenue,
                'formatted_month' => $date->format('M Y')
            ];
        }

        return $data;
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
