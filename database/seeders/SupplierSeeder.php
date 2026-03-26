<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\Supplier::factory()->count(10)->create()->each(function ($supplier) {
            $supplier->contacts()->createMany(\App\Models\Contact::factory()->count(2)->make()->toArray());
             if ($this->command->confirm("Do you want to add a user account for supplier {$supplier->name}?", true)) {
                $user = \App\Models\User::factory()->create([
                    'name' => $supplier->name . ' User',
                    'email' => strtolower(str_replace(' ', '_', $supplier->name)) . '@example.com',
                    'password' => bcrypt('password'),
                ]);
                $supplier->user_id = $user->id;
            }
        });

         \App\Models\Supplier::factory()->create([
            'name' => 'Acme Corporation',
            'email' => 'acme@example.com',
            'password' => bcrypt('password'),
        ]);

    }
}
