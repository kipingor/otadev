<?php

namespace App\Models;

use App\Models\User;

class Client extends User
{
    protected $table = 'users';

    public function projects()
    {
        return $this->hasMany(Project::class, 'client_id');
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class, 'client_id');
    }
}
