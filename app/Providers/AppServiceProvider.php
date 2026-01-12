<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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

        if (app()->environment('local')) {
            DB::listen(function ($query) {
                if ($query->time > 100) { // Log queries taking > 100ms
                    Log::warning('Slow Query Detected', [
                        'sql' => $query->sql,
                        'bindings' => $query->bindings,
                        'time' => $query->time . 'ms',
                    ]);
                }
            });
        }
    }
}
