<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * MULTITENANCY — Scope all core tables to tenants (single-DB strategy)
 *
 * Adds a nullable `tenant_id` (string, matching tenants.id) column to every
 * table that holds tenant-scoped business data. Nullable allows existing data
 * to survive the migration; run the TenantDataBackfillCommand afterwards to
 * assign all existing rows to the default/seed tenant.
 *
 * The BelongsToTenant trait on each primary Model adds a global scope that
 * automatically injects `WHERE tenant_id = ?` on every query when tenancy
 * is initialized — no application code changes required.
 */
return new class extends Migration
{
    /**
     * Primary models — those that directly belongTo a tenant.
     * stancl's BelongsToTenant trait goes on these models.
     */
    private array $primaryTables = [
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

    public function up(): void
    {
        foreach ($this->primaryTables as $table) {
            if (!Schema::hasTable($table)) {
                continue; // Skip tables not yet migrated (order safety)
            }
            if (Schema::hasColumn($table, 'tenant_id')) {
                continue; // Idempotent
            }

            Schema::table($table, function (Blueprint $blueprint) use ($table) {
                // String FK matching tenants.id (stancl uses string IDs)
                $blueprint->string('tenant_id')
                    ->nullable()
                    ->after('id');

                $blueprint->foreign('tenant_id', "fk_{$table}_tenant")
                    ->references('id')
                    ->on('tenants')
                    ->nullOnDelete();

                $blueprint->index(['tenant_id'], "idx_{$table}_tenant");
            });
        }
    }

    public function down(): void
    {
        foreach ($this->primaryTables as $table) {
            if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'tenant_id')) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) use ($table) {
                $blueprint->dropForeign("fk_{$table}_tenant");
                $blueprint->dropIndex("idx_{$table}_tenant");
                $blueprint->dropColumn('tenant_id');
            });
        }
    }
};