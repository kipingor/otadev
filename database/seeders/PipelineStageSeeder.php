<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PipelineStageSeeder extends Seeder
{
    public function run(): void
    {
        foreach (\App\Enums\PipelineStage::cases() as $stage) {
            \App\Models\PipelineStage::firstOrCreate([
                'key' => $stage->value,
            ], [
                'name' => ucfirst(strtolower($stage->value)),
                'order' => $stage['order'],
            ]);
        }
    }
}
