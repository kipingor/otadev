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
