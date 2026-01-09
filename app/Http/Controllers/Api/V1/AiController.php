<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\AiRequest;
use App\Services\AI\LeadAnalysisService;
use App\Services\AI\EmailDraftingService;
use Illuminate\Http\JsonResponse;

class AiController extends Controller
{
    /** Analyze uploaded document or lead metadata and return questions/summaries */
    public function analyze(AiRequest $request, LeadAnalysisService $leadAnalysisService): JsonResponse
    {
        $payload = $request->validated();

        $result = $leadAnalysisService->analyze($payload);

        return response()->json(['ok' => true, 'data' => $result]);
    }


    /** Draft an email using the AI service */
    public function draftEmail(AiRequest $request, EmailDraftingService $emailService): JsonResponse
    {
        $payload = $request->validated();

        $email = $emailService->draftEmail($payload['context'] ?? '', $payload['instructions'] ?? '');

        return response()->json(['ok' => true, 'email' => $email]);
    }
}
