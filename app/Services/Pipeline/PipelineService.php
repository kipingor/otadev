<?php

namespace App\Services\Pipeline;

use App\Models\Lead;
use App\Models\User;
use App\Models\PipelineStage;
use App\Events\LeadMoved;
use App\Models\AuditLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;

class PipelineService
{
    public function moveToStage(Lead $lead, string $stage, User $user)
    {
        //
    }
    /**
     * Get all pipeline stages with lead counts
     */
    public function getStagesWithLeads(): Collection
    {
        return PipelineStage::withCount('leads')
            ->orderBy('order')
            ->get();
    }

    /**
     * Get leads grouped by pipeline stage
     */
    public function getLeadsByStage(): Collection
    {
        return PipelineStage::with([
            'leads' => fn($q) => $q->orderBy('order')->with(['owner', 'user'])
        ])
        ->orderBy('order')
        ->get();
    }

    /**
     * Move lead to different pipeline stage
     */
    public function moveLead(Lead $lead, string|int $newStageId, int $newOrder = 0): Lead
    {
        return DB::transaction(function () use ($lead, $newStageId, $newOrder) {
            $lead = Lead::lockForUpdate()->findOrFail($lead->id);
            // Convert string to int if needed
            $newStageId = (int) $newStageId;
            
            $oldStageId = $lead->pipeline_stage_id;
            $oldOrder = $lead->order;

            // Update lead's stage and order
            $lead->update([
                'pipeline_stage_id' => $newStageId,
                'order' => $newOrder,
            ]);

            // Reorder leads in old stage
            $this->reorderStage($oldStageId);

            // Reorder leads in new stage
            if ($oldStageId !== $newStageId) {
                $this->reorderStage($newStageId);
            }

            $old = [
                'pipeline_stage_id' => $oldStageId,
                'order' => $oldOrder
            ];

            // Dispatch event
            event(new LeadMoved($lead, $oldStageId, $newStageId));

            AuditLog::create([
                'auditable_type' => Lead::class,
                'auditable_id' => $lead->id,
                'user_id' => auth()->user(),
                'event' => 'pipeline_moved',
                'old_values' => $old,
                'new_values' => ['pipeline_stage_id' => $newStageId],
            ]);

            return $lead->refresh()->load(['pipelineStage', 'owner']);
        });
    }

    /**
     * Reorder leads within a stage
     */
    public function reorderStage(int $stageId): void
    {
        $leads = Lead::where('pipeline_stage_id', $stageId)
            ->orderBy('order')
            ->get();

        $leads->each(function ($lead, $index) {
            $lead->update(['order' => $index]);
        });
    }

    /**
     * Update multiple lead orders in a stage
     */
    public function updateLeadOrders(int $stageId, array $leadOrders): void
    {
        DB::transaction(function () use ($stageId, $leadOrders) {
            foreach ($leadOrders as $leadId => $order) {
                Lead::where('id', $leadId)
                    ->where('pipeline_stage_id', $stageId)
                    ->update(['order' => $order]);
            }
        });
    }

    /**
     * Get pipeline analytics
     */
    public function getAnalytics(): array
    {
        $stages = PipelineStage::withCount('leads')
            ->orderBy('order')
            ->get();

        $totalLeads = Lead::count();
        $totalValue = 0; // Calculate from opportunities if available

        return [
            'stages' => $stages->map(fn($stage) => [
                'id' => $stage->id,
                'name' => $stage->name,
                'type' => $stage->type,
                'lead_count' => $stage->leads_count,
                'percentage' => $totalLeads > 0 
                    ? round(($stage->leads_count / $totalLeads) * 100, 2) 
                    : 0,
            ]),
            'total_leads' => $totalLeads,
            'total_value' => $totalValue,
            'conversion_rate' => $this->calculateConversionRate(),
            'average_time_in_pipeline' => $this->calculateAverageTimeInPipeline(),
        ];
    }

    /**
     * Calculate conversion rate (won / total)
     */
    private function calculateConversionRate(): float
    {
        $wonStage = PipelineStage::where('type', 'closed_won')->first();
        
        if (!$wonStage) {
            return 0;
        }

        $totalLeads = Lead::count();
        $wonLeads = Lead::where('pipeline_stage_id', $wonStage->id)->count();

        return $totalLeads > 0 ? round(($wonLeads / $totalLeads) * 100, 2) : 0;
    }

    /**
     * Calculate average time leads spend in pipeline
     */
    private function calculateAverageTimeInPipeline(): float
    {
        $wonStage = PipelineStage::where('type', 'closed_won')->first();
        
        if (!$wonStage) {
            return 0;
        }

        $wonLeads = Lead::where('pipeline_stage_id', $wonStage->id)
            ->whereNotNull('won_at')
            ->get();

        if ($wonLeads->isEmpty()) {
            return 0;
        }

        $totalDays = $wonLeads->sum(function ($lead) {
            return $lead->created_at->diffInDays($lead->won_at);
        });

        return round($totalDays / $wonLeads->count(), 2);
    }

    /**
     * Get pipeline velocity (leads moving forward per week)
     */
    public function getVelocity(): array
    {
        $weekAgo = now()->subWeek();

        $movementsThisWeek = DB::table('activities')
            ->where('action', 'stage_changed')
            ->where('created_at', '>=', $weekAgo)
            ->count();

        return [
            'movements_this_week' => $movementsThisWeek,
            'average_per_day' => round($movementsThisWeek / 7, 2),
        ];
    }
}