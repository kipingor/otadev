<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\Web\DashboardController;
use App\Http\Controllers\Web\LeadController;
use App\Http\Controllers\Web\OpportunityController;
use App\Http\Controllers\Web\ProjectController;
use App\Http\Controllers\Web\HRController;
use App\Http\Controllers\Web\AccountingController;
use App\Http\Controllers\Web\PipelineController;

// Welcome page for unauthenticated users
Route::get('/welcome', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

// Redirect root based on authentication status
Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('home');
});

// Authenticated routes
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::resource('leads', LeadController::class);
    Route::resource('opportunities', OpportunityController::class);
    Route::resource('projects', ProjectController::class);

    Route::get('hr', [HRController::class, 'index'])->name('hr.index');
    Route::get('accounting', [AccountingController::class, 'index'])->name('accounting.index');

    Route::get('pipelines', [PipelineController::class, 'index'])->name('pipelines.index');
});

require __DIR__.'/settings.php';
