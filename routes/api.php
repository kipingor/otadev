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

Route::prefix('v1')->name('api.')->group(function () {

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

        // ========================================================================
        // LEADS MANAGEMENT
        // ========================================================================
        // FIXED: Custom routes BEFORE resource routes to prevent {id} matching
        
        // Custom lead routes (specific paths first)
        Route::get('leads/statistics', [LeadController::class, 'statistics'])
            ->name('leads.statistics');
        
        Route::post('leads/bulk', [LeadController::class, 'bulkStore'])
            ->name('leads.bulk-store');
        
        Route::patch('leads/bulk', [LeadController::class, 'bulkUpdate'])
            ->name('leads.bulk-update');
        
        Route::delete('leads/bulk', [LeadController::class, 'bulkDestroy'])
            ->name('leads.bulk-destroy');
        
        // Lead-specific action routes
        Route::post('leads/{lead}/transition', [LeadController::class, 'transition'])
            ->name('leads.transition');
        
        Route::post('leads/{lead}/restore', [LeadController::class, 'restore'])
            ->name('leads.restore');
        
        // Standard resource routes (must be last for leads)
        Route::apiResource('leads', LeadController::class);

        // ========================================================================
        // LEAD DOCUMENTS
        // ========================================================================
        Route::prefix('leads/{lead}')->group(function () {
            Route::post('documents', [LeadDocumentController::class, 'store'])
                ->name('leads.documents.store');
            Route::get('documents', [LeadDocumentController::class, 'index'])
                ->name('leads.documents.index');
        });

        Route::prefix('documents')->group(function () {
            Route::get('{document}', [LeadDocumentController::class, 'show'])
                ->name('documents.show');
            Route::delete('{document}', [LeadDocumentController::class, 'destroy'])
                ->name('documents.destroy');
            Route::get('{document}/download', [LeadDocumentController::class, 'download'])
                ->name('documents.download');
        });

        // ========================================================================
        // LEAD QUESTIONS
        // ========================================================================
        Route::apiResource('questions', LeadQuestionController::class)
            ->except(['create', 'edit']);

        // ========================================================================
        // PIPELINE MANAGEMENT
        // ========================================================================
        Route::get('pipelines', [PipelineController::class, 'index'])
            ->name('pipelines.index');
        
        Route::put('leads/{lead}/move', [PipelineController::class, 'move'])
            ->name('leads.move');
        
        Route::get('pipelines/{stage}/leads', [PipelineController::class, 'getLeads'])
            ->name('pipelines.leads');

        // ========================================================================
        // OPPORTUNITIES
        // ========================================================================
        // Custom opportunity routes first (if any exist)
        // Route::get('opportunities/statistics', [OpportunityController::class, 'statistics']);
        
        Route::apiResource('opportunities', OpportunityController::class);

        // ========================================================================
        // PROJECTS & TASKS
        // ========================================================================
        // Custom project routes first (if any exist)
        // Route::get('projects/statistics', [ProjectController::class, 'statistics']);
        
        Route::apiResource('projects', ProjectController::class);
        
        Route::prefix('projects/{project}')->group(function () {
            Route::get('tasks', [TaskController::class, 'index'])
                ->name('projects.tasks.index');
        });
        
        // Custom task routes first (if any exist)
        // Route::get('tasks/statistics', [TaskController::class, 'statistics']);
        
        Route::apiResource('tasks', TaskController::class);

        // ========================================================================
        // PROPOSALS
        // ========================================================================
        // Custom routes BEFORE resource
        Route::post('proposals/generate', [ProposalController::class, 'generate'])
            ->name('proposals.generate');
        
        Route::apiResource('proposals', ProposalController::class)
            ->except(['create', 'edit']);

        // ========================================================================
        // AI SERVICES
        // ========================================================================
        Route::prefix('ai')->group(function () {
            Route::post('generate', [AiController::class, 'generateContent'])
                ->name('ai.generate');
            
            Route::post('follow-up', [AiController::class, 'followUp'])
                ->name('ai.follow-up');
            
            Route::post('extract-document', [AiController::class, 'extractDocument'])
                ->name('ai.extract-document');
        });

        // ========================================================================
        // FILE UPLOADS
        // ========================================================================
        Route::post('upload', [UploadController::class, 'upload'])
            ->name('upload');
        
        Route::post('upload/lead-document', [UploadController::class, 'uploadLeadDocument'])
            ->name('upload.lead-document');

        // ========================================================================
        // DASHBOARD METRICS
        // ========================================================================
        Route::get('dashboard/metrics', [DashboardController::class, 'metrics'])
            ->name('dashboard.metrics');
    });
});
