<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HrLeaveRequest extends Model
{
    protected $fillable = [
        'staff_profile_id',
        'from_date',
        'to_date',
        'type',
        'reason',
        'status',
        'approved_by',
        'admin_notes',
    ];

    protected $casts = [
        'from_date' => 'date',
        'to_date' => 'date',
    ];

    public function staffProfile()
    {
        return $this->belongsTo(StaffProfile::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
