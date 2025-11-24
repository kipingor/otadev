<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AiController;
use App\Http\Controllers\Api\V1\UploadController;
use App\Http\Controllers\Api\V1\PipelineController;
use App\Http\Controllers\Api\V1\TaskController;

Route::prefix('v1')->middleware(['auth:sanctum'])->group(function () {
    Route::post('ai/analyze', [AiController::class, 'analyze']);
    Route::post('ai/draft-email', [AiController::class, 'draftEmail']);
    Route::post('upload/lead-document', [UploadController::class, 'uploadLeadDocument']);

    Route::get('/pipeline', [PipelineController::class, 'index']);
    Route::post('pipelines/move', [PipelineController::class, 'move']);

    Route::get('/projects/{project}/tasks', [TaskController::class, 'index']);

    Route::post('tasks', [TaskController::class, 'store']);
    Route::patch('tasks/{task}', [TaskController::class, 'update']);
    Route::delete('tasks/{task}', [TaskController::class, 'destroy']);

    // Additional API endpoints will be added for proposals, pipelines, resources, accounting, etc.
});