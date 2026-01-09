<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        if (!empty(config('services.openai.api_key'))) {
            $this->app->bind(
                \App\Services\AI\OpenAIClientInterface::class,
                \App\Services\AI\OpenAIClient::class
            );
        } else {
            $this->app->bind(
                \App\Services\AI\OpenAIClientInterface::class,
                \App\Services\AI\NullOpenAIClient::class
            );
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register model policies so `Gate::authorize('action', Model::class)` works

        // Storage::disk('local')->buildTemporaryUrlsUsing(

        //     function (string $path, DateTime $expiration, array $options) {
        //         return URL::temporarySignedRoute(
        //             'files.download',
        //             $expiration,
        //             array_merge($options, ['path' => $path])
        //         );
        //     }

        // );
    }
}
