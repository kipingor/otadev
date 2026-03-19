<?php

namespace Database\Factories;

use App\Models\Invoice;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use Carbon\Carbon;

class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;

    public function definition(): array
    {
        $issueDate = $this->faker->dateTimeBetween('-2 months', 'now');
        $dueDate = (clone $issueDate)->modify('+' . rand(7, 30) . ' days');

        // List of statuses as per the migration: ['draft', 'issued', 'paid', 'overdue', 'cancelled']
        $statuses = ['draft', 'issued', 'paid', 'overdue', 'cancelled'];

        // Pick client and project if available
        $project = Project::inRandomOrder()->first();
        $clientId = $project?->client_id ?? User::inRandomOrder()->first()->id;

        // Generate plausible line items
        $lineCount = rand(1, 4);
        $lines = [];
        $subtotal = 0;
        for ($i = 0; $i < $lineCount; $i++) {
            $quantity = rand(1, 10);
            $unitPrice = $this->faker->randomFloat(2, 100, 2000);
            $lineTotal = $quantity * $unitPrice;
            $lines[] = [
                'description' => $this->faker->words(3, true),
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'total' => $lineTotal,
            ];
            $subtotal += $lineTotal;
        }

        $tax = round($subtotal * (rand(5, 15) / 100), 2);
        $total = round($subtotal + $tax, 2);

        return [
            'project_id' => $project?->id,
            'client_id' => $clientId,
            'number' => Str::upper('INV-' . Str::random(8)),
            'issue_date' => $issueDate,
            'due_date' => $dueDate,
            'subtotal' => round($subtotal, 2),
            'tax' => $tax,
            'total' => $total,
            'currency' => 'USD',
            'sent_at' => $issueDate,
            'status' => $this->faker->randomElement($statuses),
            'lines' => $lines,
            'notes' => $this->faker->sentence(),
            // No 'amount', 'paid_at', or 'metadata' in table schema
        ];
    }

    /**
     * Mark invoice as fully paid
     */
    public function paid(): Factory
    {
        return $this->state(function (array $attributes) {
            $issueDate = $attributes['issue_date'] ?? now();
            $paidAt = Carbon::parse($issueDate)->addDays(rand(1, 30));

            return [
                'status' => 'paid',
                // No 'paid_at' column in table; only timestamps and status
            ];
        });
    }

    /**
     * Mark as overdue (unpaid past due)
     */
    public function overdue(): Factory
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => 'overdue',
            ];
        });
    }

    /**
     * Mark as draft
     */
    public function draft(): Factory
    {
        return $this->state(fn() => ['status' => 'draft']);
    }

    /**
     * Mark as cancelled
     */
    public function cancelled(): Factory
    {
        return $this->state(fn() => ['status' => 'cancelled']);
    }
}
