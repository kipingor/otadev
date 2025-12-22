<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AiController;
use App\Http\Controllers\Api\V1\UploadController;
use App\Http\Controllers\Api\V1\PipelineController;
use App\Http\Controllers\Api\V1\TaskController;
use App\Http\Controllers\Api\V1\LeadController;
use App\Http\Controllers\Api\V1\LeadDocumentController;
use App\Http\Controllers\Api\V1\LeadQuestionController;
use App\Http\Controllers\Api\V1\OpportunityController;
use App\Http\Controllers\Api\V1\ProjectController;
use App\Http\Controllers\Api\V1\ProposalController;
use App\Http\Controllers\Api\V1\DashboardController;
use Illuminate\Http\JsonResponse;

/*
|--------------------------------------------------------------------------
| API v1 Routes
|--------------------------------------------------------------------------
| Prefix all with /api/v1 (Laravel will prefix with /api automatically)
*/

Route::prefix('v1')->group(function () {

    // Public routes (if any)
    Route::get('/health', function () {
        return response()->json([
            'status' => 'healthy',
            'timestamp' => now()->toISOString(),
        ]);
    });

    // Sanctum CSRF cookie route is provided by package (/sanctum/csrf-cookie)
    // Protected routes (Sanctum)
    Route::middleware('auth:sanctum')->group(function () {

        Route::get('/user', function (Request $request) {
            return response()->json([
                'success' => true,
                'data' => $request->user(),
            ]);
        });

        // Leads Management
        Route::apiResource('leads', LeadController::class);
        Route::post('leads/{lead}/transition', [LeadController::class, 'transition'])->name('api.leads.transition');
        Route::get('leads/statistics', [LeadController::class, 'statistics'])->name('api.leads.statistics');

        // Lead documents
        Route::prefix('leads/{lead}')->group(function () {
            Route::post('documents', [LeadDocumentController::class, 'store'])->name('api.leads.documents.store');
            Route::get('documents', [LeadDocumentController::class, 'index'])->name('api.leads.documents.index');
        });

        Route::prefix('documents')->group(function () {
            Route::get('{document}', [LeadDocumentController::class, 'show'])->name('api.documents.show');
            Route::delete('{document}', [LeadDocumentController::class, 'destroy'])->name('api.documents.destroy');
            Route::get('{document}/download', [LeadDocumentController::class, 'download'])->name('api.documents.download');
        });

        // Lead questions
        Route::apiResource('questions', LeadQuestionController::class)->except(['create', 'edit']);

        // Pipeline Manage
        Route::get('pipelines', [PipelineController::class, 'index']);
        Route::put('leads/{lead}/move', [PipelineController::class, 'move'])->name('api.leads.move');
        Route::get('pipelines/{stage}/leads', [PipelineController::class, 'getLeads'])->name('api.pipelines.leads');

        // Opportunities
        Route::apiResource('opportunities', OpportunityController::class);

        // Projects & Tasks
        Route::apiResource('projects', ProjectController::class);
        Route::prefix('projects/{project}')->group(function () {
            Route::get('tasks', [TaskController::class, 'index'])
                ->name('api.projects.tasks.index');
        });
        
        Route::apiResource('tasks', TaskController::class);

        // Proposals
        Route::post('proposals/generate', [ProposalController::class, 'generate'])
            ->name('api.proposals.generate');
        Route::apiResource('proposals', ProposalController::class)
            ->except(['create', 'edit']);

        // AI Services
        Route::prefix('ai')->group(function () {
            Route::post('generate', [\App\Http\Controllers\Api\V1\AiController::class, 'generateContent'])
                ->name('api.ai.generate');
            Route::post('follow-up', [\App\Http\Controllers\Api\V1\AiController::class, 'followUp'])
                ->name('api.ai.follow-up');
            Route::post('extract-document', [\App\Http\Controllers\Api\V1\AiController::class, 'extractDocument'])
                ->name('api.ai.extract-document');
        });

        // File Uploads
        Route::post('upload', [\App\Http\Controllers\Api\V1\UploadController::class, 'upload'])
            ->name('api.upload');
        Route::post('upload/lead-document', [\App\Http\Controllers\Api\V1\UploadController::class, 'uploadLeadDocument'])
            ->name('api.upload.lead-document');

        // Dashboard Metrics
        Route::get('dashboard/metrics', [DashboardController::class, 'metrics'])
            ->name('api.dashboard.metrics');
    });
});
