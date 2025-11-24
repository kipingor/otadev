<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;
use Exception;

class OpenAIClient
{
    private string $apiKey;
    private string $baseUrl;
    private string $model;

    public function __construct()
    {
        $this->apiKey = config('services.openai.key');
        $this->baseUrl = config('services.openai.base_url', 'https://api.openai.com/v1');
        $this->model = config('services.openai.model', 'gpt-4');
    }

    /**
     * Generic text-generation wrapper.
     *
     * @param string $prompt The user prompt for the AI.
     * @param array $options Optional OpenAI parameters (merged into payload).
     * @return string
     * @throws Exception
     */
    public function generate(string $prompt, array $options = []): string
    {
        $payload = array_merge_recursive([
            'model' => $this->model,
            'messages' => [
                [
                    'role' => 'user',
                    'content' => $prompt,
                ],
            ],
            'temperature' => 0.2,
            'max_tokens' => 2048,
        ], $options);

        $response = Http::withToken($this->apiKey)
            ->timeout(60)
            ->post($this->baseUrl . '/chat/completions', $payload);

        if (!$response->successful()) {
            throw new Exception('AI request failed: ' . $response->body());
        }

        $result = $response->json();

        if (
            !isset($result['choices'][0]['message']['content']) ||
            empty($result['choices'][0]['message']['content'])
        ) {
            throw new Exception('AI returned no choices or no message content.');
        }

        return trim($result['choices'][0]['message']['content']);
    }
}