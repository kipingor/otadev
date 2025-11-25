<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\User;
use App\Models\Opportunity;
use App\Models\Project;
use App\Models\Lead;
use App\Policies\UserPolicy;
use App\Policies\OpportunityPolicy;
use App\Policies\ProjectPolicy;
use App\Policies\LeadPolicy;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register model policies so `Gate::authorize('action', Model::class)` works
        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Opportunity::class, OpportunityPolicy::class);
        Gate::policy(Project::class, ProjectPolicy::class);
        Gate::policy(Lead::class, LeadPolicy::class);
    }
}
