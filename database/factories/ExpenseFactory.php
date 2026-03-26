<?php

namespace Database\Factories;

use App\Models\Expense;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ExpenseFactory extends Factory
{
    protected $model = Expense::class;

    public function definition(): array
    {
        $project   = Project::withoutTenantScope()->inRandomOrder()->first();
        $enteredBy = User::inRandomOrder()->first();

        $vendors = [
            'Acme Supplies', 'Nairobi Printworks', 'FastFoods Ltd', 'SuperChemicals',
            'Global Equip', 'IT Genius', 'Universal Hardware', 'ProCleaners',
            'Mega Transport', 'Smart Office', null,
        ];

        $lines = $this->faker->randomElement([
            null,
            [
                ['label' => 'USB-C Adapter', 'quantity' => 2, 'unit_price' => 1450, 'total' => 2900],
                ['label' => 'HDMI Cable',    'quantity' => 1, 'unit_price' => 900,  'total' => 900],
            ],
            [
                ['label' => 'Consulting services', 'quantity' => 1, 'unit_price' => 15000, 'total' => 15000],
            ],
        ]);

        $incurredAt = $this->faker->dateTimeBetween('-3 months', 'now');

        return [
            'project_id'  => $project?->id,
            'entered_by'  => $enteredBy?->id,
            'vendor'      => $this->faker->randomElement($vendors),
            'description' => $this->faker->sentence(),
            'amount'      => $this->faker->randomFloat(2, 100, 50000),
            'currency'    => $this->faker->randomElement(['USD', 'KES', 'EUR']),
            'incurred_at' => $incurredAt,
            'receipt_path'=> null,
            'lines'       => $lines,
            'notes'       => $this->faker->optional()->sentence(),
            'category'    => $this->faker->randomElement([
                'supplies', 'travel', 'software', 'utilities', 'maintenance', 'other',
            ]),
        ];
    }
}
