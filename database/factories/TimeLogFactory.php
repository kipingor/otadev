<?php
// ─────────────────────────────────────────────────────────────────────────────
// FILE: database/factories/TimeLogFactory.php
// ─────────────────────────────────────────────────────────────────────────────
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
            'task_id'   => Task::withoutTenantScope()->inRandomOrder()->first()?->id
                ?? Task::factory(),
            'user_id'   => User::inRandomOrder()->first()?->id ?? User::factory(),
            'hours'     => $this->faker->randomFloat(2, 0.5, 8),
            'notes'     => $this->faker->optional()->sentence(),
            'logged_at' => $this->faker->dateTimeBetween('-30 days', 'now'),
        ];
    }
}
