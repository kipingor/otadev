<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('lead_document', function (Blueprint $table) {
            // Add status column if it doesn't exist
            if (!Schema::hasColumn('lead_documents', 'status')) {
                $table->string('status')->default('pending')->after('processed');
                $table->index('status');
            }
        });

        // Update existing records
        DB::table('lead_documents')
            ->whereNull('status')
            ->update([
                'status' => DB::raw("CASE 
                    WHEN processed = 1 THEN 'succeeded' 
                    ELSE 'pending' 
                END")
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lead_document', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
