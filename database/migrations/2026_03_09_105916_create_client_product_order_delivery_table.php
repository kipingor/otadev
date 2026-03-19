<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Extend users table for client/contact tracking ──────────────
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'is_client'))     $table->boolean('is_client')->default(false)->after('avatar');
            if (!Schema::hasColumn('users', 'company'))       $table->string('company', 255)->nullable()->after('is_client');
            if (!Schema::hasColumn('users', 'phone'))         $table->string('phone', 50)->nullable()->after('company');
            if (!Schema::hasColumn('users', 'address'))       $table->text('address')->nullable()->after('phone');
            if (!Schema::hasColumn('users', 'notes'))         $table->text('notes')->nullable()->after('address');
            if (!Schema::hasColumn('users', 'client_since'))  $table->date('client_since')->nullable()->after('notes');
        });

        // ── 2. Link leads and opportunities to a client (user) ────────────
        Schema::table('leads', function (Blueprint $table) {
            if (!Schema::hasColumn('leads', 'client_id')) {
                $table->foreignId('client_id')->nullable()
                      ->after('owner_id')
                      ->constrained('users')->nullOnDelete();
            }
        });

        Schema::table('opportunities', function (Blueprint $table) {
            if (!Schema::hasColumn('opportunities', 'client_id')) {
                $table->foreignId('client_id')->nullable()
                      ->after('owner_id')
                      ->constrained('users')->nullOnDelete();
            }
        });

        // ── 3. Products catalog ────────────────────────────────────────────
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->string('name');
            $table->string('sku')->nullable()->unique();
            $table->text('description')->nullable();
            $table->string('category')->nullable();
            $table->string('unit')->nullable();          // pcs, kg, box, licence…
            $table->decimal('unit_cost', 15, 2)->default(0);   // what we pay supplier
            $table->decimal('unit_price', 15, 2)->default(0);  // what we charge client
            $table->integer('stock_qty')->default(0);
            $table->boolean('active')->default(true);
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['supplier_id']);
            $table->index(['category']);
            $table->index(['active']);
        });

        // ── 4. Purchase orders (us → supplier) ────────────────────────────
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->string('number')->unique();
            $table->foreignId('supplier_id')->constrained('suppliers')->cascadeOnDelete();
            $table->foreignId('project_id')->nullable()->constrained('projects')->nullOnDelete();
            $table->foreignId('client_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['draft','sent','confirmed','partially_delivered','delivered','cancelled'])->default('draft');
            $table->date('order_date')->nullable();
            $table->date('expected_delivery_date')->nullable();
            $table->string('currency', 10)->default('USD');
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('tax', 15, 2)->default(0);
            $table->decimal('total', 15, 2)->default(0);
            $table->json('lines')->nullable();           // snapshot of line items
            $table->text('notes')->nullable();
            $table->string('shipping_address')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['supplier_id']);
            $table->index(['status']);
            $table->index(['client_id']);
        });

        // ── 5. Deliveries (purchase order → delivery event) ───────────────
        Schema::create('deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->constrained('purchase_orders')->cascadeOnDelete();
            $table->foreignId('client_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('number')->nullable();
            $table->enum('status', ['pending','in_transit','delivered','partial','rejected'])->default('pending');
            $table->string('carrier')->nullable();        // delivery company name
            $table->string('tracking_number')->nullable();
            $table->string('tracking_url')->nullable();
            $table->date('expected_date')->nullable();
            $table->date('delivered_date')->nullable();
            $table->json('items')->nullable();           // which items + qty delivered
            $table->text('delivery_notes')->nullable();
            // Client sign-off
            $table->string('signed_by')->nullable();     // client name who signed
            $table->string('signature_path')->nullable(); // path to signature image
            $table->timestamp('signed_at')->nullable();
            $table->text('client_notes')->nullable();    // client notes on delivery
            $table->timestamps();
            $table->softDeletes();
            $table->index(['purchase_order_id']);
            $table->index(['status']);
        });

        // ── 6. Delivery documents (GRN, delivery notes, contracts) ─────────
        Schema::create('delivery_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('delivery_id')->nullable()->constrained('deliveries')->nullOnDelete();
            $table->foreignId('purchase_order_id')->nullable()->constrained('purchase_orders')->nullOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type');        // grn|delivery_note|contract|invoice|other
            $table->string('title');
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->string('mime_type')->nullable();
            $table->bigInteger('file_size')->nullable();
            $table->enum('status', ['pending','approved','rejected'])->default('pending');
            $table->text('notes')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['delivery_id']);
            $table->index(['type']);
            $table->index(['status']);
        });

        // ── 7. Extend suppliers table ──────────────────────────────────────
        Schema::table('suppliers', function (Blueprint $table) {
            if (!Schema::hasColumn('suppliers', 'email'))          $table->string('email')->nullable()->after('name');
            if (!Schema::hasColumn('suppliers', 'phone'))          $table->string('phone', 50)->nullable()->after('email');
            if (!Schema::hasColumn('suppliers', 'address'))        $table->text('address')->nullable()->after('phone');
            if (!Schema::hasColumn('suppliers', 'website'))        $table->string('website')->nullable()->after('address');
            if (!Schema::hasColumn('suppliers', 'contact_person')) $table->string('contact_person')->nullable()->after('website');
            if (!Schema::hasColumn('suppliers', 'payment_terms'))  $table->string('payment_terms')->nullable()->after('contact_person');
            if (!Schema::hasColumn('suppliers', 'category'))       $table->string('category')->nullable()->after('payment_terms');
            if (!Schema::hasColumn('suppliers', 'notes'))          $table->text('notes')->nullable()->after('category');
            if (!Schema::hasColumn('suppliers', 'active'))         $table->boolean('active')->default(true)->after('notes');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_documents');
        Schema::dropIfExists('deliveries');
        Schema::dropIfExists('purchase_orders');
        Schema::dropIfExists('products');

        Schema::table('opportunities', function (Blueprint $table) {
            $table->dropForeign(['client_id']);
            $table->dropColumn('client_id');
        });
        Schema::table('leads', function (Blueprint $table) {
            $table->dropForeign(['client_id']);
            $table->dropColumn('client_id');
        });
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['is_client', 'company', 'phone', 'address', 'notes', 'client_since']);
        });
    }
};