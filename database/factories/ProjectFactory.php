<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Project>
 */
class ProjectFactory extends Factory
{
    protected $model = Project::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $status = $this->faker->randomElement(['planning', 'active', 'on_hold', 'completed', 'cancelled']);

        $clientId = User::inRandomOrder()->first()?->id ?? User::factory()->create()->id;
        $ownerId = User::inRandomOrder()->first()?->id ?? User::factory()->create()->id;

        return [
            'opportunity_id' => null, // Opportunity relation is nullable, left as null by default
            'name' => $this->faker->sentence(3),
            'description' => $this->faker->optional()->paragraph,
            'client_id' => $clientId,
            'owner_id' => $ownerId,
            'status' => $status,
            'start_date' => $this->faker->optional()->dateTimeBetween('-1 month', '+1 week'),
            'end_date' => $this->faker->optional()->dateTimeBetween('+1 week', '+6 months'),
            'budget' => $this->faker->optional()->randomFloat(2, 1000, 200000),
            'currency' => 'USD',
            'metadata' => [
                'note' => $this->faker->optional()->sentence(),
                'phase' => $this->faker->optional()->randomElement(['requirements', 'design', 'development', 'testing', 'deployment']),
            ],
        ];
    }
}
