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
use App\Policies\ActivityPolicy;
use App\Policies\LeadDocumentPolicy;
use App\Policies\ConversationPolicy;
use App\Policies\LeadQuestionPolicy;
use App\Policies\MilestonePolicy;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(
            \App\Services\AI\OpenAIClient::class,
            \App\Services\AI\OpenAIClientGuzzle::class,
            \App\Services\AI\OpenAIClientContract::class,
        );        
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
        Gate::policy(LeadQuestionPolicy::class, LeadQuestionPolicy::class);
        Gate::policy(LeadDocumentPolicy::class, LeadDocumentPolicy::class);
        Gate::policy(ActivityPolicy::class, ActivityPolicy::class);
        Gate::policy(ConversationPolicy::class, ConversationPolicy::class);
        Gate::policy(MilestonePolicy::class, MilestonePolicy::class);
    }
}
