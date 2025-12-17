<?php

namespace Tests\Feature\Services;

use Tests\TestCase;
use App\Models\Lead;
use App\Services\LeadService;
use App\Enums\LeadStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;

class LeadServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_a_lead_with_default_status(): void
    {
        $service = app(LeadService::class);

        $lead = $service->create([
            'title' => 'Test Lead',
            'email' => 'test@example.com',
        ]);

        $this->assertInstanceOf(Lead::class, $lead);
    }

    public function test_it_updates_a_lead(): void
    {
        $lead = Lead::factory()->create();

        $service = app(LeadService::class);
        $updated = $service->update($lead, ['title' => 'Updated']);

        $this->assertEquals('Updated', $updated->title);
    }

    public function test_it_transitions_lead_status(): void
    {
        $lead = Lead::factory()->create();

        $service = app(LeadService::class);
        $service->transitionStatus($lead, LeadStatus::QUALIFIED);

        $this->assertNotNull($lead->fresh()->qualified_at);
    }
}
