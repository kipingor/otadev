<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Lead;
use App\Models\PipelineStage;
use App\Models\Task;
use App\Models\Project;
use App\Models\Opportunity;
use App\Models\Milestone;
use App\Models\TimeLog;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Expense;
use App\Models\Supplier;
use App\Models\Vendor;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ---------------------------
        // 1. Create Admin User
        // ---------------------------
        $user = User::firstOrCreate(
            ['email' => 'kipingor@gmail.com'],
            [
                'name' => 'Antony Kipingor',
                'password' => Hash::make('deadenman80'),
                'email_verified_at' => now(),
            ]
        );

        // Create base permissions
        $permissions = [
            'view leads',
            'create leads',
            'edit leads',
            'delete leads',
            'move leads',
            'view opportunities',
            'create opportunities',
            'edit opportunities',
            'delete opportunities',
            'view projects',
            'create projects',
            'edit projects',
            'delete projects',
            'view pipelines',
            'create pipelines',
            'edit pipelines',
            'delete pipelines',
            'manage users',
            'view reports',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Roles
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $adminRole->syncPermissions(Permission::all());
        $user->assignRole($adminRole);

        // ---------------------------
        // 2. Create Supporting Users
        // ---------------------------
        $users = User::factory(10)->create();

        // ---------------------------
        // 3. Create Pipeline Stages
        // ---------------------------
        $defaultStages = [
            ['key' => 'intake', 'name' => 'Intake', 'order' => 0, 'color' => '#3b82f6'],
            ['key' => 'discovery', 'name' => 'Discovery', 'order' => 1, 'color' => '#06b6d4'],
            ['key' => 'proposal', 'name' => 'Proposal', 'order' => 2, 'color' => '#8b5cf6'],
            ['key' => 'negotiation', 'name' => 'Negotiation', 'order' => 3, 'color' => '#f59e0b'],
            ['key' => 'closed_won', 'name' => 'Closed Won', 'order' => 4, 'color' => '#059669'],
            ['key' => 'closed_lost', 'name' => 'Closed Lost', 'order' => 5, 'color' => '#ef4444'],
        ];
        $pipelineStages = collect($defaultStages)->map(function ($stage) {
            return PipelineStage::firstOrCreate(
                ['key' => $stage['key']],
                [
                    'name' => $stage['name'],
                    'order' => $stage['order'],
                    'color' => $stage['color'],
                ]
            );
        });

        // ---------------------------
        // DATE RANGE: Jan 1 → Today
        // ---------------------------
        $start = Carbon::create(now()->year, 1, 1);
        $end = now();

        // random date helper
        $randomDate = fn() => Carbon::parse(fake()->dateTimeBetween($start, $end));

        // ---------------------------
        // 4. Leads + Opportunities
        // ---------------------------
        $leads = Lead::factory(20)->make()->each(function ($lead) use ($users, $pipelineStages, $randomDate) {
            $lead->created_by = $users->random()->id;
            $lead->owner_id = $users->random()->id;
            $lead->pipeline_stage_id = $pipelineStages->random()->id;
            $lead->created_at = $randomDate();
            $lead->updated_at = $lead->created_at;
            $lead->save();

            // 30% chance to convert to opportunity
            if (rand(1, 100) <= 30) {
                Opportunity::factory()->create([
                    'lead_id' => $lead->id,
                    'owner_id' => $lead->owner_id,
                    'created_at' => $randomDate(),
                ]);
            }
        });

        // ---------------------------
        // 5. Projects (only for opportunities)
        // ---------------------------
        Opportunity::all()->each(function ($opportunity) use ($randomDate) {

            $project = Project::factory()->create([
                'opportunity_id' => $opportunity->id,
                'client_id' => $opportunity->lead->owner_id,
                'owner_id' => $opportunity->owner_id,
                'created_at' => $randomDate(),
            ]);

            // ---------------------------
            // Milestones
            // ---------------------------
            $milestones = Milestone::factory(rand(3, 6))->create([
                'project_id' => $project->id,
                'created_at' => $randomDate(),
            ]);

            // ---------------------------
            // Tasks
            // ---------------------------
            $tasks = Task::factory(rand(8, 15))->create([
                'project_id' => $project->id,
                'created_at' => $randomDate(),
            ]);

            // attach tasks to milestones, add time logs
            $tasks->each(function ($task) use ($milestones, $randomDate) {

                if (rand(0, 1) === 1) {
                    $task->update([
                        'milestone_id' => $milestones->random()->id
                    ]);
                }

                // Time Logs
                TimeLog::factory(rand(1, 5))->create([
                    'task_id' => $task->id,
                    'logged_at' => $randomDate(),
                ]);
            });

            // ---------------------------
            // 6. Finance — Invoices & Payments
            // ---------------------------
            $invoices = Invoice::factory(rand(1, 3))->make([
                'project_id' => $project->id,
                'client_id' => $project->client_id,
                'created_at' => $randomDate(),
                // Don't set 'amount' (not in schema/factory)
                // Let factory handle due_date, but allow override with plausible date
                'due_date' => $randomDate()->addDays(rand(7, 30)),
            ])->each(function ($invoice) {
                // Convert lines to JSON explicitly before saving
                if (is_array($invoice->lines)) {
                    $invoice->lines = json_encode($invoice->lines);
                }
                $invoice->save();
            });

            // Each invoice has 0–2 payments
            $invoices->each(function ($invoice) use ($randomDate, $project) {
                Payment::factory(rand(0, 2))->create([
                    'invoice_id' => $invoice->id,
                    'project_id' => $project->id,
                    'paid_at' => $randomDate(),
                ]);
            });

            // ---------------------------
            // 7. Expenses
            // ---------------------------
            // The error occurs because the 'lines' attribute in ExpenseFactory can be an array,
            // but the expenses table expects JSON (not PHP array). 
            // Solution: Convert array values for 'lines' to JSON before insert.
            Expense::factory(rand(2, 5))->make([
                'project_id' => $project->id,
                'incurred_at' => $randomDate(),
            ])->each(function ($expense) {
                if (is_array($expense->lines)) {
                    $expense->lines = json_encode($expense->lines);
                }
                $expense->save();
            });
        });

        // ---------------------------
        // 8. Suppliers & Vendors
        // ---------------------------

        // -- To fix: convert array fields to JSON before save --
        $suppliers = Supplier::factory(8)->make([
            'created_at' => $randomDate(),
        ])->each(function ($supplier) {
            // The following fields must be JSON strings for insert:
            foreach (['contact_info', 'products', 'metadata'] as $jsonField) {
                if (isset($supplier->$jsonField) && is_array($supplier->$jsonField)) {
                    $supplier->$jsonField = json_encode($supplier->$jsonField);
                }
            }
            $supplier->save();
        });

        $vendors = Vendor::factory(5)->make([
            'created_at' => $randomDate(),
        ])->each(function ($vendor) {
            // The following fields must be JSON strings for insert:
            foreach (['contact_info', 'metadata'] as $jsonField) {
                if (isset($vendor->$jsonField) && is_array($vendor->$jsonField)) {
                    $vendor->$jsonField = json_encode($vendor->$jsonField);
                }
            }
            $vendor->save();
        });
    }
}
