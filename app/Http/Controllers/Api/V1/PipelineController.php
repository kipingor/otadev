<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pipeline\MovePipelineRequest;
use App\Services\AI\PipelineService;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;

class PipelineController extends Controller
{
    public function __construct(
        protected PipelineService $pipelineService
    ) {}


    /** Move a lead to another pipeline stage */
    public function move(MovePipelineRequest $request, Lead $lead): JsonResponse
    {
        $this->authorize('update', $lead);

        $this->pipelineService->move(
            $lead,
            $request->getPipelineStage()
        );

        return response()->json([
            'success' => true,
            'message' => 'Pipeline stage updated.'
        ]);
    }
}
