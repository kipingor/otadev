<?php

namespace Database\Factories;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AuditLogFactory extends Factory
{
    protected $model = AuditLog::class;

    public function definition()
    {
        return [
            'auditable_type' => 'App\\Models\\Lead',
            'auditable_id' => 1,
            'user_id' => User::factory(),
            'event' => 'updated',
            'old_values' => [],
            'new_values' => [],
            'ip_address' => $this->faker->ipv4(),
            'user_agent' => $this->faker->userAgent(),
        ];
    }
}
