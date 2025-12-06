<?php

namespace Database\Factories;

use App\Models\Task;
use App\Models\User;
use App\Models\Project;
use App\Models\Milestone;
use Illuminate\Database\Eloquent\Factories\Factory;

class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition(): array
    {
        $priority = $this->faker->randomElement(['low', 'medium', 'high']);
        $status = $this->faker->randomElement(['todo', 'in_progress', 'review', 'done']);

        return [
            'project_id' => Project::inRandomOrder()->first()?->id ?? Project::factory(),
            'milestone_id' => $this->faker->boolean(70)
                ? (Milestone::inRandomOrder()->first()?->id ?? null)
                : null,
            'title' => $this->faker->sentence(4),
            'description' => $this->faker->optional()->paragraph(),
            'assigned_to' => User::inRandomOrder()->first()?->id ?? User::factory(),
            'priority' => $priority,
            'status' => $status,
            'startAt' => $this->faker->optional()->date(),
            'endAt' => $this->faker->optional()->date(),
            'estimated_hours' => $this->faker->optional()->numberBetween(1, 80),
            'spent_hours' => $this->faker->numberBetween(0, 80),
            'group' => $this->faker->randomElement(['frontend', 'backend', 'design', 'qa', 'management']),
            'metadata' => [
                'note' => $this->faker->optional()->sentence(),
                'tags' => $this->faker->optional()->words(3),
            ],
        ];
    }
}
