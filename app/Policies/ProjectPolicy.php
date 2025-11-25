<?php

namespace App\Policies;

use App\Models\User;

class ProjectPolicy
{
    /**
     * Create a new policy instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Determine whether the user can create projects.
     */
    public function create(\App\Models\User $user): bool
    {
        return $user->hasRole('admin');
    }
}
