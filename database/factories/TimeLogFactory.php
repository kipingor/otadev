<?php

namespace Database\Factories;

use App\Models\TimeLog;
use App\Models\User;
use App\Models\Task;
use Illuminate\Database\Eloquent\Factories\Factory;

class TimeLogFactory extends Factory
{
    protected $model = TimeLog::class;

    public function definition(): array
    {
        return [
            'task_id' => Task::factory(),            // auto-create task if not provided
            'user_id' => User::factory(),            // auto-create user if not provided
            'hours' => $this->faker->randomFloat(2, 0.5, 8),  // 0.5 to 8 hours
            'notes' => $this->faker->optional()->sentence(),
            'logged_at' => $this->faker->dateTimeBetween('-30 days', 'now'),
        ];
    }
}
