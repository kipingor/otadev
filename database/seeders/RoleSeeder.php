<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            ['name' => 'Admin', 'description' => 'Full access to all features and settings. Can manage users, projects, and system configurations.'],
            ['name' => 'Project Manager', 'description' => 'Can create and manage projects, assign tasks, and oversee project progress.'],
            ['name' => 'Developer', 'description' => 'Can view and update tasks assigned to them, log time, and collaborate with team members.'],
            ['name' => 'Client', 'description' => 'Can view project status, milestones, and deliverables. Can provide feedback and communicate with the project team.'],
        ];

        foreach ($roles as $role) {
            Role::create($role);
        }
    }
}
