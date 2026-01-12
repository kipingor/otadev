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
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;
use App\Traits\Cacheable;

class LeadService
{
    use Cacheable;

    /**
     * Get paginated list of leads with filters
     */
    public function list(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Lead::indexQuery();

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
     * Create a new lead with proper event dispatching
     *
     * This method ensures:
     * 1. Default values are set appropriately
     * 2. Transaction safety for data consistency
     * 3. LeadCreated event is dispatched for listeners
     * 4. Relationships are eager loaded for performance
     *
     * @param array $data Lead attributes
     * @return Lead The created lead with loaded relationships
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
                $data['created_by'] = Auth::id();
            }

            // Set owner_id to current user if not provided
            if (!isset($data['owner_id'])) {
                $data['owner_id'] = Auth::id();
            }

            // Set default pipeline_stage_id if not provided
            if (!isset($data['pipeline_stage_id'])) {
                // Get the first intake stage as default
                $defaultStage = \App\Models\PipelineStage::where('type', 'intake')
                    ->orderBy('order')
                    ->first();
                
                if ($defaultStage) {
                    $data['pipeline_stage_id'] = $defaultStage->id;
                }
            }

            // Create the lead
            $lead = Lead::create($data);

            // Dispatch event for listeners (notifications, logging, etc.)
            event(new LeadCreated($lead));

            // Return with relationships loaded
            return $lead->load(['owner', 'pipelineStage', 'user']);
        });
    }

    /**
     * Update an existing lead with proper event dispatching
     * 
     * @param Lead $lead The lead to update
     * @param array $data Updated attributes
     * @return Lead The updated lead with refreshed relationships
     */
    public function update(Lead $lead, array $data): Lead
    {
        return DB::transaction(function () use ($lead, $data) {
            // Store original data for event
            $originalData = $lead->toArray();

            // Update the lead
            $lead->fill($data);
            $lead->save();

            // Dispatch update event
            event(new LeadUpdated($lead, $originalData));

            // Return with refreshed relationships
            return $lead->refresh()->load(['owner', 'pipelineStage', 'user']);
        });
    }

    /**
     * Soft delete a lead with proper event dispatching
     * 
     * @param Lead $lead The lead to delete
     * @return bool True if deletion was successful
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
     * 
     * @param Lead $lead The lead to restore
     * @return bool True if restoration was successful
     */
    public function restore(Lead $lead): bool
    {
        return $lead->restore();
    }

    /**
     * Force delete a lead (permanent deletion)
     * 
     * @param Lead $lead The lead to permanently delete
     * @return bool True if deletion was successful
     */
    public function forceDelete(Lead $lead): bool
    {
        return $lead->forceDelete();
    }

    /**
     * Get a single lead by ID with relationships
     * 
     * @param int $id Lead ID
     * @return Lead|null
     */
    public function find(int $id): ?Lead
    {
        return Lead::with(['owner', 'pipelineStage', 'user'])->find($id);
    }

    /**
     * Get a single lead by ID or fail
     * 
     * @param int $id Lead ID
     * @return Lead
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     */
    public function findOrFail(int $id): Lead
    {
        return Lead::with(['owner', 'pipelineStage', 'user'])->findOrFail($id);
    }

    /**
     * Get all leads for a specific user
     * 
     * @param User|int $user User instance or ID
     * @return Collection
     */
    public function getByOwner(User $user): Collection
    {
        $userId = $user instanceof User ? $user->id : $user;

        return Lead::where('owner_id', $userId)
            ->with(['owner', 'pipelineStage', 'user'])
            ->latest()
            ->get();
    }

    /**
     * Get leads count grouped by status
     * 
     * @return array
     */
    public function getStatusCounts(): array
    {
        return Lead::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();
    }

    /**
     * Get leads count grouped by pipeline stage
     * 
     * @return array
     */
    public function getStageCounts(): array
    {
        return Lead::selectRaw('pipeline_stage_id, COUNT(*) as count')
            ->groupBy('pipeline_stage_id')
            ->with('pipelineStage')
            ->get()
            ->pluck('count', 'pipelineStage.name')
            ->toArray();
    }

    /**
     * Bulk create leads
     * 
     * @param array $leadsData Array of lead data
     * @return Collection Collection of created leads
     */
    public function bulkCreate(array $leadsData): Collection
    {
        return DB::transaction(function () use ($leadsData) {
            $leads = collect();

            foreach ($leadsData as $data) {
                $leads->push($this->create($data));
            }

            return $leads;
        });
    }

    /**
     * Bulk update leads
     * 
     * @param array $updates Array of ['id' => leadId, 'data' => updateData]
     * @return Collection Collection of updated leads
     */
    public function bulkUpdate(array $updates): Collection
    {
        return DB::transaction(function () use ($updates) {
            $leads = collect();

            foreach ($updates as $update) {
                $lead = Lead::findOrFail($update['id']);
                $leads->push($this->update($lead, $update['data']));
            }

            return $leads;
        });
    }

    /**
     * Bulk delete leads
     * 
     * @param array $leadIds Array of lead IDs to delete
     * @return int Number of leads deleted
     */
    public function bulkDelete(array $leadIds): int
    {
        return DB::transaction(function () use ($leadIds) {
            $count = 0;

            foreach ($leadIds as $leadId) {
                $lead = Lead::find($leadId);
                if ($lead && $this->delete($lead)) {
                    $count++;
                }
            }

            return $count;
        });
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
            return ([
                'total' => Lead::count(),
                'new' => Lead::where('status', LeadStatus::NEW->value)->count(),
                'qualified' => Lead::where('status', LeadStatus::QUALIFIED->value)->count(),
                'won' => Lead::where('status', LeadStatus::WON->value)->count(),
                'lost' => Lead::where('status', LeadStatus::LOST->value)->count(),
                'conversion_rate' => $this->calculateConversionRate(),
            ]);
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
