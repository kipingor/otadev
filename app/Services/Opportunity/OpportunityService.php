<?php

namespace App\Services\Opportunity;

use App\Models\Opportunity;
use Illuminate\Support\Facades\DB;

class OpportunityService
{
    /**
     * Get paginated list of Opportunities with filters
     */
    public function list(array $filters = [], int $perPage = 15)
    {
        $query = Opportunity::query()
            ->with(['lead', 'owner']);

        //Apply Filters
        if (isset($filters['lead_id'])) {
            $query->where('lead_id', $filters['lead_id']);
        }

        if (isset($filters['owner_id'])) {
            $query->where('owner_id', $filters['owner_id']);
        }

        if (isset($filters['stage'])) {
            $query->where('stage', $filters['stage']);
        }

        if (isset($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('title', 'like', "%{$filters['search']}%")
                ->orWhere('summary', 'like', "%{$filters['search']}%");
            });
        }

        return $query->latest()->paginate($perPage);
    }

    public function markAsWon(Opportunity $opportunity): bool
    {
        return $opportunity->update(['stage' => 'closed_won']);
    }

    public function markAsLost(Opportunity $opportunity): bool
    {
        return $opportunity->update(['stage' => 'closed_lost']);
    }

    public function getStatistics(): array
    {
        return [
            'total' => Opportunity::count(),
            'qualification' => Opportunity::where('stage', 'qualification'),
            'proposal' => Opportunity::where('stage', 'proposal'),
            'negotiation' => Opportunity::where('stage', 'negotiation'),
            'closed_won' => Opportunity::where('stage', 'closed_won'),
            'closed_lost' => Opportunity::where('stage', 'closed_lost'),
        ];
    }
}
