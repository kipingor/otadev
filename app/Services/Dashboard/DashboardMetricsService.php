<?php

namespace App\Services\Dashboard;

use App\Models\Lead;
use App\Models\User;
use App\Models\Opportunity;
use App\Models\Project;
use App\Models\Task;
use App\Models\Activity;
use App\Models\PipelineStage;
use App\Models\Invoice;
use App\Enums\LeadStatus;
use App\Services\Lead\LeadService;
use App\Services\Pipeline\PipelineService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

/**
 * Consolidated Dashboard Service
 *
 * This service combines the previous DashboardMetricsService and DashboardAnalyticsService into a single class
 * that provides all the necessary data for both the dashboard overview and the analytics endpoints.
 */
class DashboardMetricsService
{
    public function __construct(
        protected LeadService $leadService,
        protected PipelineService $pipelineService,
    ) {}

    // ── Cache ─────────────────────────────────────────────────────────────────

    public function clearCache(?int $userId = null): void
    {
        $keys = [
            'dashboard.overview.' . ($userId ?? 'all'),
            'dashboard.activity.week',
            'dashboard.activity.month',
            'dashboard.pipeline',
        ];
        foreach ($keys as $key) {
            Cache::forget($key);
        }
    }

    // ── Overview Metrics (Web controller) ─────────────────────────────────────

    /**
     * Full overview for the dashboard page.
     */
    public function getOverview(?int $userId = null, bool $useCache = true): array
    {
        $cacheKey = 'dashboard.overview.' . ($userId ?? 'all');

        if ($useCache) {
            return Cache::remember($cacheKey, now()->addMinutes(5), fn () =>
                $this->calculateOverview($userId)
            );
        }

        return $this->calculateOverview($userId);
    }

    protected function calculateOverview(?int $userId): array
    {
        $leadQuery = Lead::query()->when($userId, fn ($q) => $q->where('owner_id', $userId));
        $oppQuery  = Opportunity::query()->when($userId, fn ($q) => $q->where('owner_id', $userId));

        return [
            'leads'               => (clone $leadQuery)->count(),
            'active_leads'        => (clone $leadQuery)->whereIn('status', LeadStatus::active())->count(),
            'opportunities'       => (clone $oppQuery)->count(),
            // FIX: Opportunity stage values are 'closed_won'/'closed_lost', not 'won'/'lost'
            'open_pipeline'       => (clone $oppQuery)->whereNotIn('stage', ['closed_won', 'closed_lost'])->count(),
            'projects'            => Project::when($userId, fn ($q) => $q->where('owner_id', $userId))->count(),
            'active_projects'     => Project::where('status', 'active')
                ->when($userId, fn ($q) => $q->where('owner_id', $userId))->count(),
            'overdue_invoices'    => Invoice::where('status', 'overdue')->count(),
            'conversion_rate'     => $this->leadService->getStatistics()['conversion_rate'] ?? 0,
        ];
    }

    // ── Activity Metrics ──────────────────────────────────────────────────────

    /**
     * @param string $period 'week' | 'month' | 'quarter'
     */
    public function getActivityMetrics(string $period = 'month'): array
    {
        $cacheKey = "dashboard.activity.{$period}";
        return Cache::remember($cacheKey, now()->addMinutes(10), function () use ($period) {
            $from = match ($period) {
                'week'    => now()->subWeek(),
                'quarter' => now()->subQuarter(),
                default   => now()->subMonth(),
            };

            return [
                'leads_created'       => Lead::where('created_at', '>=', $from)->count(),
                'leads_converted'     => Lead::whereNotNull('converted_to_opportunity_at')
                                             ->where('converted_to_opportunity_at', '>=', $from)->count(),
                // FIX: Opportunity stage is 'closed_won', not 'won'
                'opportunities_won'   => Opportunity::where('stage', 'closed_won')
                                                    ->where('updated_at', '>=', $from)->count(),
                'activities_logged'   => Activity::where('created_at', '>=', $from)->count(),
                'projects_completed'  => Project::where('status', 'completed')
                                                ->where('completed_at', '>=', $from)->count(),
                'revenue'             => Invoice::where('status', 'paid')
                                                ->where('updated_at', '>=', $from)->sum('total'),
            ];
        });
    }

    // ── Overview Metrics (Analytics — was DashboardAnalyticsService) ──────────

    /**
     * Filterable overview for the analytics API endpoint.
     * Merged from DashboardAnalyticsService::getOverviewMetrics().
     */
    public function getOverviewMetrics(array $filters = []): array
    {
        $dateFrom = isset($filters['date_from']) ? Carbon::parse($filters['date_from']) : now()->subDays(30);
        $dateTo   = isset($filters['date_to'])   ? Carbon::parse($filters['date_to'])   : now();

        $query = Lead::query();
        if (!empty($filters['owner_id'])) {
            $query->where('owner_id', $filters['owner_id']);
        }

        return [
            'total_leads'   => (clone $query)->count(),
            'new_leads'     => (clone $query)->whereBetween('created_at', [$dateFrom, $dateTo])->count(),
            'converted'     => (clone $query)->whereNotNull('converted_to_opportunity_at')->count(),
            'conversion_rate' => $this->calcConversionRate(clone $query),
            'total_pipeline_value' => (float) Lead::whereNotNull('pipeline_stage_id')->sum('estimated_value'),
            'average_deal_size' => $query->count() > 0
                                        ? round((float) $query->sum('estimated_value') / $query->count(), 2)
                                        : 0,
            'total_revenue' => Invoice::where('status', 'paid')
                                      ->whereBetween('updated_at', [$dateFrom, $dateTo])
                                      ->sum('total'),
            'period'        => ['from' => $dateFrom->toDateString(), 'to' => $dateTo->toDateString()],
            'won_leads' => Lead::where('status', LeadStatus::WON)->count(),
            'qualified_leads' => Lead::where('status', LeadStatus::QUALIFIED)->count(),
        ];
    }

    /**
     * Leads grouped by status — for funnel/bar charts.
     * Merged from DashboardAnalyticsService::getLeadsByStatus().
     */
    public function getLeadsByStatus(array $filters = []): array
    {
        $rows = Lead::query()
            ->select('status', DB::raw('count(*) as count'))
            ->when(!empty($filters['owner_id']), fn ($q) => $q->where('owner_id', $filters['owner_id']))
            ->groupBy('status')
            ->get();

        return $rows->map(function ($row) {
            // FIX: Lead.status is cast to LeadStatus enum — getRawOriginal() bypasses
            // the cast to get the raw DB string. tryFrom(enum_object) would throw TypeError.
            $raw  = $row->getRawOriginal('status');
            $enum = LeadStatus::tryFrom($raw);
            return [
                'status' => $raw,
                'label'  => $enum?->label() ?? ucfirst(str_replace('_', ' ', $raw ?? '')),
                'count'  => (int) $row->count,
                'color'  => $enum?->color() ?? 'gray',
            ];
        })->values()->toArray();
    }

    /**
     * Pipeline distribution by stage.
     * Merged from DashboardAnalyticsService::getPipelineByStage().
     */
    public function getPipelineByStage(array $filters = []): array
    {
        $cacheKey = 'dashboard.pipeline';
        return Cache::remember($cacheKey, now()->addMinutes(5), function () {
            return PipelineStage::withCount('leads')->orderBy('order')->get()
                ->map(fn ($stage) => [
                    'stage'  => $stage->name,
                    'key'    => $stage->key,
                    'count'  => $stage->leads_count,
                    'color'  => $stage->color,
                ])
                ->toArray();
        });
    }

    /**
     * Lead volume over time for trend charts.
     * Merged from DashboardAnalyticsService::getLeadsOverTime().
     */
    public function getLeadsOverTime(array $filters = []): array
    {
        $days  = $filters['days'] ?? 30;
        $from  = now()->subDays($days);

        return Lead::query()
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->where('created_at', '>=', $from)
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn ($row) => ['date' => $row->date, 'count' => $row->count])
            ->toArray();
    }

    /**
     * Conversion funnel percentages.
     * Merged from DashboardAnalyticsService::getConversionFunnel().
     */
    public function getConversionFunnel(array $filters = []): array
    {
        $totalLeads = Lead::count() ?: 1;
        $converted  = Lead::whereNotNull('converted_to_opportunity_at')->count();
        // FIX: Opportunity stage is 'closed_won', not 'won'
        $wons       = Opportunity::where('stage', 'closed_won')->count();
        $projects   = Project::whereNotNull('opportunity_id')->count();

        // FIX: key was 'pct' but TypeScript ConversionFunnelStage expects 'percentage'
        return [
            ['stage' => 'Leads',         'count' => $totalLeads, 'percentage' => 100.0],
            ['stage' => 'Opportunities', 'count' => $converted,  'percentage' => round($converted / $totalLeads * 100, 1)],
            ['stage' => 'Won',           'count' => $wons,       'percentage' => round($wons / $totalLeads * 100, 1)],
            ['stage' => 'Projects',      'count' => $projects,   'percentage' => round($projects / $totalLeads * 100, 1)],
        ];
    }

    /**
     * Team performance metrics.
     * Merged from DashboardAnalyticsService::getTeamPerformance().
     */
    public function getTeamPerformance(array $filters = []): array
    {
        return User::select('users.id', 'users.name')
            ->withCount([
                'leads',
                'leads as won_leads_count' => fn ($q) => $q->where('status', LeadStatus::WON),
            ])
            ->orderByDesc('leads_count')
            ->limit(10)
            ->get()
            ->map(fn ($user) => [
                'name'             => $user->name,
                'total_leads'      => $user->leads_count,
                'won_leads'        => $user->won_leads_count,
                'conversion_rate'  => $user->leads_count > 0
                    ? round($user->won_leads_count / $user->leads_count * 100, 1)
                    : 0,
            ])
            ->toArray();
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    private function calcConversionRate($query): float
    {
        $total     = (clone $query)->count();
        $converted = (clone $query)->whereNotNull('converted_to_opportunity_at')->count();
        return $total > 0 ? round($converted / $total * 100, 1) : 0;
    }

    // ── Methods absorbed from DashboardAnalyticsService (continued) ───────────

    /**
     * Leads grouped by source — for pie/bar charts.
     */
    public function getLeadsBySource(array $filters = []): array
    {
        $query = Lead::query()
            ->when(!empty($filters['owner_id']), fn ($q) => $q->where('owner_id', $filters['owner_id']))
            ->when(!empty($filters['date_from']), fn ($q) => $q->where('created_at', '>=', $filters['date_from']));

        return $query
            ->select(DB::raw("JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.source')) as source"), DB::raw('count(*) as count'))
            ->whereNotNull('metadata')
            ->groupBy('source')
            ->orderByDesc('count')
            ->limit(10)
            ->get()
            ->map(fn ($item) => ['source' => $item->source ?? 'Unknown', 'count' => $item->count])
            ->toArray();
    }

    /**
     * CRM activity statistics (calls, emails, meetings logged in activities table).
     */
    public function getActivityStats(array $filters = []): array
    {
        $from = isset($filters['date_from']) ? Carbon::parse($filters['date_from']) : now()->subDays(30);
        $to   = isset($filters['date_to'])   ? Carbon::parse($filters['date_to'])   : now();

        $query = \App\Models\Activity::whereBetween('created_at', [$from, $to])
            ->when(!empty($filters['owner_id']), fn ($q) => $q->where('user_id', $filters['owner_id']));

        return [
            'total'     => (clone $query)->count(),
            'completed' => (clone $query)->whereNotNull('completed_at')->count(),
            'pending'   => (clone $query)->whereNull('completed_at')->count(),
            'overdue'   => (clone $query)
                ->whereNull('completed_at')
                ->whereNotNull('scheduled_at')
                ->where('scheduled_at', '<', now())
                ->count(),
            'by_type'   => (clone $query)
                ->select('type', DB::raw('count(*) as count'))
                ->groupBy('type')
                ->get()
                ->keyBy('type')
                ->map(fn ($r) => $r->count)
                ->toArray(),
        ];
    }

    /**
     * Average days to close a won lead (velocity).
     */
    public function getLeadVelocity(array $filters = []): array
    {
        $leads = Lead::where('status', \App\Enums\LeadStatus::WON)
            ->whereNotNull('won_at')
            ->when(!empty($filters['owner_id']), fn ($q) => $q->where('owner_id', $filters['owner_id']))
            ->when(!empty($filters['date_from']), fn ($q) => $q->where('created_at', '>=', $filters['date_from']))
            ->get(['created_at', 'won_at']);

        if ($leads->isEmpty()) {
            return ['average_days' => 0, 'median_days' => 0, 'fastest_days' => 0, 'slowest_days' => 0, 'sample_size' => 0];
        }

        $days = $leads->map(fn ($l) => $l->created_at->diffInDays($l->won_at))->sort()->values();

        return [
            'average_days' => round($days->avg(), 1),
            'median_days'  => $days->count() % 2 === 0
                ? round(($days->get(intdiv($days->count(), 2) - 1) + $days->get(intdiv($days->count(), 2))) / 2, 1)
                : $days->get(intdiv($days->count(), 2)),
            'fastest_days' => $days->first(),
            'slowest_days' => $days->last(),
            'sample_size'  => $days->count(),
        ];
    }

    /**
     * Win/loss rate and value analysis.
     */
    /**
     * Win/loss analysis.
     *
     * FIX: was returning flat keys (won_count, lost_count, win_rate, won_value, lost_value)
     * but TypeScript WinLossAnalysis and dashboard.tsx both expect NESTED objects:
     *   win_loss.won.count / win_loss.won.percentage / win_loss.won.value
     *   win_loss.lost.count / win_loss.lost.percentage / win_loss.lost.value
     *   win_loss.total.count / win_loss.total.value
     */
    public function getWinLossAnalysis(array $filters = []): array
    {
        $query = Lead::whereIn('status', [\App\Enums\LeadStatus::WON, \App\Enums\LeadStatus::LOST])
            ->when(!empty($filters['owner_id']), fn ($q) => $q->where('owner_id', $filters['owner_id']))
            ->when(!empty($filters['date_from']), fn ($q) => $q->where('created_at', '>=', $filters['date_from']));

        $wonCount  = (clone $query)->where('status', \App\Enums\LeadStatus::WON)->count();
        $lostCount = (clone $query)->where('status', \App\Enums\LeadStatus::LOST)->count();
        $total     = $wonCount + $lostCount ?: 1; // prevent division by zero

        $wonValue  = (float) ((clone $query)->where('status', \App\Enums\LeadStatus::WON)->sum('estimated_value')  ?? 0);
        $lostValue = (float) ((clone $query)->where('status', \App\Enums\LeadStatus::LOST)->sum('estimated_value') ?? 0);

        return [
            'won' => [
                'count'      => $wonCount,
                'percentage' => round($wonCount / $total * 100, 1),
                'value'      => $wonValue,
            ],
            'lost' => [
                'count'      => $lostCount,
                'percentage' => round($lostCount / $total * 100, 1),
                'value'      => $lostValue,
            ],
            'total' => [
                'count' => $wonCount + $lostCount,
                'value' => $wonValue + $lostValue,
            ],
        ];
    }

    /**
     * 
     */
    public function getDashboardSnapshot(array $filters = []): array
    {
        return [
            // Required by TypeScript DashboardData interface:
            'overview'          => $this->getOverviewMetrics($filters),
            'leads_by_status'   => $this->getLeadsByStatus($filters),
            'leads_by_source'   => $this->getLeadsBySource($filters),
            'pipeline_by_stage' => $this->getPipelineByStage($filters),
            'conversion_funnel' => $this->getConversionFunnel($filters),
            'lead_velocity'     => $this->getLeadVelocity($filters),
            'win_loss'          => $this->getWinLossAnalysis($filters),
            // Extra — not in DashboardData interface but useful for other views:
            'leads_over_time'   => $this->getLeadsOverTime($filters),
            'activity_stats'    => $this->getActivityStats($filters),
            'team_performance'  => $this->getTeamPerformance($filters),
        ];
    }
}    