<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $user = User::firstOrCreate(
            ['email' => 'kipingor@gmail.com'],
            [
                'name' => 'Antony Kipingor',
                'password' => Hash::make('deadenman80'),
                'email_verified_at' => now(),
            ]
        );

        // Ensure admin role exists and assign it to the seeded user
        $adminRole = \App\Models\Role::firstOrCreate(['name' => 'admin']);
        $user->roles()->syncWithoutDetaching([$adminRole->id]);

        \App\Models\User::factory(10)->create();
        \App\Models\Lead::factory(20)->create();
        \App\Models\Opportunity::factory(10)->create();
        \App\Models\Project::factory(5)->create();
    }
}
