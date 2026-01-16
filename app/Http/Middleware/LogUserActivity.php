<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class LogUserActivity
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only log for authenticated users
        if (auth()->check()) {
            $this->logActivity($request, $response);
        }

        return $response;
    }

    /**
     * Log the user activity.
     */
    protected function logActivity(Request $request, Response $response): void
    {
        // Don't log certain routes
        $excludedRoutes = [
            'horizon.*',
            'telescope.*',
            '_debugbar.*',
            '*.css',
            '*.js',
            '*.jpg',
            '*.png',
            '*.svg',
        ];

        $currentRoute = $request->route()?->getName();

        foreach ($excludedRoutes as $pattern) {
            if ($currentRoute && fnmatch($pattern, $currentRoute)) {
                return;
            }
        }

        // Only log successful responses and important HTTP methods
        if ($response->getStatusCode() >= 200 && $response->getStatusCode() < 300) {
            $method = $request->method();

            if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
                $this->createActivityLog($request, $response);
            }
        }
    }

    /**
     * Create activity log entry.
     */
    protected function createActivityLog(Request $request, Response $response): void
    {
        try {
            $user = auth()->user();
            $route = $request->route();
            $method = $request->method();
            $path = $request->path();

            // Determine activity type
            $type = $this->determineActivityType($method, $path);

            // Get description
            $description = $this->getActivityDescription($method, $route, $request);

            // Store activity
            \App\Models\Activity::create([
                'type' => $type,
                'description' => $description,
                'causer_type' => get_class($user),
                'causer_id' => $user->id,
                'properties' => json_encode([
                    'method' => $method,
                    'path' => $path,
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'route_name' => $route?->getName(),
                ]),
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to log user activity', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);
        }
    }

    /**
     * Determine activity type from request.
     */
    protected function determineActivityType(string $method, string $path): string
    {
        $segments = explode('/', trim($path, '/'));
        $resource = $segments[0] ?? 'unknown';

        $typeMap = [
            'POST' => "{$resource}_created",
            'PUT' => "{$resource}_updated",
            'PATCH' => "{$resource}_updated",
            'DELETE' => "{$resource}_deleted",
        ];

        return $typeMap[$method] ?? 'activity';
    }

    /**
     * Get human-readable activity description.
     */
    protected function getActivityDescription(string $method, $route, Request $request): string
    {
        $routeName = $route?->getName() ?? '';
        $segments = explode('/', trim($request->path(), '/'));
        $resource = ucfirst($segments[0] ?? 'Resource');

        $descriptions = [
            'POST' => "Created new {$resource}",
            'PUT' => "Updated {$resource}",
            'PATCH' => "Updated {$resource}",
            'DELETE' => "Deleted {$resource}",
        ];

        // Try to get resource name from request
        $name = $request->input('title') ?? $request->input('name');
        if ($name) {
            return str_replace($resource, "{$resource} '{$name}'", $descriptions[$method] ?? 'Performed action');
        }

        return $descriptions[$method] ?? 'Performed action';
    }
}
