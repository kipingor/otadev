<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Services\Dashboard\DashboardMetricsService;
use App\Models\Activity;
use Inertia\Inertia;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        private DashboardMetricsService $metricsService
    ) {
    }

    public function index()
    {
        return Inertia::render('dashboard/index', [
            'metrics' => $this->metricsService->getOverview(),
            'recent_activities' => Activity::with('causer')
                ->latest()
                ->limit(10)
                ->get(),
        ]);
    }
}
