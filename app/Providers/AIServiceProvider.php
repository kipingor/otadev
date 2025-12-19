<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\AI\OpenAIClientContract;
use App\Services\AI\OpenAIClient;

class AIServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->bind(
            \App\Services\AI\OpenAIClientContract::class,
        );
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
