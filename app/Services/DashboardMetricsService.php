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

        // Fill in missing months with zero revenue
        $data = [];
        for ($i = $months; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $year = $date->year;
            $month = $date->month;
            
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
}
