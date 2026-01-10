<?php

namespace App\Listeners\Dashboard;

use App\Events\LeadCreated;
use App\Events\LeadUpdated;
use App\Events\LeadDeleted;
use App\Services\Dashboard\DashboardMetricsService;

class InvalidateDashboardCache
{
    public function __construct(
        protected DashboardMetricsService $metricsService
    ) {}

    /**
     * Handle lead events
     */
    public function handle(LeadCreated|LeadUpdated|LeadDeleted $event): void
    {
        // Clear dashboard cache when leads change
        $this->metricsService->clearCache();
    }
}