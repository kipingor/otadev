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
        Schema::table('activity_log', function (Blueprint $table) {
            // Polymorphic relationship indexes
            $table->index(['subject_type', 'subject_id'], 'idx_activity_subject');
            $table->index(['causer_type', 'causer_id'], 'idx_activity_causer');
                              
            // Recent activity queries
            $table->index('created_at', 'idx_activity_created_at');
            
            // User activity: WHERE causer_type = ? AND causer_id = ? ORDER BY created_at DESC
            $table->index(['causer_type', 'causer_id', 'created_at'], 'idx_activity_causer_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('activity_log', function (Blueprint $table) {
            $table->dropIndex('idx_activity_subject');
            $table->dropIndex('idx_activity_causer');
            $table->dropIndex('idx_activity_event');
            $table->dropIndex('idx_activity_created_at');
            $table->dropIndex('idx_activity_causer_date');
        });
    }
};
