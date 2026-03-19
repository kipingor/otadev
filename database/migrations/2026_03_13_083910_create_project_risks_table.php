<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * PMBOK Alignment: Chapter 11 (Risk Management)
 *
 * Implements the Risk Register as defined in PMBOK §11.2.3.
 * Supports: Identify Risks, Qualitative Analysis, Risk Responses,
 * and Monitor Risks.
 *
 * Fields map to PMBOK risk register components:
 *  - category       → Risk Breakdown Structure (RBS) categories
 *  - probability    → Qualitative probability (§11.3)
 *  - impact         → Qualitative impact rating (§11.3)
 *  - risk_score     → probability × impact (P×I matrix)
 *  - response_type  → Risk Response Strategies (§11.5): avoid/transfer/mitigate/accept
 *  - response_plan  → Risk Response Plan description
 *  - contingency    → Contingency Reserve plan
 *  - owner_id       → Risk Owner (accountable for monitoring and response)
 *  - trigger        → Risk triggers / warning signs
 *  - status         → Active, Closed, Realized
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_risks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            // Identification
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('category', [
                'technical',
                'external',
                'organizational',
                'project_management',
                'schedule',
                'cost',
                'scope',
                'quality',
                'resource',
                'other',
            ])->default('other');

            // Qualitative Analysis (PMBOK §11.3) — scale 1-5
            $table->unsignedTinyInteger('probability')->default(1); // 1=Very Low … 5=Very High
            $table->unsignedTinyInteger('impact')->default(1);      // 1=Very Low … 5=Very High
            $table->decimal('risk_score', 4, 2)
                  ->storedAs('probability * impact')
                  ->comment('P×I score, auto-calculated'); // 1–25

            // Risk Response (PMBOK §11.5)
            $table->enum('response_type', [
                'avoid',
                'transfer',
                'mitigate',
                'accept',
                'escalate',
            ])->nullable();
            $table->text('response_plan')->nullable();
            $table->text('contingency_plan')->nullable();
            $table->text('trigger')->nullable(); // warning signs

            // Residual risk after response
            $table->unsignedTinyInteger('residual_probability')->nullable();
            $table->unsignedTinyInteger('residual_impact')->nullable();

            $table->enum('status', ['identified', 'active', 'realized', 'closed'])->default('identified');
            $table->date('identified_date')->nullable();
            $table->date('review_date')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['project_id', 'status']);
            $table->index(['project_id', 'risk_score']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_risks');
    }
};