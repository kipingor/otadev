<?php

namespace App\Models;

use App\Models\Concerns\HasTenantScope;

use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    use HasTenantScope;
    protected $fillable = [
        'tenant_id',
        'user_id',
        'commentable_type',
        'commentable_id',
        'body',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function commentable()
    {
        return $this->morphTo();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
