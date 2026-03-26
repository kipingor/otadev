<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Tenant;
use App\Models\TenantUser;
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
use Carbon\Carbon;

/**
 * DemoDataSeeder
 *
 * Seeds realistic demo data for a specific tenant workspace.
 *
 * USAGE:
 *   php artisan db:seed --class=DemoDataSeeder
 *   DEMO_TENANT_ID=your-uuid php artisan db:seed --class=DemoDataSeeder
 *
 * ── CRITICAL FIX ─────────────────────────────────────────────────────────────
 *
 * The previous version bound the tenant into the service container BEFORE
 * creating users with User::factory(5)->create(). Because HasTenantScope
 * registers a 'creating' event that fires on ANY model created while a tenant
 * is in the container, this caused the ORM to try injecting 'tenant_id' into
 * the users table — which has no tenant_id column (only current_tenant_id).
 *
 * Result: SQLSTATE[42S22]: Column not found: 1054 Unknown column 'tenant_id'
 *
 * Fix: User::factory() calls must happen BEFORE app()->instance('current_tenant').
 * Users are global — they belong to no single tenant. TenantUser is the pivot
 * that links them to a workspace.
 */
class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        // ── Resolve the target tenant ──────────────────────────────────────────
        $tenantId = env('DEMO_TENANT_ID') ?? Tenant::first()?->id;

        if (!$tenantId) {
            $this->command->error('No tenant found. Complete onboarding first, then run this seeder.');
            return;
        }

        $tenant = Tenant::find($tenantId);
        if (!$tenant) {
            $this->command->error("Tenant '{$tenantId}' not found.");
            return;
        }

        $this->command->info("Seeding demo data for: {$tenant->name} ({$tenant->id})");

        // ── FIX: Create users BEFORE binding the tenant ───────────────────────
        // User does not use HasTenantScope, but binding the tenant first causes
        // the creating event to fire and try to set tenant_id on the users table.
        $users = User::factory(5)->create();

        // ── NOW bind tenant for all subsequent creates ────────────────────────
        app()->instance('current_tenant', $tenant);

        // Link users to tenant
        foreach ($users as $user) {
            TenantUser::firstOrCreate(
                ['tenant_id' => $tenant->id, 'user_id' => $user->id],
                ['role' => 'member', 'is_active' => true, 'joined_at' => now()]
            );
        }

        // Include the tenant owner
        $ownerMembership = TenantUser::where('tenant_id', $tenant->id)
            ->where('role', 'owner')
            ->with('user')
            ->first();
        $allUsers = $ownerMembership
            ? $users->push($ownerMembership->user)
            : $users;

        // ── Pipeline stages ────────────────────────────────────────────────────
        $defaultStages = [
            ['key' => 'intake',      'name' => 'Intake',      'order' => 0, 'color' => '#3b82f6', 'tenant_id' => $tenant->id],
            ['key' => 'discovery',   'name' => 'Discovery',   'order' => 1, 'color' => '#06b6d4', 'tenant_id' => $tenant->id],
            ['key' => 'proposal',    'name' => 'Proposal',    'order' => 2, 'color' => '#8b5cf6', 'tenant_id' => $tenant->id],
            ['key' => 'negotiation', 'name' => 'Negotiation', 'order' => 3, 'color' => '#f59e0b', 'tenant_id' => $tenant->id],
            ['key' => 'closed_won',  'name' => 'Closed Won',  'order' => 4, 'color' => '#059669', 'tenant_id' => $tenant->id],
            ['key' => 'closed_lost', 'name' => 'Closed Lost', 'order' => 5, 'color' => '#ef4444', 'tenant_id' => $tenant->id],
        ];

        $pipelineStages = collect($defaultStages)->map(fn ($s) =>
            PipelineStage::withoutTenantScope()->firstOrCreate(
                ['key' => $s['key'], 'tenant_id' => $tenant->id],
                $s
            )
        );

        $yearStart  = Carbon::create(now()->year, 1, 1);
        $randomDate = fn () => Carbon::parse(fake()->dateTimeBetween($yearStart, now()));

        // ── Leads → Opportunities ──────────────────────────────────────────────
        Lead::factory(20)->make()->each(function ($lead) use ($allUsers, $pipelineStages, $randomDate, $tenant) {
            $lead->tenant_id         = $tenant->id;
            $lead->created_by        = $allUsers->random()->id;
            $lead->owner_id          = $allUsers->random()->id;
            $lead->pipeline_stage_id = $pipelineStages->random()->id;
            $lead->created_at        = $randomDate();
            $lead->updated_at        = $lead->created_at;
            $lead->save();

            if (rand(1, 100) <= 40) {
                Opportunity::factory()->create([
                    'tenant_id'  => $tenant->id,
                    'lead_id'    => $lead->id,
                    'owner_id'   => $lead->owner_id,
                    'created_at' => $randomDate(),
                ]);
            }
        });

        // ── Projects ───────────────────────────────────────────────────────────
        Opportunity::withoutTenantScope()
            ->where('tenant_id', $tenant->id)
            ->each(function (Opportunity $opp) use ($randomDate, $allUsers, $tenant) {

                $roll      = rand(1, 100);
                $lifecycle = match (true) {
                    $roll <= 20 => 'completed',
                    $roll <= 30 => 'on_hold',
                    $roll <= 40 => 'cancelled',
                    default     => 'active',
                };

                $project = (match ($lifecycle) {
                    'completed' => Project::factory()->completed(),
                    'on_hold'   => Project::factory()->onHold(),
                    'cancelled' => Project::factory()->cancelled(),
                    default     => Project::factory(),
                })->create([
                    'tenant_id'      => $tenant->id,
                    'opportunity_id' => $opp->id,
                    'client_id'      => $opp->lead?->owner_id ?? $allUsers->random()->id,
                    'owner_id'       => $opp->owner_id,
                    'created_at'     => $randomDate(),
                ]);

                if ($lifecycle === 'cancelled') return;

                $milestones = Milestone::factory(rand(2, 5))->create([
                    'tenant_id'  => $tenant->id,
                    'project_id' => $project->id,
                    'created_at' => $randomDate(),
                    'status'     => $lifecycle === 'completed' ? 'achieved' : 'pending',
                ]);

                $tasks = Task::factory(rand(6, 14))
                    ->when($lifecycle === 'completed', fn ($f) => $f->done())
                    ->when($lifecycle === 'on_hold',   fn ($f) => $f->pending())
                    ->when($lifecycle === 'active',    fn ($f) => $f->inProgress())
                    ->create([
                        'tenant_id'  => $tenant->id,
                        'project_id' => $project->id,
                        'created_at' => $randomDate(),
                    ]);

                if ($lifecycle === 'completed') {
                    $tasks->each(fn ($t) => $t->status !== 'done' &&
                        $t->update(['status' => 'done', 'completed_at' => $randomDate()]));
                }

                $tasks->values()->each(function ($task, $i) {
                    $task->update(['wbs_code' => ($i + 1) . '.0', 'sort_order' => $i]);
                });

                $tasks->each(function ($task) use ($milestones, $randomDate, $tenant) {
                    if (rand(0, 1)) $task->update(['milestone_id' => $milestones->random()->id]);
                    TimeLog::factory(rand(1, 4))->create([
                        'tenant_id' => $tenant->id,
                        'task_id'   => $task->id,
                        'logged_at' => $randomDate(),
                    ]);
                });

                $teamSize        = rand(2, 5);
                $assignedUserIds = collect([$project->owner_id]);
                $allUsers->shuffle()->take($teamSize + 2)->each(function ($u) use ($project, &$assignedUserIds, $teamSize) {
                    if ($assignedUserIds->count() > $teamSize || $assignedUserIds->contains($u->id)) return;
                    ProjectTeamMember::create([
                        'project_id'            => $project->id,
                        'user_id'               => $u->id,
                        'role'                  => fake()->randomElement(['developer', 'designer', 'analyst', 'tester', 'manager']),
                        'allocation_percentage' => fake()->randomElement([25, 50, 75, 100]),
                        'joined_at'             => now()->subDays(rand(10, 90)),
                    ]);
                    $assignedUserIds->push($u->id);
                });

                $invoiceCount = $lifecycle === 'completed' ? rand(2, 4) : rand(1, 2);
                Invoice::factory($invoiceCount)->make([
                    'tenant_id'  => $tenant->id,
                    'project_id' => $project->id,
                    'client_id'  => $project->client_id,
                    'created_at' => $randomDate(),
                    'due_date'   => $randomDate()->addDays(rand(7, 45)),
                ])->each(function ($inv) use ($randomDate, $lifecycle, $tenant) {
                    $inv->save();
                    $paymentCount = $lifecycle === 'completed' ? rand(1, 2) : rand(0, 1);
                    Payment::factory($paymentCount)->create([
                        'tenant_id'  => $tenant->id,
                        'invoice_id' => $inv->id,
                        'paid_at'    => $randomDate(),
                    ]);
                });

                Expense::factory(rand(2, 6))->make([
                    'tenant_id'   => $tenant->id,
                    'project_id'  => $project->id,
                    'incurred_at' => $randomDate(),
                ])->each(fn ($e) => $e->save());
            });

        // ── Suppliers ──────────────────────────────────────────────────────────
        Supplier::factory(5)->make(['tenant_id' => $tenant->id])->each(function ($supplier) {
            foreach (['contact_info', 'products', 'metadata'] as $field) {
                if (isset($supplier->$field) && is_array($supplier->$field)) {
                    $supplier->$field = json_encode($supplier->$field);
                }
            }
            $supplier->save();
        });

        $this->command->info('✅ Demo data seeded!');
        $this->command->table(
            ['Model', 'Count'],
            [
                ['Leads',     Lead::withoutTenantScope()->where('tenant_id', $tenant->id)->count()],
                ['Projects',  Project::withoutTenantScope()->where('tenant_id', $tenant->id)->count()],
                ['Invoices',  Invoice::withoutTenantScope()->where('tenant_id', $tenant->id)->count()],
                ['Payments',  Payment::withoutTenantScope()->where('tenant_id', $tenant->id)->count()],
            ]
        );
    }
}