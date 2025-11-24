<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Invoice extends Model
{
    use HasFactory, SoftDeletes;


    protected $fillable = [
        'project_id', 'status', 'currency', 'client_id', 'number', 'issue_date', 'due_date', 'subtotal', 'tax', 'total', 'notes', 'lines'
    ];

    public function client()
    {
    return $this->belongsTo(User::class, 'client_id');
    }

    public function project()
    {
    return $this->belongsTo(Project::class, 'project_id');
    }
}
