<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\Web\DashboardController;
use App\Http\Controllers\Web\OpportunityController;
use App\Http\Controllers\Web\ProjectController;
use App\Http\Controllers\Web\HRController;
use App\Http\Controllers\Web\AccountingController;
use App\Http\Controllers\Web\PipelineController;
use App\Http\Controllers\Web\ActivityController;
use App\Http\Controllers\Web\ConversationController;
use App\Http\Controllers\Web\SupplierController;
use App\Http\Controllers\Web\VendorController;

// Welcome page for unauthenticated users — expose at root as `home`
Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('web.dashboard');
    }
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

// Keep legacy /welcome path available (not named)
Route::get('/welcome', function () {
    return redirect()->route('home');
});

Route::middleware(['auth', 'verified'])->group(function () {
    require __DIR__ . '/domain/leads.php';
    // require __DIR__ . '/domain/opportunities.php';
    // require __DIR__ . '/domain/projects.php';
    // require __DIR__ . '/domain/pipelines.php';
});





// Authenticated routes
Route::middleware(['auth', 'verified'])->name('web.')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // Optional: API endpoint for metrics
    Route::get('/api/dashboard/metrics', [DashboardController::class, 'metrics'])
        ->name('dashboard.metrics');
    
    // Optional: Clear cache
    Route::post('/api/dashboard/clear-cache', [DashboardController::class, 'clearCache'])
        ->name('dashboard.clear-cache');

    // routes/domain/opportunities.
    Route::resource('opportunities', OpportunityController::class);

    // routes/domain/projects.php
    Route::resource('projects', ProjectController::class);

    // routes/domain/pipelines.php
    Route::resource('pipelines', PipelineController::class);

    Route::resource('suppliers', SupplierController::class);

    Route::get('hr', [HRController::class, 'index'])->name('hr.index');
    Route::get('accounting', [AccountingController::class, 'index'])->name('accounting.index');

    Route::get('activities', [ActivityController::class, 'index'])->name('activities.index');
    Route::get('conversations', [ConversationController::class, 'index'])->name('conversations.index');
    Route::get('vendors', [VendorController::class, 'index'])->name('vendors.index');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/channels.php';
