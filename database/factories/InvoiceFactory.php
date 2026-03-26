<?php
// ─────────────────────────────────────────────────────────────────────────────
// FILE: database/factories/InvoiceFactory.php
// ─────────────────────────────────────────────────────────────────────────────
namespace Database\Factories;

use App\Models\Invoice;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;

    public function definition(): array
    {
        $issueDate = $this->faker->dateTimeBetween('-3 months', 'now');
        $dueDate   = (clone $issueDate)->modify('+' . rand(7, 45) . ' days');

        // withoutTenantScope: reads work correctly during seeding
        $project  = Project::withoutTenantScope()->inRandomOrder()->first();
        $clientId = $project?->client_id
            ?? User::inRandomOrder()->first()?->id
            ?? 1;

        $lineCount = rand(1, 5);
        $lines     = [];
        $subtotal  = 0;

        for ($i = 0; $i < $lineCount; $i++) {
            $quantity  = rand(1, 10);
            $unitPrice = $this->faker->randomFloat(2, 50, 3000);
            $lineAmt   = round($quantity * $unitPrice, 2);
            $lines[]   = [
                'description' => ucfirst($this->faker->words(rand(2, 4), true)),
                'quantity'    => $quantity,
                'unit_price'  => $unitPrice,
                'amount'      => $lineAmt,
            ];
            $subtotal += $lineAmt;
        }

        $taxRate = rand(0, 16);
        $tax     = round($subtotal * $taxRate / 100, 2);
        $total   = round($subtotal + $tax, 2);

        return [
            'project_id' => $project?->id,
            'client_id'  => $clientId,
            'issue_date' => $issueDate,
            'due_date'   => $dueDate,
            'subtotal'   => round($subtotal, 2),
            'tax'        => $tax,
            'total'      => $total,
            'currency'   => 'USD',
            'status'     => $this->faker->randomElement(['draft', 'issued', 'paid', 'overdue', 'cancelled']),
            'lines'      => $lines,
        ];
    }
}
