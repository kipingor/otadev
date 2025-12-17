<?php

namespace App\Services;

use App\Models\Lead;
use App\Models\PipelineStage as PipelineStageModel;
use App\Enums\PipelineStage;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class PipelineService
{
    public function move(Lead $lead, PipelineStage $stage): Lead
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

            $lead->pipeline_stage_id = $pipelineStage->id;
            $lead->save();

            return $lead->refresh();
        });
    }
}
