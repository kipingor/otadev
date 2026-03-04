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
        Schema::create('pipeline_stages', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // machine key: new, contacted, qualified, opportunity, proposal_sent, closed_won, closed_lost
            $table->string('name'); // human name
            $table->string('color', 7)->nullable();
            $table->integer('order')->default(0); // ordering in kanban
            $table->timestamps();

            $table->index(['order']);
        });
        
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->decimal('estimated_value', 10, 2)->nullable();
            $table->json('ai_analysis')->nullable();
            $table->timestamp('ai_processed_at')->nullable();
            $table->enum('type', ['document', 'conversation'])->default('conversation');
            $table->string('status', 50)
                ->default('new');
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete(); // assigned owner
            $table->foreignId('pipeline_stage_id')->nullable()->constrained('pipeline_stages')->nullOnDelete();
            $table->unsignedInteger('order')->default(0);
            $table->json('metadata')->nullable(); // extracted requirements, short summary from AI
            $table->boolean('ai_reviewed')->default(false); // whether AI has extracted requirements
            $table->boolean('is_starred')->default(false);
            $table->timestamp('contacted_at')->nullable();
            $table->timestamp('qualified_at')->nullable();
            $table->timestamp('proposal_sent_at')->nullable();
            $table->timestamp('negotiation_started_at')->nullable();
            $table->timestamp('converted_to_opportunity_at')->nullable();
            $table->timestamp('won_at')->nullable();
            $table->timestamp('lost_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // Single column indexes for frequent lookups
            $table->index('owner_id', 'idx_leads_owner_id');
            $table->index('pipeline_stage_id', 'idx_leads_pipeline_stage_id');
            $table->index('status', 'idx_leads_status');
            $table->index('type', 'idx_leads_type');
            $table->index('created_by', 'idx_leads_created_by');
            $table->index('is_starred', 'idx_leads_is_starred');
            
            // Composite indexes for common query patterns
            // For queries: WHERE owner_id = ? AND status = ?
            $table->index(['owner_id', 'status'], 'idx_leads_owner_status');
            
            // For queries: WHERE pipeline_stage_id = ? ORDER BY order
            $table->index(['pipeline_stage_id', 'order'], 'idx_leads_stage_order');
            
            // For queries: WHERE status = ? AND created_at >= ?
            $table->index(['status', 'created_at'], 'idx_leads_status_created');
            
            // For dashboard queries: WHERE created_at >= ? AND status IN (...)
            $table->index(['created_at', 'status'], 'idx_leads_created_status');
            
            // For soft delete queries
            $table->index('deleted_at', 'idx_leads_deleted_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leads');
        Schema::dropIfExists('pipeline_stages');
    }
};
