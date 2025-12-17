<?php

namespace App\Services;

use App\Models\Lead;

class AiOrchestrationService
{
    public function generateFollowUpQuestions(Lead $lead): array
    {
        // Existing AI call logic moved here
        return [
            'What is the project budget?',
            'Expected timeline?',
        ];
    }

    public function enrichLeadContext(Lead $lead): array
    {
        return [
            'lead' => $lead->toArray(),            
            'pipeline_stage' => $lead->pipeline_stage,
            'status' => $lead->status,
        ];
    }
}
