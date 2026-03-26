<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\PurchaseOrder;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PurchaseOrder>
 */
class PurchaseOrderFactory extends Factory
{
    protected $model = PurchaseOrder::class;
    
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $lines = [];
        $numLines = $this->faker->numberBetween(1, 5);
        for ($i = 0; $i < $numLines; $i++) {
            $lines[] = [
                'description' => $this->faker->sentence(),
                'quantity' => $this->faker->numberBetween(1, 10),
                'unit_price' => $this->faker->randomFloat(2, 10, 100),
                'total' => $this->faker->randomFloat(2, 10, 1000),
            ];
        }

        
        return [
            'tenant_id' => 1,
            'number' => $this->faker->unique()->numerify('PO-#####'),
            'supplier_id' => 1,
            'project_id' => 1,
            'client_id' => 1,
            'created_by' => 1,
            'status' => $this->faker->randomElement(['draft', 'sent', 'approved', 'rejected', 'cancelled']),
            'order_date' => $this->faker->date(),
            'expected_delivery_date' => $this->faker->date(),
            'currency' => $this->faker->currencyCode(),
            'subtotal' => $this->faker->randomFloat(2, 100, 10000),
            'tax' => $this->faker->randomFloat(2, 10, 1000),
            'total' => $this->faker->randomFloat(2, 110, 11000),
            'lines' => [],
            'notes' => $this->faker->sentence(),
            'shipping_address' => $this->faker->address(),
        ];
    }
}
