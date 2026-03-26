<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | OpenAI Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for OpenAI API integration used in AI-powered features
    | like document extraction, proposal generation, and content analysis.
    |
    */
    'openai' => [
        'api_key'       => env('OPENAI_API_KEY'),
        'organization'  => env('OPENAI_ORGANIZATION'),
        'default_model' => env('OPENAI_DEFAULT_MODEL', 'gpt-5'),
        'timeout'       => env('OPENAI_TIMEOUT', 60),
    ],

    /*
    |--------------------------------------------------------------------------
    | Anthropic / Claude Configuration
    |--------------------------------------------------------------------------
    |
    | Set ANTHROPIC_API_KEY in .env to switch the AI agent to Claude.
    | When present this takes priority over OPENAI_API_KEY.
    |
    */
    'anthropic' => [
        'api_key'       => env('ANTHROPIC_API_KEY'),
        'default_model' => env('ANTHROPIC_DEFAULT_MODEL', 'claude-sonnet-4-20250514'),
        'timeout'       => env('ANTHROPIC_TIMEOUT', 60),
    ],

    'mailgun' => [
        'domain'              => env('MAILGUN_DOMAIN'),
        'secret'              => env('MAILGUN_SECRET'),
        'endpoint'            => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme'              => 'https',
        'webhook_signing_key' => env('MAILGUN_WEBHOOK_SIGNING_KEY'),
    ],

    'stripe' => [
        'key'            => env('STRIPE_KEY'),
        'secret'         => env('STRIPE_SECRET'),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
    ],

];
