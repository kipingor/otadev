<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * MULTITENANCY — User ↔ Tenant membership
 *
 * One user can belong to multiple tenants. current_tenant_id tracks
 * the active tenant for the session.
 *
 * Tenant roles (separate from Spatie's app-level roles):
 *   owner  — created the tenant; full admin + billing access
 *   admin  — full module access, cannot change billing
 *   member — scoped by module permissions on the subscription
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('current_tenant_id')->nullable();
            $table->foreign('current_tenant_id')->after('id')->references('id')->on('tenants')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['current_tenant_id']);
            $table->dropColumn('current_tenant_id');
        });
    }
};
