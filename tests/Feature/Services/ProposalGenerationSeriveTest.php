<?php

namespace Tests\Feature\Services;

use Tests\TestCase;
use App\Models\Lead;
use App\Models\Proposal;
use App\Services\ProposalGenerationService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ProposalGenerationServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_generates_a_proposal_for_a_lead(): void
    {
        $lead = Lead::factory()->create();

        $service = app(ProposalGenerationService::class);
        $proposal = $service->generate($lead);

        $this->assertInstanceOf(Proposal::class, $proposal);
        $this->assertEquals($lead->id, $proposal->lead_id);
        $this->assertNotEmpty($proposal->content);
    }
}
