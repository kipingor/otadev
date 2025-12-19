<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\User;
use App\Enums\PipelineStage;
use App\Services\AI\PipelineService;
use App\Models\PipelineStage as PipelineStageModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Illuminate\Support\Facades\DB;

class PipelineToProposalTest extends TestCase
{
    use RefreshDatabase;

    public function test_pipeline_move_to_proposal_triggers_generation(): void
    {
        $user = User::factory()->create();

        $discovery = PipelineStageModel::factory()->create([
            'key' => PipelineStage::DISCOVERY->value,
        ]);

        $proposal = PipelineStageModel::factory()->create([
            'key' => PipelineStage::PROPOSAL->value,
        ]);

        $lead = Lead::factory()->for($user)->create([
            'pipeline_stage_id' => $discovery->id,
        ]);

        $this->actingAs($user);
        
        app(PipelineService::class)->moveLead(
            $lead->id,
            PipelineStage::PROPOSAL->value,
            $user->id
        );

        $this->assertDatabaseHas('proposals', [
            'lead_id' => $lead->id,
        ]);
    }
}
