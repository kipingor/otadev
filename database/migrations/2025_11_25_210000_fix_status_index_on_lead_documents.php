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
        if (! Schema::hasTable('lead_documents')) {
            return;
        }

        Schema::table('lead_documents', function (Blueprint $table) {
            // Defensive: attempt to drop any named index we expect, swallow errors if it doesn't exist.
            try {
                $table->dropIndex('lead_documents_status_index');
            } catch (\Throwable $e) {
                // ignore
            }

            // Ensure the column exists before creating an index
            if (Schema::hasColumn('lead_documents', 'status')) {
                $table->index('status', 'lead_documents_status_index');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('lead_documents')) {
            return;
        }

        Schema::table('lead_documents', function (Blueprint $table) {
            try {
                $table->dropIndex('lead_documents_status_index');
            } catch (\Throwable $e) {
                // ignore
            }
        });
    }
};
