<?php

namespace App\Services\Dashboard;

class DashboardService
{
    public function getComprehensiveMetrics(): array { }
    public function getActivityMetrics(): array { }
    public function getPerformanceMetrics(): array { }
    public function getLeadsOverTime(int $days = 30): array { }
    public function getRevenueOverTime(int $days = 30): array { }
}