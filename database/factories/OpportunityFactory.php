<?php
// ─────────────────────────────────────────────────────────────────────────────
// FILE: database/factories/OpportunityFactory.php
// ─────────────────────────────────────────────────────────────────────────────
namespace Database\Factories;

use App\Models\Opportunity;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class OpportunityFactory extends Factory
{
    protected $model = Opportunity::class;

    public function definition(): array
    {
        $stage = $this->faker->randomElement([
            'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost',
        ]);

        return [
            // Lead read uses withoutTenantScope so it works during seeding
            'lead_id'             => Lead::withoutTenantScope()->inRandomOrder()->first()?->id
                ?? Lead::factory(),
            'title'               => $this->faker->sentence(3),
            'summary'             => $this->faker->paragraph(),
            'estimated_value'     => $this->faker->randomFloat(2, 5000, 200000),
            'currency'            => $this->faker->randomElement(['USD', 'EUR', 'GBP', 'KES']),
            'stage'               => $stage,
            'owner_id'            => User::inRandomOrder()->first()?->id ?? User::factory(),
            'expected_close_date' => $this->faker->dateTimeBetween('+1 week', '+6 months'),
            'ai_suggestions'      => $this->faker->boolean(30)
                ? ['suppliers' => [$this->faker->company(), $this->faker->company()], 'notes' => $this->faker->sentence()]
                : null,
        ];
    }
}
