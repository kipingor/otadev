<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Project;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Supplier;
use App\Models\Client;
use App\Models\Task;
use App\Models\Milestone;
use App\Models\Payment;
use App\Models\Receipt;
use App\Models\BankAccount;
use App\Models\Currency;
use App\Models\TaxRate;
use App\Models\TaxCategory;
use App\Models\TaxRule;
use App\Models\TaxGroup;
use App\Models\TaxRuleSet;

class AccountingPolicy
{
    /**
     * Create a new policy instance.
     */
    public function __construct()
    {
        //
    }

    public function viewAny(User $user): bool
    {
        return $user->hasRole('admin') || $user->hasRole('accounting');
    }

    public function view(User $user, Project $project): bool
    {
        return $user->hasRole('admin') || $project->created_by === $user->id;
    }
}
