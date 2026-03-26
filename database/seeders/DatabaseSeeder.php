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

/**
 * DatabaseSeeder
 *
 * MULTITENANCY NOTE:
 * All primary models (Lead, Project, Invoice, etc.) now use HasTenantScope,
 * which adds a global WHERE tenant_id = ? to every query. During seeding
 * there is no tenant bound in the service container, so:
 *
 *   a) Reads (e.g. Opportunity::all()) would return 0 rows because the scope
 *      applies and no tenant is in context.
 *   b) Creates would work but tenant_id would be NULL, making those rows
 *      invisible to all tenant queries once the app is running.
 *
 * Fix: call withoutTenantScope() on every query that reads scoped models,
 * and set tenant_id explicitly on creates. For models without a
 * withoutTenantScope() method (i.e. not using the trait), no change needed.
 *
 * This seeder creates the super-admin user, roles, and supporting data.
 * Tenant-specific demo data should go in DemoDataSeeder and be called
 * in the context of a specific tenant.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Super-admin user ───────────────────────────────────────────────
        $superAdminUser = User::firstOrCreate(
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

        $superAdminRole = Role::firstOrCreate(['name' => 'super-admin']);
        $superAdminRole->syncPermissions(Permission::all());
        $superAdminUser->assignRole($superAdminRole);

        // ── 2. Call DemoDataSeeder if you want demo content ───────────────────
        // Demo data must be seeded inside a tenant context.
        // Uncomment the line below AFTER creating a tenant via onboarding,
        // then run: php artisan db:seed --class=DemoDataSeeder
        // $this->call(DemoDataSeeder::class);
    }
}
