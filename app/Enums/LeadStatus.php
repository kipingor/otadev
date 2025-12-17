<?php

namespace App\Enums;

enum LeadStatus: string
{
    case NEW = 'new';
    case QUALIFIED = 'qualified';
    case PROPOSAL_SENT = 'proposal_sent';
    case WON = 'won';
    case LOST = 'lost';
}
