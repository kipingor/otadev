<?php

namespace App\Policies;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class LeadPolicy
{
    /**
     * Determine whether the user can view any leads.
     */
    public function viewAny(User $user): bool
    {
        return true;
        // return in_array($user->role, ['admin', 'sales', 'manager']);
    }

    /**
     * Determine whether the user can view the lead.
     */
    public function view(User $user, Lead $lead): bool
    {
        return $user->id === $lead->owner_id;
    }

    /**
     * Determine whether the user can create leads.
     */
    public function create(User $user): bool
    {
        return $user->hasRole('admin') || $user->hasRole('sales');
    }

    /**
     * Determine whether the user can update the lead.
     */
    public function update(User $user, Lead $lead): bool
    {
        return $user->id === $lead->owner_id;
    }

    /**
     * Determine whether the user can delete the lead.
     */
    public function delete(User $user, Lead $lead): bool
    {
        return $user->id === $lead->owner_id;
    }
}
