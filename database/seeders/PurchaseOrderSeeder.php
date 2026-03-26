<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PurchaseOrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\PurchaseOrder::factory()->count(20)->create()->each(function ($purchaseOrder) {
             if ($this->command->confirm("Do you want to add a delivery for purchase order {$purchaseOrder->number}?", true)) {
                $purchaseOrder->deliveries()->create([
                    'number' => 'DEL-' . strtoupper(uniqid()),
                    'status' => 'pending',
                    'delivery_date' => now()->addDays(rand(1, 14)),
                    'notes' => 'Delivery for purchase order ' . $purchaseOrder->number,
                ]);
            }
             $purchaseOrder->save();
         });
    }
}
