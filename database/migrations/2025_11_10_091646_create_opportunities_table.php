<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('opportunities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->nullable()->constrained('leads')->nullOnDelete();
            $table->string('title')->nullable();
            $table->text('summary')->nullable(); // AI generated summary/proposal notes
            $table->decimal('estimated_value', 15, 2)->nullable();
            $table->string('currency', 10)->default('USD');
            $table->enum('stage', ['prospect', 'proposal', 'negotiation', 'won', 'lost'])->default('prospect');
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('expected_close_date')->nullable();
            $table->json('ai_suggestions')->nullable(); // e.g., supplier suggestions
            $table->softDeletes();

            $table->index(['lead_id']);
            $table->index(['owner_id']);
            $table->index(['stage']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('opportunities');
    }
};
