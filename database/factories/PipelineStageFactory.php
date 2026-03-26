<?php

namespace Database\Factories;

use App\Models\PipelineStage;
use Illuminate\Database\Eloquent\Factories\Factory;

class PipelineStageFactory extends Factory
{
    protected $model = PipelineStage::class;

    public function definition(): array
    {
        $stageKeys = [
            ['key' => 'new',           'name' => 'New',           'order' => 0],
            ['key' => 'contacted',     'name' => 'Contacted',     'order' => 1],
            ['key' => 'qualified',     'name' => 'Qualified',     'order' => 2],
            ['key' => 'opportunity',   'name' => 'Opportunity',   'order' => 3],
            ['key' => 'proposal_sent', 'name' => 'Proposal Sent', 'order' => 4],
            ['key' => 'won',           'name' => 'Won',           'order' => 5],
            ['key' => 'lost',          'name' => 'Lost',          'order' => 6],
        ];

        $stage = $this->faker->randomElement($stageKeys);

        return [
            // tenant_id is not included here — set it explicitly in DemoDataSeeder
            // or rely on HasTenantScope::bootHasTenantScope() creating event when
            // a tenant is bound in app('current_tenant').
            'key'   => $stage['key'],
            'name'  => $stage['name'],
            'order' => $stage['order'],
            'color' => $this->faker->hexColor(),
        ];
    }
}
