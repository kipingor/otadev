<?php

namespace App\Services\AI;

use Exception;

class EmailDraftingService
{
    private OpenAIClient $client;

    public function __construct(OpenAIClient $client)
    {
        $this->client = $client;
    }

    /**
     * Draft an email given context and instructions
     *
     * @param string $context
     * @param string $instructions
     * @return string
     * @throws Exception
     */
    public function draftEmail(string $context, string $instructions): string
    {
        if (empty($context) && empty($instructions)) {
            throw new Exception("At least one of context or instructions are required to draft an email.");
        }

        $prompt = "Given the following information, draft a professional email.\n";
        if (!empty($context)) {
            $prompt .= "Context: {$context}\n";
        }
        if (!empty($instructions)) {
            $prompt .= "Instructions: {$instructions}";
        }

        try {
            $response = $this->client->generate($prompt, [
                'max_tokens' => 500,
                'temperature' => 0.7,
                'n' => 1,
                'stop' => null
            ]);
        } catch (Exception $e) {
            throw new Exception("Failed to generate email draft: " . $e->getMessage());
        }

        // Try both 'choices[0]["text"]' and raw string, in case API response changes
        if (is_array($response) && isset($response['choices'][0]['text'])) {
            return trim($response['choices'][0]['text']);
        } elseif (is_string($response)) {
            return trim($response);
        }

        throw new Exception("Did not receive a valid email draft from the AI service.");
    }
}
