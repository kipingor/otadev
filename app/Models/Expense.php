<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Expense extends Model
{
    use HasFactory, SoftDeletes;


    protected $fillable = [
        'project_id', 'amount', 'category', 'description', 'incurred_at', 'currency', 'entered_by', 'vendor', 'receipt_path', 'notes', 'lines'
    ];


    public function project()
    {
    return $this->belongsTo(Project::class, 'project_id');
    }


    public function user()
    {
    return $this->belongsTo(User::class, 'entered_by');
    }
}
