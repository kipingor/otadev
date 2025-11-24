<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\LeadMoved;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\PipelineService;
use Illuminate\Http\JsonResponse;

class PipelineController extends Controller
{
    private PipelineService $service;


    public function __construct(PipelineService $service)
    {
        $this->service = $service;
    }


    /** Move a lead to another pipeline stage */
    public function move(Request $request): JsonResponse
    {
        $data = $request->validate([
            'lead_id' => 'required|integer|exists:leads,id',
            'to_stage' => 'required|string|exists:pipeline_stages,key',
        ]);


        $lead = $this->service->moveLead($data['lead_id'], $data['to_stage'], $request->user()?->id ?? null);

        event(new LeadMoved($lead, $data['to_stage']));

        return response()->json(['ok' => true, 'lead' => $lead]);
    }
}
