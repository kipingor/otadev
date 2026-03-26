<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
        ]);

        \App\Models\User::factory()->create([
            'name' => 'Project Manager',
            'email' => 'pm@example.com',
            'password' => bcrypt('password'),
        ]);

        \App\Models\User::factory()->create([
            'name' => 'Developer User',
            'email' => 'dev@example.com',
            'password' => bcrypt('password'),
        ]);
        
        \App\Models\User::factory()->create([
            'name' => 'Client User',
            'email' => 'client@example.com',
            'password' => bcrypt('password'),
        ]);

    }
}
