<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Concerns\HasTenantScope;

class Vendor extends Model
{
    /** @use HasFactory<\Database\Factories\VendorFactory> */
    use SoftDeletes, HasFactory, HasTenantScope;

    protected $fillable = [
        'tenant_id', 'name', 'category', 'contact_info', 'metadata', 'status'
    ];

    protected $casts = [
        'contact_info' => 'array',
        'metadata' => 'array',
    ];
}
