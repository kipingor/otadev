<?php

namespace App\Services\AI;

use App\Models\Lead;
use App\Services\LeadService;
use App\Services\AI\ProposalGeneratorService;

class AiOrchestrationService
{
    public function __construct(
        protected LeadService $leads,
        protected PipelineService $pipeline,
        protected ProposalGeneratorService $proposal
    ){}

    public function generate(object $user, int $leadId, string $mode, array $payload): array
    {
        $lead = $this->leads->findForUser($user, $leadId);

        if ($mode === 'proposal') {
            return $this->proposal->generateFromLead($user, $lead->id);
        }

        return [
            'questions' => $this->generateFollowUpQuestions($user, $leadId),
        ];
    }

    public function generateFollowUpQuestions(object $user, int $leadId): array
    {
        $lead = $this->leads->findForUser($user, $leadId);

        // Existing AI call logic moved here
        return [
            'What is the expected project timeline?',
            'What is the project budget?',
            'Who are the decision makers?',
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
