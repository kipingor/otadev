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
use Illuminate\Http\JsonResponse;

/*
|--------------------------------------------------------------------------
| API v1 Routes
|--------------------------------------------------------------------------
| Prefix all with /api/v1 (Laravel will prefix with /api automatically)
*/

Route::prefix('v1')->group(function () {

    // Public routes (if any)
    Route::get('/user', function (Request $request): JsonResponse {
        return response()->json($request->user());
    });

    // Sanctum CSRF cookie route is provided by package (/sanctum/csrf-cookie)
    // Protected routes (Sanctum)
    Route::middleware('auth:sanctum')->group(function () {

        Route::get('/user', function (Request $request) {
            return $request->user();
        });

        // Pipeline routes
        Route::get('pipelines', [PipelineController::class, 'index']);
        Route::post('pipelines', [PipelineController::class, 'store']);
        Route::patch('pipelines/{pipeline}', [PipelineController::class, 'update']);
        Route::delete('pipelines/{pipeline}', [PipelineController::class, 'destroy']);
        Route::put('leads/{lead}/move', [PipelineController::class, 'move']);

        // Leads
        Route::apiResource('leads', LeadController::class);

        // Lead documents
        Route::post('leads/{lead}/documents', [LeadDocumentController::class, 'store']);
        Route::delete('leads/{lead}/documents/{document}', [LeadDocumentController::class, 'destroy']);

        // Lead questions
        Route::apiResource('questions', LeadQuestionController::class)->except(['create', 'edit']);

        // Projects & tasks
        Route::get('projects/{project}/tasks', [TaskController::class, 'index']);
        Route::post('tasks', [TaskController::class, 'store']);
        Route::patch('tasks/{task}', [TaskController::class, 'update']);
        Route::delete('tasks/{task}', [TaskController::class, 'destroy']);

        // Upload (example)
        Route::post('upload', [UploadController::class, 'uploadLeadDocument']);

        // AI-related routes
        Route::post('ai/generate', [AiController::class, 'generateContent']);
        Route::post('ai/follow-up', [AiController::class, 'followUp']);
    });
});
