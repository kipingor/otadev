<?php

namespace Tests\Feature\Services;

use Tests\TestCase;
use App\Models\Lead;
use App\Models\PipelineStage as PipelineStageModel;
use App\Services\PipelineService;
use App\Enums\PipelineStage;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PipelineServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_moves_a_lead_to_a_new_pipeline_stage(): void
    {
        $intake = PipelineStageModel::factory()->create([
            'key' => PipelineStage::INTAKE->value,
        ]);

        $discovery = PipelineStageModel::factory()->create([
            'key' => PipelineStage::DISCOVERY->value,
        ]);

        $lead = Lead::factory()->create([
            'pipeline_stage_id' => $intake->id,
        ]);

        $service = app(PipelineService::class);
        $service->move($lead, PipelineStage::DISCOVERY);

        $this->assertEquals(
            $discovery->id,
            $lead->fresh()->pipeline_stage_id
        );
    }
}
