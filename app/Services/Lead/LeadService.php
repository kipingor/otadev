<?php

namespace App\Services\Lead;

use App\Models\Lead;
use App\Models\User;
use App\Enums\LeadStatus;
use App\Events\LeadCreated;
use App\Events\LeadUpdated;
use App\Events\LeadDeleted;
use Illuminate\Support\Facades\DB;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class LeadService
{
    /**
     * Get paginated list of leads with filters
     */
    public function list(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Lead::query()
            ->with(['owner', 'pipelineStage', 'user']);

        // Apply filters
        if (isset($filters['owner_id'])) {
            $query->where('owner_id', $filters['owner_id']);
        }

        if (isset($filters['pipeline_stage_id'])) {
            $query->where('pipeline_stage_id', $filters['pipeline_stage_id']);
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (isset($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('title', 'like', "%{$filters['search']}%")
                    ->orWhere('description', 'like', "%{$filters['search']}%");
            });
        }

        return $query->latest()->paginate($perPage)->withQueryString();
    }

    /**
     * Create a new lead
     */
    public function create(array $data): Lead
    {
        return DB::transaction(function () use ($data) {
            // Set default status if not provided
            if (!isset($data['status'])) {
                $data['status'] = LeadStatus::NEW;
            }

            // Set created_by to current user if not provided
            if (!isset($data['created_by'])) {
                $data['created_by'] = auth()->user();
            }

            // Set owner_id to current user if not provided
            if (!isset($data['owner_id'])) {
                $data['owner_id'] = auth()->user();
            }

            $lead = Lead::create($data);

            event(new LeadCreated($lead));

            return $lead->load(['owner', 'pipelineStage', 'user']);
        });
    }

    /**
     * Update an existing lead
     */
    public function update(Lead $lead, array $data): Lead
    {
        return DB::transaction(function () use ($lead, $data) {
            $originalData = $lead->toArray();

            $lead->fill($data);
            $lead->save();

            event(new LeadUpdated($lead, $originalData));

            return $lead->refresh()->load(['owner', 'pipelineStage', 'user']);
        });
    }

    /**
     * Soft delete a lead
     */
    public function delete(Lead $lead): bool
    {
        return DB::transaction(function () use ($lead) {
            $deleted = $lead->delete();

            if ($deleted) {
                event(new LeadDeleted($lead));
            }

            return $deleted;
        });
    }

    /**
     * Restore a soft-deleted lead
     */
    public function restore(Lead $lead): bool
    {
        return $lead->restore();
    }

    /**
     * Get leads by owner
     */
    public function getByOwner(User $user, int $perPage = 15): LengthAwarePaginator
    {
        return $this->list(['owner_id' => $user->id], $perPage);
    }

    /**
     * Get leads by pipeline stage
     */
    public function getByPipelineStage(int $stageId): Collection
    {
        return Lead::where('pipeline_stage_id', $stageId)
            ->with(['owner', 'user'])
            ->orderBy('order')
            ->get();
    }

    /**
     * Get leads by status
     */
    public function getByStatus(LeadStatus $status, int $perPage = 15): LengthAwarePaginator
    {
        return $this->list(['status' => $status->value], $perPage);
    }

    /**
     * Update lead order within a stage
     */
    public function updateOrder(Lead $lead, int $newOrder): Lead
    {
        $lead->update(['order' => $newOrder]);

        return $lead->refresh();
    }

    /**
     * Assign lead to a user
     */
    public function assignTo(Lead $lead, User $user): Lead
    {
        return $this->update($lead, ['owner_id' => $user->id]);
    }

    /**
     * Mark lead as AI reviewed
     */
    public function markAsAiReviewed(Lead $lead): Lead
    {
        return $this->update($lead, ['ai_reviewed' => true]);
    }

    /**
     * Archive a lead
     */
    public function archive(Lead $lead): Lead
    {
        return $this->update($lead, [
            'status' => LeadStatus::ARCHIVED,
            'archived_at' => now(),
        ]);
    }

    /**
     * Get lead statistics
     */
    public function getStatistics(): array
    {
        return Cache::remember('lead_statistics', 300, function () {
            return [
                'total' => Lead::count(),
                'new' => Lead::where('status', LeadStatus::NEW->value)->count(),
                'qualified' => Lead::where('status', LeadStatus::QUALIFIED->value)->count(),
                'won' => Lead::where('status', LeadStatus::WON->value)->count(),
                'lost' => Lead::where('status', LeadStatus::LOST->value)->count(),
                'conversion_rate' => $this->calculateConversionRate(),
            ];
        });
    }

    /**
     * Calculate conversion rate
     */
    private function calculateConversionRate(): float
    {
        $total = Lead::whereNotIn('status', [LeadStatus::NEW->value])->count();
        $won = Lead::where('status', LeadStatus::WON->value)->count();

        return $total > 0 ? round(($won / $total) * 100, 2) : 0;
    }
}
