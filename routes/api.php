<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AiController;
use App\Http\Controllers\Api\V1\UploadController;
use App\Http\Controllers\Api\V1\PipelineController;
use App\Http\Controllers\Api\V1\TaskController;
use App\Http\Controllers\Api\V1\LeadController;
use App\Http\Controllers\Api\V1\LeadDocumentController;
use App\Http\Controllers\Api\V1\LeadQuestionController;

Route::prefix('v1')->middleware(['auth:sanctum'])->group(function () {
    // AI endpoints
    Route::post('ai/analyze', [AiController::class, 'analyze']);
    Route::post('ai/draft-email', [AiController::class, 'draftEmail']);
    
    // Upload endpoints
    Route::post('upload/lead-document', [UploadController::class, 'uploadLeadDocument']);

    // Pipeline endpoints
    Route::get('/pipeline', [PipelineController::class, 'index']);
    Route::post('pipelines/move', [PipelineController::class, 'move']);

    // Lead endpoints
    Route::apiResource('leads', LeadController::class);
    Route::get('leads/{lead}/documents', [LeadDocumentController::class, 'index']);
    Route::post('leads/{lead}/documents', [LeadDocumentController::class, 'store']);
    Route::delete('documents/{document}', [LeadDocumentController::class, 'destroy']);
    
    Route::get('leads/{lead}/questions', [LeadQuestionController::class, 'index']);
    Route::post('lead-questions', [LeadQuestionController::class, 'store']);
    Route::patch('questions/{question}', [LeadQuestionController::class, 'update']);
    Route::delete('questions/{question}', [LeadQuestionController::class, 'destroy']);

    // Project & Task endpoints
    Route::get('/projects/{project}/tasks', [TaskController::class, 'index']);
    Route::post('tasks', [TaskController::class, 'store']);
    Route::patch('tasks/{task}', [TaskController::class, 'update']);
    Route::delete('tasks/{task}', [TaskController::class, 'destroy']);

    // Additional API endpoints will be added for proposals, resources, accounting, etc.
});