<?php

namespace Database\Factories;

use App\Models\Lead;
use App\Models\User;
use App\Models\PipelineStage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Lead>
 */
class LeadFactory extends Factory
{
    protected $model = Lead::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // pick an existing pipeline stage or create one if none exist
        $pipelineStage = PipelineStage::inRandomOrder()->first() ?? PipelineStage::factory()->create();

        $createdBy = User::inRandomOrder()->first()?->id ?? User::factory()->create()->id;
        $ownerId = User::inRandomOrder()->first()?->id ?? User::factory()->create()->id;

        return [
            'title' => $this->faker->sentence(3),
            'description' => $this->faker->paragraph(),
            'type' => $this->faker->randomElement(['document', 'conversation']),
            'created_by' => $createdBy,
            'owner_id' => $ownerId,
            'pipeline_stage_id' => $pipelineStage->id,
            'metadata' => [
                'requirements' => $this->faker->sentences(2, true),
                'summary' => $this->faker->sentence(),
            ],
            'ai_reviewed' => $this->faker->boolean(50),
            'contacted_at' => $this->faker->optional()->dateTimeBetween('-2 months', 'now'),
            'qualified_at' => $this->faker->optional()->dateTimeBetween('-2 months', 'now'),
            'converted_to_opportunity_at' => $this->faker->optional()->dateTimeBetween('-2 months', 'now'),
            'won_at' => $this->faker->optional()->dateTimeBetween('-2 months', 'now'),
            'lost_at' => $this->faker->optional()->dateTimeBetween('-2 months', 'now'),
            'archived_at' => $this->faker->optional(0.2)->dateTimeBetween('-2 months', 'now'),
        ];
    }
}
