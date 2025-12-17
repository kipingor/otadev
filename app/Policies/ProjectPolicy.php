<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Project;

class ProjectPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'manager', 'project-manager']);
    }

    public function view(User $user, Project $project): bool
    {
        return $user->hasRole('admin') ||
               $project->owner_id === $user->id ||
               $project->client_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'project-manager']);
    }

    public function update(User $user, Project $project): bool
    {
        return $user->hasRole('admin') ||
               $project->owner_id === $user->id;
    }

    public function delete(User $user, Project $project): bool
    {
        return $user->hasRole('admin');
    }
}
