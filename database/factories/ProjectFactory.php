<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProjectFactory extends Factory
{
    protected $model = Project::class;

    public function definition(): array
    {
        $status    = $this->faker->randomElement(['planning', 'active', 'active', 'active']);
        $startDate = $this->faker->dateTimeBetween('-6 months', 'now');
        $endDate   = $this->faker->dateTimeBetween($startDate, '+6 months');

        return [
            'opportunity_id' => null,
            'name'           => $this->faker->sentence(3),
            'description'    => $this->faker->optional()->paragraph(),
            'objectives'     => $this->faker->optional()->sentence(),
            'client_id'      => User::inRandomOrder()->first()?->id ?? User::factory()->create()->id,
            'owner_id'       => User::inRandomOrder()->first()?->id ?? User::factory()->create()->id,
            'status'         => $status,
            'phase'          => $this->faker->randomElement(['planning', 'executing', 'monitoring_controlling']),
            'start_date'     => $startDate,
            'end_date'       => $endDate,
            'budget'         => $this->faker->optional(0.8)->randomFloat(2, 5000, 200000),
            'currency'       => 'USD',
            'metadata'       => null,
        ];
    }

    public function completed(): static
    {
        return $this->state([
            'status'       => 'completed',
            'phase'        => 'closing',
            'completed_at' => $this->faker->dateTimeBetween('-3 months', 'now'),
        ]);
    }

    public function onHold(): static
    {
        return $this->state(['status' => 'on_hold', 'phase' => 'monitoring_controlling']);
    }

    public function cancelled(): static
    {
        return $this->state(['status' => 'cancelled']);
    }
}
