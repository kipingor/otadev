<?php

namespace Database\Factories;

use App\Models\Lead;
use App\Models\User;
use App\Models\PipelineStage;
use App\Enums\LeadStatus;
use Illuminate\Database\Eloquent\Factories\Factory;

class LeadFactory extends Factory
{
    protected $model = Lead::class;

    public function definition(): array
    {
        // Use withoutTenantScope so these reads work during seeding
        $pipelineStage = PipelineStage::withoutTenantScope()->inRandomOrder()->first()
            ?? PipelineStage::factory()->create();

        $createdBy = User::inRandomOrder()->first()?->id ?? User::factory()->create()->id;
        $ownerId   = User::inRandomOrder()->first()?->id ?? User::factory()->create()->id;

        return [
            // tenant_id is intentionally omitted — set explicitly in DemoDataSeeder.
            // HasTenantScope::bootHasTenantScope() will inject it from the container
            // if a tenant is bound; otherwise it stays null (test/seeder context).
            'title'                      => $this->faker->sentence(3),
            'description'                => $this->faker->paragraph(),
            'type'                       => $this->faker->randomElement(['document', 'conversation']),
            'status'                     => $this->faker->randomElement([
                LeadStatus::NEW->value,
                LeadStatus::CONTACTED->value,
                LeadStatus::QUALIFIED->value,
                LeadStatus::PROPOSAL_SENT->value,
                LeadStatus::NEGOTIATION->value,
                LeadStatus::WON->value,
                LeadStatus::LOST->value,
                LeadStatus::ARCHIVED->value,
            ]),
            'created_by'                 => $createdBy,
            'owner_id'                   => $ownerId,
            'pipeline_stage_id'          => $pipelineStage->id,
            'order'                      => $this->faker->numberBetween(1, 8),
            'metadata'                   => [
                'requirements' => $this->faker->sentences(2, true),
                'summary'      => $this->faker->sentence(),
            ],
            'ai_reviewed'                => $this->faker->boolean(50),
            'contacted_at'               => $this->faker->optional()->dateTimeBetween('-2 months', 'now'),
            'qualified_at'               => $this->faker->optional()->dateTimeBetween('-2 months', 'now'),
            'proposal_sent_at'           => $this->faker->optional()->dateTimeBetween('-2 months', 'now'),
            'negotiation_started_at'     => $this->faker->optional()->dateTimeBetween('-2 months', 'now'),
            'won_at'                     => $this->faker->optional()->dateTimeBetween('-2 months', 'now'),
            'lost_at'                    => $this->faker->optional()->dateTimeBetween('-2 months', 'now'),
        ];
    }
}
