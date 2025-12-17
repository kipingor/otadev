<?php

namespace App\Services;

use App\Models\Lead;
use App\Enums\LeadStatus;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class LeadService
{
    public function create(array $data): Lead
    {
        return Lead::create($data);
    }

    public function update(Lead $lead, array $data): Lead
    {
        $lead->fill($data);
        $lead->save();

        return $lead->refresh();
    }

    public function transitionStatus(Lead $lead, LeadStatus $status): Lead
    {
        match ($status) {
            LeadStatus::QUALIFIED => $lead->qualified_at = now(),
            LeadStatus::WON       => $lead->won_at = now(),
            LeadStatus::LOST      => $lead->lost_at = now(),
            default               => null,
        };

        $lead->save();

        return $lead->refresh();
    }
}
