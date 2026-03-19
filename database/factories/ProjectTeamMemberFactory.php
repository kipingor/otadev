<?php

namespace Database\Factories;

use App\Models\ProjectTeamMember;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ProjectTeamMember>
 */
class ProjectTeamMemberFactory extends Factory
{
    protected $model = ProjectTeamMember::class;
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'project_id' => \App\Models\Project::factory(),
            'user_id' => \App\Models\User::factory(),
            'role' => $this->faker->randomElement(['Developer', 'Designer', 'Project Manager', 'Tester']),
            'allocation_percentage' => $this->faker->numberBetween(10, 100),
            'joined_at' => $this->faker->dateTimeBetween('-1 year', 'now'),
        ];
    }
}
