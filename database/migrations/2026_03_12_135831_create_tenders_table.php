<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('lead_id')->nullable()->constrained('leads')->nullOnDelete();
            $table->foreignId('opportunity_id')->nullable()->constrained('opportunities')->nullOnDelete();
            $table->foreignId('project_id')->nullable()->constrained('projects')->nullOnDelete();

            $table->string('title');
            $table->string('reference_number')->nullable();
            $table->string('issuer')->nullable();
            $table->string('document_path')->nullable();
            $table->string('document_name')->nullable();

            // Lifecycle: reviewing → drafting → submitted → won | lost | withdrawn
            $table->enum('status', ['reviewing','drafting','submitted','won','lost','withdrawn'])
                  ->default('reviewing');

            $table->date('submission_deadline')->nullable();
            $table->date('submitted_at')->nullable();
            $table->decimal('estimated_value', 15, 2)->nullable();
            $table->string('currency', 3)->default('USD');

            // AI outputs
            $table->json('extracted_data')->nullable();     // requirements, criteria, budget, timeline
            $table->json('ai_analysis')->nullable();        // summary, strengths, risks, win themes
            $table->json('checklist')->nullable();          // [{id, category, label, done, notes}, ...]
            $table->json('information_gaps')->nullable();   // [{id, question, why_needed, answer, resolved}, ...]
            $table->json('generated_documents')->nullable();// [{type, title, content, created_at}, ...]
            $table->json('agent_conversation')->nullable(); // [{role, content, created_at}, ...]

            $table->text('notes')->nullable();
            $table->json('metadata')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['owner_id', 'status']);
            $table->index('submission_deadline');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenders');
    }
};