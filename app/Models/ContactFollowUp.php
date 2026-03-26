<?php

namespace App\Models;

use App\Models\Concerns\HasTenantScope;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactFollowUp extends Model
{
    use HasTenantScope;
    protected $fillable = [
        'tenant_id',
        'contact_id', 'sequence', 'subject', 'body',
        'status', 'scheduled_at', 'sent_at', 'reply_notes',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'sent_at'      => 'datetime',
    ];

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function isOverdue(): bool
    {
        return $this->status === 'scheduled' && $this->scheduled_at->isPast();
    }
}