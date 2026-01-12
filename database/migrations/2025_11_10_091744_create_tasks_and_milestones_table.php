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
        Schema::create('milestones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('due_date')->nullable();
            $table->enum('status', ['pending', 'achieved', 'overdue'])->default('pending');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['project_id']);
            $table->index(['status']);
        });

        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('milestone_id')->nullable()->constrained('milestones')->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium');
            $table->enum('status', ['todo', 'in_progress', 'review', 'done'])->default('todo');
            $table->date('startAt')->nullable();
            $table->date('endAt')->nullable();
            $table->integer('estimated_hours')->nullable();
            $table->integer('spent_hours')->default(0);
            $table->string('group')->default('None');
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['project_id']);
            $table->index(['milestone_id']);
            $table->index(['assigned_to']);
            $table->index(['status']);

            // Foreign key indexes
            $table->index('project_id', 'idx_tasks_project_id');
            $table->index('assigned_to', 'idx_tasks_assigned_to');
            $table->index('milestone_id', 'idx_tasks_milestone_id');
            
            // Status and priority filtering
            $table->index('status', 'idx_tasks_status');
            $table->index('priority', 'idx_tasks_priority');
            
            // Due date queries
            $table->index('endAt', 'idx_tasks_endAt');
            
            // Overdue tasks: WHERE status != 'completed' AND endAt < NOW()
            $table->index(['status', 'endAt'], 'idx_tasks_status_due');
            
            // User's tasks: WHERE assigned_to = ? AND status = ?
            $table->index(['assigned_to', 'status'], 'idx_tasks_assigned_status');
            
            // Soft deletes
            $table->index('deleted_at', 'idx_tasks_deleted_at');
        });

        // time logs for tasks (for tracking cost)
        Schema::create('time_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('hours', 8, 2);
            $table->text('notes')->nullable();
            $table->dateTime('logged_at')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('time_logs');
        Schema::dropIfExists('tasks');
        Schema::dropIfExists('milestones');
    }
};
