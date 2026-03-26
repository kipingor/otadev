<?php

namespace App\Models;

use App\Models\Concerns\HasTenantScope;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientFollowUp extends Model
{
    use SoftDeletes, HasTenantScope;

    protected $table = 'client_follow_ups';

    protected $fillable = [
        'tenant_id',
        'client_id', 'project_id', 'invoice_id', 'created_by',
        'type', 'subject', 'notes', 'outcome', 'priority',
        'scheduled_at', 'completed_at',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
