<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('opportunity_id')->nullable()->constrained('opportunities')->cascadeOnDelete();
            $table->foreignId('lead_id')->nullable()->constrained('leads')->nullOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->text('objectives')->nullable();          // Measurable objectives
            $table->text('success_criteria')->nullable();     // How success is measured
            $table->text('scope_statement')->nullable();
            ;// Ch5 — formal scope statement
            $table->text('out_of_scope')->nullable();    // Explicit exclusions
            $table->text('assumptions')->nullable();       // Project assumptions log
            $table->text('constraints')->nullable();          // Known constraints
            $table->text('high_level_risks')->nullable(); // Initial high-level risks
            $table->json('deliverables')->nullable();         // High-level deliverables list
            
            $table->foreignId('client_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('manager_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('sponsor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['planning', 'active', 'on_hold', 'completed', 'cancelled'])->default('planning');
            $table->enum('phase', ['initiating', 'planning', 'executing', 'monitoring_controlling', 'closing'])->default('initiating');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->decimal('budget', 15, 2)->nullable();
            $table->decimal('cost_baseline', 15, 2)->nullable(); // For EVM calculations
            $table->decimal('daily_rate', 10, 2)->nullable();     // Default daily rate for EVM AC calc
            $table->string('currency', 10)->default('USD');
            $table->json('metadata')->nullable(); // custom project metadata
            $table->timestamps();
            $table->softDeletes();

            $table->index(['opportunity_id']);
            $table->index(['client_id']);
            $table->index(['owner_id']);
            $table->index(['status']);

            // Foreign key indexes
            $table->index('opportunity_id', 'idx_projects_opportunity_id');
            $table->index('lead_id', 'idx_projects_lead_id');
            $table->index('manager_id', 'idx_projects_manager_id');
            
            // Status filtering
            $table->index('status', 'idx_projects_status');
            
            // Date-based queries
            $table->index('start_date', 'idx_projects_start_date');
            $table->index('end_date', 'idx_projects_end_date');
            
            // Active projects: WHERE status = 'active' AND start_date <= NOW()
            $table->index(['status', 'start_date'], 'idx_projects_status_start');
 
            $table->index('deleted_at', 'idx_projects_deleted_at');
            $table->index('phase', 'idx_projects_phase');
            $table->index('sponsor_id', 'idx_projects_sponsor_id');
        });

        // pivot table: project assignments (staff or contractors)
        Schema::create('project_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('role', 100)->nullable(); // e.g., PM, developer
            $table->decimal('allocation_percentage', 5, 2)->default(100);
            $table->decimal('hourly_rate', 8, 2)->nullable();
            $table->text('responsibilities')->nullable();    // RACI-level description
            $table->timestamp('joined_at')->nullable();
            $table->timestamps();
            $table->unique(['project_id', 'user_id'], 'project_user_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_users');
        Schema::dropIfExists('projects');
    }
};
