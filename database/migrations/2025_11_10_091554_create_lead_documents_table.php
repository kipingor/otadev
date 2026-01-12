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
        Schema::create('lead_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->string('filename');
            $table->string('original_name');
            $table->string('mime_type')->nullable();
            $table->bigInteger('size')->nullable();
            $table->string('storage_path')->nullable(); // internal path or s3 path
            $table->string('status')->default('queued');
            $table->json('extracted_text')->nullable(); // optionally store extracted text
            $table->json('ai_summary')->nullable(); // AI extraction summary
            $table->timestamps();
            $table->softDeletes();

            $table->index(['lead_id']);
            $table->index(['status']);
            // Foreign key index
            $table->index('lead_id', 'idx_lead_documents_lead_id');
            
            // Status index for filtering processing documents
            $table->index('status', 'idx_lead_documents_status');
            
            // Composite index for queries: WHERE lead_id = ? AND status = ?
            $table->index(['lead_id', 'status'], 'idx_lead_documents_lead_status');
            
            // Created_at for recent documents queries
            $table->index('created_at', 'idx_lead_documents_created_at');
            
            // For finding documents by type
            $table->index('mime_type', 'idx_lead_documents_mime_type');

            // For soft delete queries
            $table->index('deleted_at', 'idx_lead_documents_deleted_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lead_documents');
    }
};
