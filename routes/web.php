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
use App\Http\Controllers\Web\ActivityController;
use App\Http\Controllers\Web\ConversationController;
use App\Http\Controllers\Web\SupplierController;
use App\Http\Controllers\Web\VendorController;
use App\Http\Controllers\Web\LeadDocumentController;

// Welcome page for unauthenticated users — expose at root as `home`
Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('dashboard');
    }
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

// Keep legacy /welcome path available (not named)
Route::get('/welcome', function () {
    return redirect()->route('home');
});

// Authenticated routes
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/api/dashboard/metrics', [DashboardController::class, 'metrics'])->name('dashboard.metrics');

    Route::resource('leads', LeadController::class);
    Route::resource('opportunities', OpportunityController::class);
    Route::resource('projects', ProjectController::class);
    Route::resource('suppliers', SupplierController::class);

    Route::get('hr', [HRController::class, 'index'])->name('hr.index');
    Route::get('accounting', [AccountingController::class, 'index'])->name('accounting.index');

    Route::get('pipelines', [PipelineController::class, 'index'])->name('pipelines.index');
    Route::get('activities', [ActivityController::class, 'index'])->name('activities.index');
    Route::get('conversations', [ConversationController::class, 'index'])->name('conversations.index');
    Route::get('vendors', [VendorController::class, 'index'])->name('vendors.index');

    Route::post('lead-documents', [LeadDocumentController::class, 'store'])->name('lead-documents.store');
    Route::get('lead-documents/{document}', [LeadDocumentController::class, 'show'])->name('lead-documents.show');
    Route::get('lead-documents/{document}/edit', [LeadDocumentController::class, 'edit'])->name('lead-documents.edit');
    Route::put('lead-documents/{document}', [LeadDocumentController::class, 'update'])->name('lead-documents.update');
    Route::delete('lead-documents/{document}', [LeadDocumentController::class, 'destroy'])->name('lead-documents.destroy');
    Route::get('lead-documents', [LeadDocumentController::class, 'index'])->name('lead-documents.index');
    Route::get('lead-documents/create', [LeadDocumentController::class, 'create'])->name('lead-documents.create');
    Route::get('lead-documents/{document}/download', [LeadDocumentController::class, 'download'])->name('lead-documents.download');
    Route::get('lead-documents/{document}/preview', [LeadDocumentController::class, 'preview'])->name('lead-documents.preview');
    Route::get('lead-documents/{document}/thumbnail', [LeadDocumentController::class, 'thumbnail'])->name('lead-documents.thumbnail');
    Route::get('lead-documents/{document}/metadata', [LeadDocumentController::class, 'metadata'])->name('lead-documents.metadata');
    Route::get('lead-documents/{document}/text', [LeadDocumentController::class, 'text'])->name('lead-documents.text');
});

require __DIR__.'/settings.php';
require __DIR__.'/channels.php';
