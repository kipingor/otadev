<?php

namespace Database\Factories;

use App\Models\Tag;
use Illuminate\Database\Eloquent\Factories\Factory;

class TagFactory extends Factory
{
    protected $model = Tag::class;

    public function definition(): array
    {
        return [
            // tenant_id is set by HasTenantScope creating event when a tenant
            // is bound in the container, or explicitly in DemoDataSeeder.
            'name'  => $this->faker->unique()->word(),
            'color' => $this->faker->hexColor(),
        ];
    }
}
