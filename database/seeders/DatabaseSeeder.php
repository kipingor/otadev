<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Lead;
use App\Models\Task;
use App\Models\Project;
use App\Models\Opportunity;
use App\Models\Milestone;
use App\Models\TimeLog;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create admin user
        $user = User::firstOrCreate(
            ['email' => 'kipingor@gmail.com'],
            [
                'name' => 'Antony Kipingor',
                'password' => Hash::make('deadenman80'),
                'email_verified_at' => now(),
            ]
        );

        // Create admin role via Spatie
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $adminPermissions = Permission::all();
        $adminRole->syncPermissions($adminPermissions);

        // Assign role the Spatie way
        $user->assignRole($adminRole);

        // Factory data
        User::factory(10)->create();
        Lead::factory(20)->create();
        Opportunity::factory(10)->create();

        // Create projects WITH milestones, tasks & time logs
        Project::factory(5)->create()->each(function ($project) {

            // Milestones
            $milestones = Milestone::factory(rand(3, 6))->create([
                'project_id' => $project->id,
            ]);

            // Tasks
            $tasks = Task::factory(rand(8, 15))->create([
                'project_id' => $project->id,
            ]);

            $tasks->each(function ($task) use ($milestones) {
                // Randomly attach tasks to milestones
                if (rand(0, 1) === 1 && $milestones->count()) {
                    $task->update(['milestone_id' => $milestones->random()->id]);
                }

                // Create time logs
                TimeLog::factory(rand(1, 5))->create([
                    'task_id' => $task->id,
                ]);
            });
        });
    }
}