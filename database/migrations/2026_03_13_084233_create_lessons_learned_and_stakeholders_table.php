<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * PMBOK Ch4.4 — Lessons Learned Register
 * PMBOK Ch13  — Stakeholder Register
 */
return new class extends Migration
{
    public function up(): void
    {
        // ─── Lessons Learned Register (PMBOK Ch4.4) ──────────────────────────
        // Updated throughout the project (not just at closing).
        // Becomes part of the organisational knowledge base for future projects.
        Schema::create('project_lessons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
 
            $table->string('title');
            $table->text('situation');         // What happened?
            $table->text('impact');            // What was the effect?
            $table->text('recommendation');    // What should future projects do?
 
            $table->enum('category', [
                'technical',
                'schedule',
                'cost',
                'scope',
                'quality',
                'risk',
                'stakeholder',
                'team',
                'process',
                'tools',
                'other',
            ])->default('other');
 
            $table->enum('type', ['positive', 'negative', 'observation'])->default('negative');
 
            // Which phase the lesson was captured in
            $table->enum('phase_captured', [
                'initiating', 'planning', 'executing',
                'monitoring_controlling', 'closing',
            ])->nullable();
 
            $table->json('tags')->nullable();     // free-form searchable tags
 
            $table->timestamps();
 
            $table->index(['project_id', 'category']);
            $table->index(['project_id', 'type']);
        });

        // ─── Stakeholder Register (PMBOK Ch13.1) ─────────────────────────────
        // Documents identification information, assessment information,
        // and stakeholder classification for all stakeholders.
        Schema::create('project_stakeholders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            // Internal stakeholder (system user) — optional
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();

            // External stakeholder details (used when user_id is null)
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('organization')->nullable();
            $table->string('role')->nullable();          // their role relative to the project

            // Power/Interest Grid (PMBOK §13.1.2 Tools)
            $table->enum('influence', ['low', 'medium', 'high'])->default('medium'); // power axis
            $table->enum('interest', ['low', 'medium', 'high'])->default('medium');  // interest axis

            // Engagement Level (PMBOK §13.2.2 — Stakeholder Engagement Assessment Matrix)
            $table->enum('current_engagement', [
                'unaware',     // Unaware of project and potential impacts
                'resistant',   // Aware but resistant to change
                'neutral',     // Aware but neither supportive nor resistant
                'supportive',  // Aware and supportive of change
                'leading',     // Aware and actively engaged in making the project succeed
            ])->default('unaware');

            $table->enum('desired_engagement', [
                'unaware',
                'resistant',
                'neutral',
                'supportive',
                'leading',
            ])->default('supportive');

            // Communication preferences
            $table->string('preferred_communication')->nullable(); // email/meetings/reports/etc
            $table->string('communication_frequency')->nullable(); // daily/weekly/monthly

            $table->text('expectations')->nullable();      // what they expect from the project
            $table->text('concerns')->nullable();          // their concerns/potential objections
            $table->text('engagement_strategy')->nullable(); // how to manage this stakeholder
            $table->text('notes')->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['project_id', 'influence', 'interest']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_stakeholders');
        Schema::dropIfExists('project_lessons_learned');
    }
};
