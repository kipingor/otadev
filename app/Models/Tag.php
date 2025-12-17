<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tag extends Model
{
    protected $fillable = ['name', 'color'];

    public function leads()
    {
        return $this->morphedByMany(Lead::class, 'taggable');
    }

    public function projects()
    {
        return $this->morphedByMany(Project::class, 'taggable');
    }
}
