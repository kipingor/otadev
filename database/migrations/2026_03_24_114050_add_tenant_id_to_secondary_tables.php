<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * MULTITENANCY — Add tenant_id to secondary tables
 *
 * The first tenant migration (2026_03_19_181402) covered 17 primary tables.
 * This migration covers all remaining tables that hold tenant-scoped data
 * but were missed in the original pass.
 *
 * Every table here has a corresponding Model that uses HasTenantScope.
 * The column is nullable to allow the migration to run on existing data.
 * Run TenantDataBackfillCommand afterwards to assign rows to their tenant.
 */
return new class extends Migration {
    private array $tables = [
        // CRM / Communication
        'comments',
        'conversations',
        'emails',
        'messages',
        'notifications',

        // Contacts
        'contact_follow_ups',

        // Clients
        'client_follow_ups',
        'client_reports',

        // Supply Chain
        'products',
        'delivery_documents',

        // HR
        'departments',
        'staff_profiles',
        'hr_leave_requests',

        // Leads
        'lead_documents',
        'lead_questions',

        // Project sub-tables
        'project_changes',
        'project_issues',
        'project_lessons',
        'project_risks',
        'project_stakeholders',
        'project_users',        // ProjectTeamMember
        'project_templates',

        // Automation
        'automation_rules',
        'automation_logs',

        // Admin
        'audit_logs',
        'import_jobs',

        // Tags (shared lookup but still tenant-scoped)
        'tags',

        // Workflows
        'workflows',
    ];

    public function up(): void
    {
        foreach ($this->tables as $table) {
            if (!Schema::hasTable($table)) {
                continue;
            }
            if (Schema::hasColumn($table, 'tenant_id')) {
                continue; // idempotent
            }

            Schema::table($table, function (Blueprint $blueprint) use ($table) {
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
        foreach ($this->tables as $table) {
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
