<?php

namespace App\Models;

use App\Models\Concerns\HasTenantScope;

use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use HasTenantScope;
    protected $fillable = [
        'tenant_id',
        'name',
        'description',
        'head_id',
    ];

    public function head()
    {
        return $this->belongsTo(User::class, 'head_id');
    }

    public function staffProfiles()
    {
        return $this->hasMany(StaffProfile::class);
    }
}
