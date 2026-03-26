<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Paystack API Keys
    |--------------------------------------------------------------------------
    | From your Paystack dashboard → Settings → API Keys & Webhooks
    | Test keys start with pk_test_ / sk_test_
    | Live keys start with pk_live_ / sk_live_
    |
    | Add to .env:
    |   PAYSTACK_PUBLIC_KEY=pk_live_xxxx
    |   PAYSTACK_SECRET_KEY=sk_live_xxxx
    |   PAYSTACK_WEBHOOK_SECRET=your-webhook-secret  (set in dashboard)
    */
    'public_key'     => env('PAYSTACK_PUBLIC_KEY'),
    'secret_key'     => env('PAYSTACK_SECRET_KEY'),
    'webhook_secret' => env('PAYSTACK_WEBHOOK_SECRET'),

    /*
    |--------------------------------------------------------------------------
    | Paystack API Base URL
    |--------------------------------------------------------------------------
    */
    'base_url' => 'https://api.paystack.co',

    /*
    |--------------------------------------------------------------------------
    | Currency
    |--------------------------------------------------------------------------
    | Paystack supports: NGN, GHS, ZAR, KES, USD
    | Amount is always in the smallest unit (kobo, pesewas, cents).
    | For KES: 1 KES = 100 cents → multiply by 100
    */
    'currency' => env('PAYSTACK_CURRENCY', 'KES'),

    /*
    |--------------------------------------------------------------------------
    | Plan Codes
    |--------------------------------------------------------------------------
    | Create these plans in your Paystack dashboard:
    |   https://dashboard.paystack.com/#/plans
    |
    | Each plan has a code like: PLN_xxxxxxxxxxxx
    | Create monthly and annual variants for each tier.
    |
    | Pricing (in KES, Paystack accepts KES):
    |   Starter:    KES 3,800/mo  (≈ $29)
    |   Growth:     KES 10,400/mo (≈ $79)
    |   Enterprise: KES 26,200/mo (≈ $199)
    |
    | Or price in USD if your customers are international.
    */
    'plans' => [
        'starter' => [
            'monthly' => env('PAYSTACK_PLAN_STARTER_MONTHLY', 'PLN_starter_monthly'),
            'annual'  => env('PAYSTACK_PLAN_STARTER_ANNUAL',  'PLN_starter_annual'),
        ],
        'growth' => [
            'monthly' => env('PAYSTACK_PLAN_GROWTH_MONTHLY', 'PLN_growth_monthly'),
            'annual'  => env('PAYSTACK_PLAN_GROWTH_ANNUAL',  'PLN_growth_annual'),
        ],
        'enterprise' => [
            'monthly' => env('PAYSTACK_PLAN_ENTERPRISE_MONTHLY', 'PLN_enterprise_monthly'),
            'annual'  => env('PAYSTACK_PLAN_ENTERPRISE_ANNUAL',  'PLN_enterprise_annual'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Callback URL
    |--------------------------------------------------------------------------
    | After payment, Paystack redirects the user here.
    | This route verifies the transaction and activates the subscription.
    */
    'callback_url' => env('PAYSTACK_CALLBACK_URL', '/subscription/paystack/callback'),

];
