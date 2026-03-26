<?php

namespace Database\Factories;

use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class SupplierFactory extends Factory
{
    protected $model = Supplier::class;

    public function definition(): array
    {
        $createdAt = fake()->dateTimeBetween('-6 months', 'now');

        return [
            // tenant_id set explicitly in DemoDataSeeder
            'name' => fake()->company(),

            'contact_info' => [
                'email'   => fake()->companyEmail(),
                'phone'   => fake()->e164PhoneNumber(),
                'address' => fake()->address(),
            ],

            'products' => fake()->randomElements([
                'Concrete', 'Steel', 'HVAC Equipment', 'Electrical Supplies',
                'Plumbing Materials', 'Security Services', 'Consulting',
                'General Contracting', 'IT Equipment', 'Landscaping Services',
            ], fake()->numberBetween(1, 4)),

            'rating' => fake()->optional()->randomFloat(2, 2, 5),

            'metadata' => [
                'account_number' => strtoupper(Str::random(12)),
                'contact_person' => fake()->name(),
                'notes'          => fake()->sentence(),
            ],

            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ];
    }
}
