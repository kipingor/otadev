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
        return [
            'project_id'      => Project::withoutTenantScope()->inRandomOrder()->first()?->id
                ?? Project::factory(),
            'milestone_id'    => $this->faker->boolean(60)
                ? (Milestone::withoutTenantScope()->inRandomOrder()->first()?->id ?? null)
                : null,
            'parent_id'       => null,
            'wbs_code'        => null,
            'sort_order'      => $this->faker->numberBetween(0, 20),
            'title'           => $this->faker->sentence(4),
            'description'     => $this->faker->optional()->paragraph(),
            'assigned_to'     => User::inRandomOrder()->first()?->id ?? null,
            'priority'        => $this->faker->randomElement(['low', 'medium', 'medium', 'high']),
            'status'          => $this->faker->randomElement(['todo', 'in_progress', 'review']),
            'startAt'         => $this->faker->optional()->date(),
            'endAt'           => null,
            'completed_at'    => null,
            'due_date'        => $this->faker->optional()->dateTimeBetween('now', '+3 months'),
            'estimated_hours' => $this->faker->numberBetween(2, 40),
            'spent_hours'     => $this->faker->numberBetween(0, 20),
            'group'           => $this->faker->randomElement(['frontend', 'backend', 'design', 'qa', 'management']),
            'metadata'        => null,
        ];
    }

    public function pending(): static
    {
        return $this->state(['status' => 'todo', 'spent_hours' => 0, 'completed_at' => null]);
    }

    public function inProgress(): static
    {
        return $this->state([
            'status'       => $this->faker->randomElement(['in_progress', 'review']),
            'completed_at' => null,
        ]);
    }

    public function done(): static
    {
        return $this->state([
            'status'       => 'done',
            'completed_at' => $this->faker->dateTimeBetween('-3 months', 'now'),
            'spent_hours'  => $this->faker->numberBetween(1, 40),
        ]);
    }

    public function overdue(): static
    {
        return $this->state([
            'status'       => $this->faker->randomElement(['todo', 'in_progress']),
            'due_date'     => $this->faker->dateTimeBetween('-2 months', '-1 day'),
            'completed_at' => null,
        ]);
    }
}
