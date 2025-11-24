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
        Schema::create('lead_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->text('question');
            $table->text('context')->nullable(); // excerpt or reasoning
            $table->foreignId('asked_by')->nullable()->constrained('users')->nullOnDelete(); // AI or user id
            $table->boolean('answered')->default(false);
            $table->text('answer')->nullable();
            $table->integer('order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['lead_id']);
            $table->index(['asked_by']);
            $table->index(['order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lead_questions');
    }
};
