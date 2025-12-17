<?php

namespace App\Services;

use App\Models\Lead;
use App\Models\Proposal;

class ProposalGenerationService
{
    public function generate(Lead $lead): Proposal
    {
        return Proposal::create([
            'lead_id' => $lead->id,
            'content' => $this->buildContent($lead),
        ]);
    }

    protected function buildContent(Lead $lead): string
    {
        return json_encode([
            'lead_id' => $lead->id,
            'summary' => $lead->description,
            'generated_at' => now()->toISOString(),
        ]);
    }
}
