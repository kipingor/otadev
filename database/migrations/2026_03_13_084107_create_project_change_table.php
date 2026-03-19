<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * PMBOK Alignment: Chapter 4 §4.6 — Perform Integrated Change Control
 *
 * The Change Log tracks all Change Requests raised against the project.
 * Every change that affects scope, schedule, cost, or quality baselines
 * must flow through Integrated Change Control (PMBOK §4.6).
 *
 * PMBOK §4.6.3 lists "Change Requests (updated)" as a key output.
 * Fields align with the standard change request format:
 *  - change_type    → Corrective, Preventive, Defect Repair, Update
 *  - impact_scope   → which baselines are affected
 *  - status         → Submitted → Under Review → Approved/Rejected → Implemented
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_changes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();

            // Optionally link to a risk or issue that drove the change
            $table->foreignId('risk_id')->nullable()->constrained('project_risks')->nullOnDelete();
            $table->foreignId('issue_id')->nullable()->constrained('project_issues')->nullOnDelete();

            $table->string('title');
            $table->text('description');

            // Change Request type (PMBOK §4.3.3)
            $table->enum('change_type', [
                'corrective_action',   // realigning performance with plan
                'preventive_action',   // reducing probability of negative outcomes
                'defect_repair',       // fix a non-conforming component
                'scope_change',        // add/remove deliverables
                'schedule_change',     // adjust baseline dates
                'cost_change',         // adjust budget
                'other',
            ])->default('other');

            // Which baselines does this change affect?
            $table->boolean('impacts_scope')->default(false);
            $table->boolean('impacts_schedule')->default(false);
            $table->boolean('impacts_cost')->default(false);
            $table->boolean('impacts_quality')->default(false);

            // Quantified impact estimates
            $table->integer('schedule_impact_days')->nullable();   // + = delay, - = acceleration
            $table->decimal('cost_impact', 15, 2)->nullable();     // + = cost increase

            // Status workflow (PMBOK §4.6.3)
            $table->enum('status', [
                'submitted',
                'under_review',
                'approved',
                'rejected',
                'deferred',
                'implemented',
            ])->default('submitted');

            $table->text('justification')->nullable();
            $table->text('review_notes')->nullable();
            $table->date('requested_date')->nullable();
            $table->date('decision_date')->nullable();
            $table->date('implementation_date')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['project_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_changes');
    }
};