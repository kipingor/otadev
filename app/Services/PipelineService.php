<?php

namespace App\Services;

use App\Models\Lead;
use App\Models\PipelineStage;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class PipelineService
{
    /**
     * Move a lead to a different pipeline stage.
     *
     * @param int $leadId
     * @param string $toStageKey
     * @param int|null $userId
     * @return Lead
     * @throws ModelNotFoundException
     */
    public function moveLead(int $leadId, string $toStageKey, ?int $userId = null): Lead
    {
        $lead = Lead::findOrFail($leadId);
        
        $stage = PipelineStage::where('key', $toStageKey)->firstOrFail();
        
        $lead->pipeline_stage_id = $stage->id;
        
        // Update relevant timestamp based on stage
        match($toStageKey) {
            'contacted' => $lead->contacted_at = now(),
            'qualified' => $lead->qualified_at = now(),
            'opportunity' => $lead->converted_to_opportunity_at = now(),
            'won' => $lead->won_at = now(),
            'lost' => $lead->lost_at = now(),
            default => null
        };
        
        $lead->save();
        
        // Log activity
        activity()
            ->performedOn($lead)
            ->causedBy($userId ? \App\Models\User::find($userId) : null)
            ->log("Lead moved to stage: {$toStageKey}");
        
        return $lead;
    }

    /**
     * Get all pipeline stages ordered.
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getStages()
    {
        return PipelineStage::orderBy('order')->get();
    }

    /**
     * Get leads grouped by pipeline stage.
     *
     * @return array
     */
    public function getLeadsByStage()
    {
        $stages = $this->getStages();
        
        return $stages->mapWithKeys(function ($stage) {
            return [
                $stage->key => $stage->leads()->with('owner', 'user')->get(),
            ];
        })->toArray();
    }
}
