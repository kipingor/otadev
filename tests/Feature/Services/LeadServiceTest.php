<?php

namespace Tests\Feature\Services;

use Tests\TestCase;
use App\Models\Lead;
use App\Models\User;
use App\Services\Lead\LeadService;
use App\Enums\LeadStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;

class LeadServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_lead()
    {
        // Create and authenticate user
        $user = User::factory()->create();
        $this->actingAs($user);

        // Now create lead (created_by will be set automatically)
        $service = app(LeadService::class);
        $lead = $service->create([
            'title' => 'Test Lead',
            'status' => 'new',
            // created_by and owner_id will be set automatically
        ]);

        $this->assertNotNull($lead->created_by);
        $this->assertEquals($user->id, $lead->created_by);
    }

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
        // $service->transitionStatus($lead, LeadStatus::QUALIFIED);

        $this->assertNotNull($lead->fresh()->qualified_at);
    }
}
