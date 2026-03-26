<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * MULTITENANCY — Module Registry + Subscriptions + Module-Tenant Access
 *
 * modules         — master list of purchasable product modules
 * subscriptions   — one per tenant, mirrors Paystack subscription state
 * tenant_modules  — which modules each tenant currently has enabled
 *
 * Module keys map 1:1 to sidebar nav groups and route middleware.
 * The `is_free` flag marks modules available on the free/freemium plan.
 * On signup the user picks ONE free module; more require a paid plan.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── Module registry ───────────────────────────────────────────────────
        Schema::create('modules', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();          // 'leads', 'accounting', etc.
            $table->string('name');
            $table->string('description')->nullable();
            $table->string('icon')->nullable();       // Lucide icon name
            $table->boolean('is_free')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedTinyInteger('sort_order')->default(0);
            $table->json('plan_availability')->nullable(); // ['free','starter',...]
            $table->timestamps();
        });

        // ── Subscriptions ─────────────────────────────────────────────────────
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id')->unique();
            $table->string('paystack_customer_code')->nullable();
            $table->string('paystack_subscription_code')->nullable();
            $table->string('paystack_email_token')->nullable();
            $table->enum('plan', ['free', 'starter', 'growth', 'enterprise'])->default('free');
            $table->enum('billing_cycle', ['monthly', 'annual'])->default('monthly');
            $table->enum('status', ['active', 'trialing', 'past_due', 'cancelled', 'incomplete'])->default('trialing');
            $table->unsignedSmallInteger('max_users')->default(1);
            $table->decimal('amount', 10, 2)->default(0);
            $table->string('currency', 3)->default('USD');
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('current_period_start')->nullable();
            $table->timestamp('current_period_end')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->index('status');
        });

        // ── Tenant ↔ Module access ────────────────────────────────────────────
        Schema::create('tenant_modules', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->foreignId('module_id')->constrained('modules')->cascadeOnDelete();
            $table->boolean('is_enabled')->default(true);
            $table->timestamp('enabled_at')->useCurrent();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->unique(['tenant_id', 'module_id']);
            $table->index(['tenant_id', 'is_enabled']);
        });

        // ── Seed the module registry ──────────────────────────────────────────
        $now = now();

        DB::table('modules')->insert([
            // ── Free-eligible (user picks ONE on freemium) ──────────────────
            ['key' => 'leads',         'name' => 'Lead Management',       'description' => 'Capture, track and manage leads through your pipeline.',             'icon' => 'Users',         'is_free' => true,  'is_active' => true, 'sort_order' => 1,  'plan_availability' => json_encode(['free','starter','growth','enterprise']), 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'pipeline',      'name' => 'Pipeline & Kanban',     'description' => 'Visual kanban board for managing deal stages.',                      'icon' => 'Columns',       'is_free' => true,  'is_active' => true, 'sort_order' => 2,  'plan_availability' => json_encode(['free','starter','growth','enterprise']), 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'contacts',      'name' => 'Contact Management',    'description' => 'Centralise all contacts and company information.',                   'icon' => 'BookUser',      'is_free' => true,  'is_active' => true, 'sort_order' => 3,  'plan_availability' => json_encode(['free','starter','growth','enterprise']), 'created_at' => $now, 'updated_at' => $now],

            // ── Paid modules ──────────────────────────────────────────────
            ['key' => 'opportunities', 'name' => 'Opportunities',         'description' => 'Track revenue opportunities from lead to close.',                   'icon' => 'Target',        'is_free' => false, 'is_active' => true, 'sort_order' => 4,  'plan_availability' => json_encode(['starter','growth','enterprise']),        'created_at' => $now, 'updated_at' => $now],
            ['key' => 'projects',      'name' => 'Project Management',    'description' => 'PMBOK-compliant projects with tasks, milestones & WBS.',            'icon' => 'FolderKanban',  'is_free' => false, 'is_active' => true, 'sort_order' => 5,  'plan_availability' => json_encode(['starter','growth','enterprise']),        'created_at' => $now, 'updated_at' => $now],
            ['key' => 'accounting',    'name' => 'Invoices & Accounting', 'description' => 'Create invoices, record payments and track expenses.',              'icon' => 'Receipt',       'is_free' => false, 'is_active' => true, 'sort_order' => 6,  'plan_availability' => json_encode(['starter','growth','enterprise']),        'created_at' => $now, 'updated_at' => $now],
            ['key' => 'clients',       'name' => 'Client CRM',            'description' => 'Full client relationship management with follow-ups and reports.',  'icon' => 'Building2',     'is_free' => false, 'is_active' => true, 'sort_order' => 7,  'plan_availability' => json_encode(['starter','growth','enterprise']),        'created_at' => $now, 'updated_at' => $now],
            ['key' => 'analytics',     'name' => 'Analytics & Reporting', 'description' => 'Advanced dashboards, conversion funnels, and team performance.',   'icon' => 'BarChart3',     'is_free' => false, 'is_active' => true, 'sort_order' => 8,  'plan_availability' => json_encode(['growth','enterprise']),                  'created_at' => $now, 'updated_at' => $now],
            ['key' => 'supply_chain',  'name' => 'Supply Chain',          'description' => 'Purchase orders, deliveries, products and supplier management.',   'icon' => 'Truck',         'is_free' => false, 'is_active' => true, 'sort_order' => 9,  'plan_availability' => json_encode(['growth','enterprise']),                  'created_at' => $now, 'updated_at' => $now],
            ['key' => 'hr',            'name' => 'HR & Leave Management', 'description' => 'Employee records, leave requests and departmental HR workflows.',   'icon' => 'UserCog',       'is_free' => false, 'is_active' => true, 'sort_order' => 10, 'plan_availability' => json_encode(['enterprise']),                           'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_modules');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('modules');
    }
};