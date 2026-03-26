<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTenantsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->string('id')->primary();   // stancl uses string IDs by default
 
            // ── Core tenant identity ───────────────────────────────────────
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('email');
            $table->string('phone')->nullable();
            $table->string('logo_path')->nullable();
            $table->string('timezone')->default('UTC');
            $table->string('currency', 3)->default('USD');
 
            // ── Subscription / plan state ─────────────────────────────────
            $table->enum('plan', ['free', 'starter', 'growth', 'enterprise'])->default('free');
            $table->enum('status', ['trial', 'active', 'suspended', 'cancelled'])->default('trial');
            $table->unsignedSmallInteger('max_users')->default(1);
            $table->unsignedSmallInteger('max_modules')->default(1);
 
            // ── Billing ───────────────────────────────────────────────────
            $table->string('stripe_customer_id')->nullable()->index();
 
            // ── Timestamps + extra JSON bag (stancl convention) ───────────
            $table->json('data')->nullable();  // stancl stores extra attrs here
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('suspended_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
 
            $table->index(['plan', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
}
