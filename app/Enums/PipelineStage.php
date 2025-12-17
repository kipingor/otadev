<?php

namespace App\Enums;

enum PipelineStage: string
{
    case INTAKE = 'intake';
    case DISCOVERY = 'discovery';
    case PROPOSAL = 'proposal';
    case NEGOTIATION = 'negotiation';

    public function requiresProposal(): bool
    {
        return $this === self::PROPOSAL;
    }
}
