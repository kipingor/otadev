<?php

namespace Database\Factories;

use App\Models\Payment;
use App\Models\Invoice;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition(): array
    {
        // withoutTenantScope so reads work during seeding
        $invoice = Invoice::withoutTenantScope()->inRandomOrder()->first()
            ?? Invoice::factory()->create();

        $max       = $invoice->total ?? 1000;
        $min       = max(1, $max * 0.2);
        $projectId = $invoice->project_id
            ?? Project::withoutTenantScope()->inRandomOrder()->first()?->id;
        $receivedBy = User::inRandomOrder()->first()?->id;
        $issueAt   = $invoice->issue_date ?? $invoice->created_at ?? now()->subDays(14);
        $paidAt    = $this->faker->dateTimeBetween($issueAt, 'now');

        return [
            'invoice_id'  => $invoice->id,
            'project_id'  => $projectId,
            'amount'      => $this->faker->randomFloat(2, $min, $max),
            'currency'    => $invoice->currency ?? 'USD',
            'method'      => $this->faker->randomElement(['bank', 'mpesa', 'cash', 'cheque', 'card']),
            'reference'   => Str::upper('TX-' . Str::random(10)),
            'notes'       => $this->faker->optional()->sentence(),
            'paid_at'     => $paidAt,
            'received_by' => $receivedBy,
            'created_at'  => $paidAt,
            'updated_at'  => $paidAt,
        ];
    }
}
