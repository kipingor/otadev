<?php

namespace App\Enums;

enum PipelineStageKey: string
{
    case NEW = 'new';
    case QUALIFIED = 'qualified';
    case PROPOSAL = 'proposal';
    case WON = 'won';
    case LOST = 'lost';
}
