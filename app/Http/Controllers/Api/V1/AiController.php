<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\AiRequest;
use App\Http\Requests\Ai\GenerateAiContentRequest;
use App\Services\AI\AiOrchestrationService;
use App\Services\AI\LeadAnalysisService;
use App\Services\AI\EmailDraftingService;
use Illuminate\Http\JsonResponse;

class AiController extends Controller
{
    public function __construct(
        protected AiOrchestrationService $ai
    ){}
        
    public function generateContent(GenerateAiContentRequest $request): JsonResponse
    {
        $result = $this->ai->generate(
            user: $request->user(),
            leadId: $request->lead_id,
            mode: $request->mode,
            payload: $request->validated()
        );

        return response()->json($result);
        // $payload = $request->validated();

        // $content = $this->ai->generateContent($payload);

        // return response()->json(['ok' => true, 'content' => $content]);
    }

    public function followUp(GenerateAiContentRequest $request): JsonResponse
    {
        $questions = $this->ai->generateFollowUpQuestions(
            user: $request->user(),
            leadId: $request->lead_id
        );

        return response()->json([
            'questions' => $questions
        ]);
    }

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

        $email = $emailService->draft($payload['context'] ?? '', $payload['instructions'] ?? '');

        return response()->json(['ok' => true, 'email' => $email]);
    }
}
