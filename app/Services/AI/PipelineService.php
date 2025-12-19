<?php

namespace App\Services\AI;

use App\Events\LeadMoved;
use App\Events\LeadUpdated;
use App\Models\Lead;
use App\Models\PipelineStage as PipelineStageModel;
use App\Enums\PipelineStage as PipelineStageEnum;
use App\Services\AI\ProposalGeneratorService;
use App\Models\AuditLog;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class PipelineService
{
    /** Move a lead to another pipeline stage and log the change. */
    public function moveLead(int $leadId, string $toStageKey, ?int $userId = null): Lead
    {
        return DB::transaction(function () use ($leadId, $toStageKey, $userId) {
            $lead = Lead::lockForUpdate()->findOrFail($leadId);

            $pipelineStage = PipelineStageModel::where('key', $toStageKey)->firstOrFail();

            $old = ['pipeline_stage_id' => $lead->pipeline_stage_id];

            $lead->update(['pipeline_stage_id' => $pipelineStage->id]);

            if ($toStageKey === PipelineStageEnum::PROPOSAL->value) {
                app(ProposalGeneratorService::class)->generateFromLead($lead->owner, $lead->id);
            }

            AuditLog::create([
                'auditable_type' => Lead::class,
                'auditable_id' => $lead->id,
                'user_id' => $userId,
                'event' => 'pipeline_moved',
                'old_values' => $old,
                'new_values' => ['pipeline_stage_id' => $pipelineStage->id],
            ]);

            $lead->refresh();

            LeadUpdated::dispatch($lead);
            event(new LeadMoved($lead, $toStageKey));

            return $lead;
        });
    }

    public function move(Lead $lead, PipelineStageEnum $stage): Lead
    {
        return DB::transaction(function () use ($lead, $stage) {
            $pipelineStage = PipelineStageModel::query()
                ->where('key', $stage->value)
                ->first();

            if (! $pipelineStage) {
                throw new RuntimeException(
                    "Pipeline stage '{$stage->value}' not found."
                );
            }

            // if ($stage === PipelineStage::PROPOSAL) {
            //     $this->ProposalService->generateFromLead($lead);
            // }

            $lead->pipeline_stage_id = $pipelineStage->id;
            $lead->save();

            return $lead->refresh();
        });
    }
}
