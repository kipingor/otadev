<?php

namespace App\Services;

use App\Events\LeadMoved;
use App\Events\LeadUpdated;
use App\Models\Lead;
use App\Models\PipelineStage;
use App\Models\AuditLog;
use Illuminate\Support\Facades\DB;

class PipelineService
{
    /** Move a lead to another pipeline stage and log the change. */
    public function moveLead(int $leadId, string $toStageKey, ?int $userId = null): Lead
    {
        return DB::transaction(function () use ($leadId, $toStageKey, $userId) {
            $lead = Lead::lockForUpdate()->findOrFail($leadId);

            $stage = PipelineStage::where('key', $toStageKey)->firstOrFail();

            $old = ['pipeline_stage_id' => $lead->pipeline_stage_id];

            $lead->pipeline_stage_id = $stage->id;
            $lead->save();

            AuditLog::create([
                'auditable_type' => Lead::class,
                'auditable_id' => $lead->id,
                'user_id' => $userId,
                'event' => 'pipeline_moved',
                'old_values' => $old,
                'new_values' => ['pipeline_stage_id' => $stage->id],
            ]);

            $lead->refresh();

            LeadUpdated::dispatch($lead);
            event(new LeadMoved($lead, $toStageKey));

            return $lead;
        });
    }
}