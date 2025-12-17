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
            // Additional metadata useful for clients/tests
            'generated_at' => now()->toIso8601String(),
            'example' => $this->metricsService->getExampleMetrics(),
        ]);
    }

    public function settings(Request $request)
    {
        return Inertia::render('dashboard/settings');
    }

    public function help(Request $request)
    {
        return Inertia::render('dashboard/help');
    }

    public function notifications(Request $request)
    {
        return Inertia::render('dashboard/notifications');
    }

    public function profile(Request $request)
    {
        return Inertia::render('dashboard/profile', [
            'user' => $request->user(),
        ]);
    }

    public function activityLog(Request $request)
    {
        return Inertia::render('dashboard/activity-log');
    }

    public function reports(Request $request)
    {
        return Inertia::render('dashboard/reports');
    }

    public function analytics(Request $request)
    {
        return Inertia::render('dashboard/analytics');
    }

    public function integrations(Request $request)
    {
        return Inertia::render('dashboard/integrations');
    }

    public function apiTokens(Request $request)
    {
        return Inertia::render('dashboard/api-tokens');
    }

    public function security(Request $request)
    {
        return Inertia::render('dashboard/security');
    }

    public function billing(Request $request)
    {
        return Inertia::render('dashboard/billing');
    }

    public function teams(Request $request)
    {
        return Inertia::render('dashboard/teams');
    }

    public function preferences(Request $request)
    {
        return Inertia::render('dashboard/preferences');
    }

    public function support(Request $request)
    {
        return Inertia::render('dashboard/support');
    }

    public function feedback(Request $request)
    {
        return Inertia::render('dashboard/feedback');
    }

    public function updates(Request $request)
    {
        return Inertia::render('dashboard/updates');
    }

    public function announcements(Request $request)
    {
        return Inertia::render('dashboard/announcements');
    }

    public function tutorials(Request $request)
    {
        return Inertia::render('dashboard/tutorials');
    }

    public function community(Request $request)
    {
        return Inertia::render('dashboard/community');
    }

    public function roadmap(Request $request)
    {
        return Inertia::render('dashboard/roadmap');
    }

    public function changelog(Request $request)
    {
        return Inertia::render('dashboard/changelog');
    }

    public function faq(Request $request)
    {
        return Inertia::render('dashboard/faq');
    }

    public function terms(Request $request)
    {
        return Inertia::render('dashboard/terms');
    }

    public function privacy(Request $request)
    {
        return Inertia::render('dashboard/privacy');
    }

    public function about(Request $request)
    {
        return Inertia::render('dashboard/about');
    }

    public function contact(Request $request)
    {
        return Inertia::render('dashboard/contact');
    }

    public function licenses(Request $request)
    {
        return Inertia::render('dashboard/licenses');
    }

    public function acknowledgements(Request $request)
    {
        return Inertia::render('dashboard/acknowledgements');
    }

    public function sitemap(Request $request)
    {
        return Inertia::render('dashboard/sitemap');
    }

    public function accessibility(Request $request)
    {
        return Inertia::render('dashboard/accessibility');
    }

    public function securitySettings(Request $request)
    {
        return Inertia::render('dashboard/security-settings');
    }

    public function notificationSettings(Request $request)
    {
        return Inertia::render('dashboard/notification-settings');
    }

    public function accountSettings(Request $request)
    {
        return Inertia::render('dashboard/account-settings');
    }

    public function displaySettings(Request $request)
    {
        return Inertia::render('dashboard/display-settings');
    }

    public function privacySettings(Request $request)
    {
        return Inertia::render('dashboard/privacy-settings');
    }

    public function integrationSettings(Request $request)
    {
        return Inertia::render('dashboard/integration-settings');
    }

    public function apiSettings(Request $request)
    {
        return Inertia::render('dashboard/api-settings');
    }
}
