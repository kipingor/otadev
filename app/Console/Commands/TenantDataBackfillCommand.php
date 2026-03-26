<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * TenantDataBackfillCommand
 *
 * Run ONCE after running the multitenancy migrations on an existing
 * single-tenant database to assign all orphaned rows to the default tenant.
 *
 * Usage:
 *   php artisan tenant:backfill --tenant=<tenant-id>
 *
 * If --tenant is omitted, the command picks the first/only tenant in the DB.
 *
 * IMPORTANT: Run this in a transaction-safe environment. Back up your DB first.
 */
class TenantDataBackfillCommand extends Command
{
    protected $signature = 'tenant:backfill {--tenant= : The tenant ID to assign rows to}';
    protected $description = 'Backfill tenant_id on existing rows for the first-time multitenancy migration';

    /** Tables that need backfilling (must have tenant_id column). */
    private array $tables = [
        'leads',
        'opportunities',
        'pipeline_stages',
        'projects',
        'tasks',
        'milestones',
        'invoices',
        'payments',
        'expenses',
        'activities',
        'contacts',
        'suppliers',
        'purchase_orders',
        'deliveries',
        'tenders',
        'proposals',
        'time_logs',
    ];

    public function handle(): int
    {
        $tenantId = $this->option('tenant');

        if (!$tenantId) {
            $tenant = Tenant::first();
            if (!$tenant) {
                $this->error('No tenants found. Run onboarding first or pass --tenant=<id>.');
                return self::FAILURE;
            }
            $tenantId = $tenant->id;
        } else {
            $tenant = Tenant::find($tenantId);
            if (!$tenant) {
                $this->error("Tenant '{$tenantId}' not found.");
                return self::FAILURE;
            }
        }

        $this->info("Backfilling tenant_id = '{$tenantId}' ({$tenant->name})");
        $this->info("Tables to update: " . implode(', ', $this->tables));

        if (!$this->confirm('This will UPDATE all rows with NULL tenant_id. Continue?')) {
            $this->info('Cancelled.');
            return self::SUCCESS;
        }

        $totalUpdated = 0;

        foreach ($this->tables as $table) {
            if (!Schema::hasTable($table)) {
                $this->warn("  Skipping '{$table}' — table does not exist.");
                continue;
            }
            if (!Schema::hasColumn($table, 'tenant_id')) {
                $this->warn("  Skipping '{$table}' — no tenant_id column (migration may not have run).");
                continue;
            }

            $count = DB::table($table)
                ->whereNull('tenant_id')
                ->update(['tenant_id' => $tenantId]);

            $totalUpdated += $count;
            $this->line("  {$table}: {$count} rows updated");
        }

        $this->newLine();
        $this->info("✅ Done! {$totalUpdated} total rows assigned to tenant '{$tenant->name}'.");
        $this->warn('Run php artisan config:clear and php artisan cache:clear afterwards.');

        return self::SUCCESS;
    }
}