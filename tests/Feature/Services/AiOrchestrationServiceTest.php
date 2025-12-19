<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Models\Lead;
use App\Services\AI\AiOrchestrationService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AiOrchestrationServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_generates_follow_up_questions(): void
    {
        $lead = Lead::factory()->create();
        $user = $lead->owner;

        $service = app(AiOrchestrationService::class);
        $questions = $service->generateFollowUpQuestions($user, $lead->id);

        $this->assertIsArray($questions);
        $this->assertNotEmpty($questions);
    }

    public function test_it_enriches_lead_context(): void
    {
        $lead = Lead::factory()->create();

        $service = app(AiOrchestrationService::class);
        $context = $service->enrichLeadContext($lead);

        $this->assertArrayHasKey('lead', $context);
        $this->assertArrayHasKey('pipeline_stage', $context);
        $this->assertArrayHasKey('status', $context);
    }
}
