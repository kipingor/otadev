<?php

namespace Tests\Feature\Services;

use Tests\TestCase;
use App\Models\Lead;
use App\Models\Proposal;
use App\Services\AI\ProposalGeneratorService;
use App\Services\AI\OpenAIClientContract;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ProposalGeneratorServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_generates_a_proposal_for_a_lead(): void
    {
        $this->mock(OpenAIClientContract::class, function ($mock) {
            $mock->shouldReceive('generate')->andReturn('Generated proposal text');
        });

        $lead = Lead::factory()->create();
        $user = $lead->owner;

        $service = app(ProposalGeneratorService::class);
        $proposal = $service->generateFromLead($user, $lead->id);

        $this->assertDatabaseHas('proposals', [
            'lead_id' => $lead->id,
            'status' => 'generated',
        ]);
    }
}
