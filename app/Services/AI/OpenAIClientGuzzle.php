<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;
use Exception;

class OpenAIClientGuzzle implements OpenAIClient
{
    protected string $apiKey;
    protected string $apiBase;
    protected string $model;

    public function __construct()
    {
        $this->apiKey = config('ai.api_key', env('OPENAI_API_KEY'));
        $this->apiBase = rtrim(config('ai.api_base', 'https://api.openai.com/v1'), '/');
        $this->model = config('ai.model', 'gpt-4o-mini');

        if (!$this->apiKey) {
            throw new Exception("Missing OpenAI API Key. Set OPENAI_API_KEY in your .env file.");
        }
    }

    /**
     * Generate text using the OpenAI API.
     *
     * @throws Exception
     */
    public function generate(string $prompt, array $options = []): string
    {
        $payload = [
            'model' => $this->model,
            'messages' => [
                ['role' => 'user', 'content' => $prompt]
            ],
            'max_tokens' => $options['max_tokens'] ?? 300,
            'temperature' => $options['temperature'] ?? 0.7,
        ];

        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(180)
                ->post($this->apiBase . '/chat/completions', $payload);

            if ($response->failed()) {
                throw new Exception("OpenAI API returned an error: " . $response->body());
            }

            $json = $response->json();

            return trim(
                $json['choices'][0]['message']['content']
                ?? $json['choices'][0]['text']
                ?? ''
            );
        } catch (\Throwable $e) {
            throw new Exception("OpenAI API call failed: " . $e->getMessage());
        }
    }
}
