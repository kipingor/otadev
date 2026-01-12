<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // For MySQL/MariaDB
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE leads ADD FULLTEXT idx_leads_fulltext (title, description)');
        }
        
        // For PostgreSQL - would use different syntax
        // if (DB::connection()->getDriverName() === 'pgsql') {
        //     DB::statement('CREATE INDEX idx_leads_fulltext ON leads USING gin(to_tsvector(\'english\', title || \' \' || description))');
        // }
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE leads DROP INDEX idx_leads_fulltext');
        }
    }
};