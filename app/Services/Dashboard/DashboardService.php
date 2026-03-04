<?php

namespace App\Services\Dashboard;

class DashboardService
{
    public function getComprehensiveMetrics(): array
    {
        return [
            'activity' => $this->getActivityMetrics(),
            'performance' => $this->getPerformanceMetrics(),
            'leads_over_time' => $this->getLeadsOverTime(),
            'revenue_over_time' => $this->getRevenueOverTime(),
        ];
    }
    public function getActivityMetrics(): array
    {
        return [
            'new_leads' => 120,
            'closed_deals' => 45,
            'pending_opportunities' => 30,
        ];
    }
    public function getPerformanceMetrics(): array
    {
        return [
            'conversion_rate' => 37.5,
            'average_deal_size' => 15000,
            'sales_cycle_length' => 28,
        ];
    }
    public function getLeadsOverTime(int $days = 30): array
    {
        return [
            '2024-03-01' => 5,
            '2024-03-02' => 8,
            '2024-03-03' => 12,
            // ...
        ];
    }
    public function getRevenueOverTime(int $days = 30): array
    {
        return [
            '2024-03-01' => 5000,
            '2024-03-02' => 12000,
            '2024-03-03' => 8000,
            // ...
        ];
    }
}
