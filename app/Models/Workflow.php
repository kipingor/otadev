<?php

namespace App\Models;

use App\Models\Concerns\HasTenantScope;

use Illuminate\Database\Eloquent\Model;

class Workflow extends Model
{
    use HasTenantScope;
    protected $fillable = [
        'tenant_id',
        'name',
        'description',
        'enabled',
        'trigger_type',
        'trigger_conditions',
        'actions',
        'user_id',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'trigger_conditions' => 'array',
        'actions' => 'array',
        'last_run_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
