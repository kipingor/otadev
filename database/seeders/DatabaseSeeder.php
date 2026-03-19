<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Lead;
use App\Models\PipelineStage;
use App\Models\Task;
use App\Models\Project;
use App\Models\ProjectTeamMember;
use App\Models\Opportunity;
use App\Models\Milestone;
use App\Models\TimeLog;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Expense;
use App\Models\Supplier;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Admin user ──────────────────────────────────────────────────────
        $adminUser = User::firstOrCreate(
            ['email' => 'kipingor@gmail.com'],
            [
                'name'               => 'Antony Kipingor',
                'password'           => Hash::make('deadenman80'),
                'email_verified_at'  => now(),
            ]
        );

        // ── Permissions & roles ────────────────────────────────────────────────
        $permissions = [
            'view leads',    'create leads',    'edit leads',    'delete leads',    'move leads',
            'view opportunities', 'create opportunities', 'edit opportunities', 'delete opportunities',
            'view projects', 'create projects', 'edit projects', 'delete projects',
            'view pipelines','create pipelines','edit pipelines','delete pipelines',
            'manage users',  'view reports',
        ];
        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm]);
        }
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $adminRole->syncPermissions(Permission::all());
        $adminUser->assignRole($adminRole);

        // ── 2. Supporting users ────────────────────────────────────────────────
        $users    = User::factory(10)->create();
        $allUsers = $users->push($adminUser); // include admin in pool

        // ── 3. Pipeline stages ─────────────────────────────────────────────────
        $defaultStages = [
            ['key' => 'intake',      'name' => 'Intake',      'order' => 0, 'color' => '#3b82f6'],
            ['key' => 'discovery',   'name' => 'Discovery',   'order' => 1, 'color' => '#06b6d4'],
            ['key' => 'proposal',    'name' => 'Proposal',    'order' => 2, 'color' => '#8b5cf6'],
            ['key' => 'negotiation', 'name' => 'Negotiation', 'order' => 3, 'color' => '#f59e0b'],
            ['key' => 'closed_won',  'name' => 'Closed Won',  'order' => 4, 'color' => '#059669'],
            ['key' => 'closed_lost', 'name' => 'Closed Lost', 'order' => 5, 'color' => '#ef4444'],
        ];
        $pipelineStages = collect($defaultStages)->map(
            fn ($s) =>
            PipelineStage::firstOrCreate(['key' => $s['key']], $s)
        );

        // ── Helpers ────────────────────────────────────────────────────────────
        $yearStart  = Carbon::create(now()->year, 1, 1);
        $now        = now();
        $randomDate = fn () => Carbon::parse(fake()->dateTimeBetween($yearStart, $now));

        // ── 4. Leads → Opportunities ───────────────────────────────────────────
        Lead::factory(20)->make()->each(function ($lead) use ($allUsers, $pipelineStages, $randomDate) {
            $lead->created_by        = $allUsers->random()->id;
            $lead->owner_id          = $allUsers->random()->id;
            $lead->pipeline_stage_id = $pipelineStages->random()->id;
            $lead->created_at        = $randomDate();
            $lead->updated_at        = $lead->created_at;
            $lead->save();

            // 40 % become opportunities
            if (rand(1, 100) <= 40) {
                Opportunity::factory()->create([
                    'lead_id'    => $lead->id,
                    'owner_id'   => $lead->owner_id,
                    'created_at' => $randomDate(),
                ]);
            }
        });

        // ── 5. Projects ────────────────────────────────────────────────────────
        Opportunity::all()->each(function (Opportunity $opp) use ($randomDate, $allUsers) {

            // Decide project lifecycle state FIRST so tasks are seeded consistently:
            //   20 % completed  → all tasks done
            //   10 % on_hold    → tasks mostly todo / in_progress, none done
            //   10 % cancelled  → no tasks created
            //   60 % active     → mixed in_progress / review / todo tasks
            $roll      = rand(1, 100);
            $lifecycle = match (true) {
                $roll <= 20  => 'completed',
                $roll <= 30  => 'on_hold',
                $roll <= 40  => 'cancelled',
                default      => 'active',
            };

            // Create project with matching factory state
            $projectFactory = match ($lifecycle) {
                'completed' => Project::factory()->completed(),
                'on_hold'   => Project::factory()->onHold(),
                'cancelled' => Project::factory()->cancelled(),
                default     => Project::factory(),
            };

            $project = $projectFactory->create([
                'opportunity_id' => $opp->id,
                'client_id'      => $opp->lead?->owner_id ?? $allUsers->random()->id,
                'owner_id'       => $opp->owner_id,
                'created_at'     => $randomDate(),
            ]);

            // ── No tasks for cancelled projects ───────────────────────────────
            if ($lifecycle === 'cancelled') {
                return;
            }

            // ── Milestones ────────────────────────────────────────────────────
            $milestoneCount = rand(2, 5);
            $milestones = Milestone::factory($milestoneCount)->create([
                'project_id' => $project->id,
                'created_at' => $randomDate(),
                'status'     => $lifecycle === 'completed' ? 'achieved' : 'pending',
            ]);

            // ── Tasks — status must match project lifecycle ───────────────────
            $taskCount = rand(6, 14);

            $tasks = Task::factory($taskCount)
                ->when($lifecycle === 'completed', fn ($f) => $f->done())
                ->when($lifecycle === 'on_hold', fn ($f) => $f->pending())
                ->when($lifecycle === 'active', fn ($f) => $f->inProgress())
                ->create([
                    'project_id' => $project->id,
                    'created_at' => $randomDate(),
                ]);

            // For completed projects, ensure ALL tasks have status='done'
            if ($lifecycle === 'completed') {
                $tasks->each(fn ($t) => $t->status !== 'done' && $t->update(['status' => 'done', 'completed_at' => $randomDate()]));
            }

            // Assign WBS codes to top-level tasks (1.0, 2.0, …)
            $tasks->values()->each(function ($task, $index) {
                $task->update(['wbs_code' => ($index + 1) . '.0', 'sort_order' => $index]);
            });

            // Assign tasks to milestones + create time logs
            $tasks->each(function ($task) use ($milestones, $randomDate) {
                if (rand(0, 1)) {
                    $task->update(['milestone_id' => $milestones->random()->id]);
                }
                TimeLog::factory(rand(1, 4))->create([
                    'task_id'   => $task->id,
                    'logged_at' => $randomDate(),
                ]);
            });

            // ── Team members ──────────────────────────────────────────────────
            $teamSize        = rand(2, 5);
            $assignedUserIds = collect([$project->owner_id]);

            $allUsers->shuffle()->take($teamSize + 2)->each(function ($u) use ($project, &$assignedUserIds, $teamSize) {
                if ($assignedUserIds->count() > $teamSize) {
                    return;
                }
                if ($assignedUserIds->contains($u->id)) {
                    return;
                }
                ProjectTeamMember::create([
                    'project_id'            => $project->id,
                    'user_id'               => $u->id,
                    'role'                  => fake()->randomElement(['developer', 'designer', 'analyst', 'tester', 'manager']),
                    'allocation_percentage' => fake()->randomElement([25, 50, 75, 100]),
                    'joined_at'             => now()->subDays(rand(10, 90)),
                ]);
                $assignedUserIds->push($u->id);
            });

            // ── Invoices & Payments ───────────────────────────────────────────
            // BUG FIX: The original seeder manually called json_encode() on the
            // invoice->lines array BEFORE calling save(). Because the Invoice model
            // has a 'lines' => 'array' cast, Eloquent also encodes it on save —
            // resulting in double-encoded JSON stored in the DB. When retrieved,
            // the cast decodes only the outer layer and returns a raw JSON string
            // instead of an array, causing Array.isArray() to return false in the
            // frontend and the line items table to render empty.
            //
            // Fix: remove the manual json_encode block and call save() directly.
            // Eloquent's 'array' cast handles the encoding automatically.
            $invoiceCount = $lifecycle === 'completed' ? rand(2, 4) : rand(1, 2);
            $invoices = Invoice::factory($invoiceCount)->make([
                'project_id' => $project->id,
                'client_id'  => $project->client_id,
                'created_at' => $randomDate(),
                'due_date'   => $randomDate()->addDays(rand(7, 45)),
            ])->each(function ($invoice) {
                // FIX: Do NOT manually json_encode here — the 'array' cast does it.
                $invoice->save();
            });

            // For completed projects most invoices should be paid
            $invoices->each(function ($invoice) use ($randomDate, $lifecycle) {
                $paymentCount = $lifecycle === 'completed' ? rand(1, 2) : rand(0, 1);
                Payment::factory($paymentCount)->create([
                    'invoice_id' => $invoice->id,
                    'paid_at'    => $randomDate(),
                ]);
            });

            // ── Expenses ──────────────────────────────────────────────────────
            // Same fix applies: Expense model has 'lines' => 'array' cast.
            Expense::factory(rand(2, 6))->make([
                'project_id'  => $project->id,
                'incurred_at' => $randomDate(),
            ])->each(function ($expense) {
                // FIX: Do NOT manually json_encode — the cast handles it.
                $expense->save();
            });
        });

        // ── 6. Standalone suppliers ────────────────────────────────────────────
        // Supplier model does NOT use Eloquent array casts for these fields,
        // so manual json_encode is correct here — leave it unchanged.
        Supplier::factory(8)->make()->each(function ($supplier) {
            foreach (['contact_info', 'products', 'metadata'] as $field) {
                if (isset($supplier->$field) && is_array($supplier->$field)) {
                    $supplier->$field = json_encode($supplier->$field);
                }
            }
            $supplier->save();
        });
    }
}
