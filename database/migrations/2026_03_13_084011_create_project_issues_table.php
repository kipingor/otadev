<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * PMBOK Alignment: Chapter 4 (Integration Management) §4.3.3
 *
 * The Issue Log is an output of "Direct and Manage Project Work" (§4.3).
 * Issues are distinct from risks — they are problems that have already
 * materialised and need resolution. PMBOK §4.3.3 lists the issue log
 * as a project document that is updated throughout execution.
 *
 * Severity maps to PMBOK impact levels.
 * Priority drives resolution order.
 * A realised risk can be linked back to its source risk.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_issues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('raised_by')->nullable()->constrained('users')->nullOnDelete();
            // Optional: link back to the risk that materialised
            $table->foreignId('risk_id')
                  ->nullable()
                  ->constrained('project_risks')
                  ->nullOnDelete();

            $table->string('title');
            $table->text('description')->nullable();

            $table->enum('category', [
                'technical', 'schedule', 'cost', 'scope',
                'resource', 'quality', 'stakeholder', 'external', 'other',
            ])->default('other');

            $table->enum('severity', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');

            $table->enum('status', [
                'open',
                'in_progress',
                'escalated',
                'resolved',
                'closed',
            ])->default('open');

            $table->text('resolution')->nullable();
            $table->date('raised_date')->nullable();
            $table->date('target_resolution_date')->nullable();
            $table->date('resolved_date')->nullable();

            $table->text('impact_description')->nullable();  // impact on scope/schedule/cost
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['project_id', 'status']);
            $table->index(['project_id', 'severity']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_issues');
    }
};