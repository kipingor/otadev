<?php

namespace App\Services\AI;

interface OpenAIClientContract
{
    public function generate(string $prompt, array $options = []): string;
}
