<?php

namespace App\Services\Tenant;

use App\Models\Module;
use App\Models\Subscription;
use App\Models\Tenant;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * PaystackService
 *
 * Handles all Paystack API interactions for subscription billing.
 *
 * ── FLOW ─────────────────────────────────────────────────────────────────────
 *
 * 1. User clicks "Upgrade to Starter" on /subscription/plans
 * 2. POST /subscription/upgrade → initializeTransaction()
 *    → Backend calls Paystack to get an authorization_url
 *    → User is redirected to Paystack checkout page
 * 3. User pays on Paystack (card, bank transfer, MPESA, etc.)
 * 4. Paystack redirects to GET /subscription/paystack/callback
 *    → Backend calls verifyTransaction() with the reference
 *    → If successful: update Subscription + Tenant records, enable modules
 * 5. Paystack also sends a webhook (POST /subscription/webhook/paystack)
 *    → Handles renewals, failures, cancellations asynchronously
 *
 * ── RECURRING BILLING ────────────────────────────────────────────────────────
 *
 * When initializing with a plan_code, Paystack automatically handles
 * recurring charges. The subscription_code from the webhook is stored locally
 * for cancellation purposes.
 *
 * ── AMOUNTS ──────────────────────────────────────────────────────────────────
 *
 * Paystack amounts are in the smallest currency unit:
 *   KES 29 = 2900 (kobo/cents)
 *   USD 29 = 2900 (cents)
 *
 * ── .env KEYS REQUIRED ───────────────────────────────────────────────────────
 *   PAYSTACK_PUBLIC_KEY=pk_live_xxxx
 *   PAYSTACK_SECRET_KEY=sk_live_xxxx
 *   PAYSTACK_WEBHOOK_SECRET=your-secret
 *   PAYSTACK_CURRENCY=KES
 *   PAYSTACK_PLAN_STARTER_MONTHLY=PLN_xxxx
 *   PAYSTACK_PLAN_GROWTH_MONTHLY=PLN_xxxx
 *   PAYSTACK_PLAN_ENTERPRISE_MONTHLY=PLN_xxxx
 *   PAYSTACK_CALLBACK_URL=https://yourdomain.com/subscription/paystack/callback
 */
class PaystackService
{
    private string $secretKey;
    private string $baseUrl;

    private const PLAN_LIMITS = [
        'starter'    => ['max_users' => 5,    'max_modules' => 3,    'amount' => 29],
        'growth'     => ['max_users' => 15,   'max_modules' => 9999, 'amount' => 79],
        'enterprise' => ['max_users' => 9999, 'max_modules' => 9999, 'amount' => 199],
    ];

    public function __construct()
    {
        $this->secretKey = config('paystack.secret_key');
        $this->baseUrl   = config('paystack.base_url', 'https://api.paystack.co');
    }

    // ── 1. Initialize a payment ───────────────────────────────────────────────

    /**
     * Initialize a Paystack transaction.
     *
     * Returns an authorization_url to redirect the user to, plus the reference
     * to store for verification after callback.
     *
     * @return array{authorization_url: string, reference: string, access_code: string}
     * @throws \RuntimeException if the API call fails
     */
    public function initializeTransaction(
        Tenant $tenant,
        string $plan,
        string $billingCycle = 'monthly'
    ): array {
        $planCode = config("paystack.plans.{$plan}.{$billingCycle}");
        $limits   = self::PLAN_LIMITS[$plan] ?? throw new \InvalidArgumentException("Unknown plan: {$plan}");
        $currency = config('paystack.currency', 'KES');

        // Amount in smallest unit (multiply by 100)
        $amount = $limits['amount'] * 100;

        // Unique reference per transaction attempt
        $reference = 'SUB-' . strtoupper(Str::random(12)) . '-' . time();

        $payload = [
            'email'        => $tenant->email,
            'amount'       => $amount,
            'currency'     => $currency,
            'reference'    => $reference,
            'callback_url' => url(config('paystack.callback_url')) . "?plan={$plan}&cycle={$billingCycle}&tenant={$tenant->id}",
            'metadata'     => [
                'tenant_id'     => $tenant->id,
                'tenant_name'   => $tenant->name,
                'plan'          => $plan,
                'billing_cycle' => $billingCycle,
                'cancel_action' => url('/subscription/plans'),
            ],
        ];

        // Attach plan_code for recurring billing if not a one-off payment
        if ($planCode && !str_contains($planCode, 'PLN_')) {
            Log::warning("Paystack plan code not configured for {$plan}/{$billingCycle}. Charging one-off.");
        } elseif ($planCode) {
            $payload['plan'] = $planCode;
        }

        $response = $this->post('/transaction/initialize', $payload);

        return [
            'authorization_url' => $response['data']['authorization_url'],
            'reference'         => $response['data']['reference'],
            'access_code'       => $response['data']['access_code'],
        ];
    }

    // ── 2. Verify after callback ──────────────────────────────────────────────

    /**
     * Verify a transaction after the user returns from Paystack checkout.
     *
     * Must be called with the reference from the callback URL.
     * Returns the transaction data if successful.
     *
     * @throws \RuntimeException if payment was not successful
     */
    public function verifyTransaction(string $reference): array
    {
        $response = $this->get("/transaction/verify/{$reference}");

        $data   = $response['data'];
        $status = $data['status'] ?? 'failed';

        if ($status !== 'success') {
            throw new \RuntimeException("Payment not successful. Status: {$status}");
        }

        return $data;
    }

    /**
     * Activate a subscription after successful payment verification.
     *
     * Updates the local Subscription + Tenant records, enables modules.
     */
    public function activateSubscription(
        Tenant $tenant,
        string $plan,
        string $billingCycle,
        array  $transactionData
    ): Subscription {
        $limits = self::PLAN_LIMITS[$plan];

        // Paystack customer code for future charges / cancellations
        $paystackCustomerCode    = $transactionData['customer']['customer_code'] ?? null;
        $paystackSubscriptionCode= $transactionData['plan_object']['subscriptions'][0]['subscription_code'] ?? null;
        $periodEnd = match($billingCycle) {
            'annual'  => now()->addYear(),
            default   => now()->addMonth(),
        };

        // Update or create local subscription record
        $subscription = Subscription::updateOrCreate(
            ['tenant_id' => $tenant->id],
            [
                'plan'                  => $plan,
                'status'                => 'active',
                'billing_cycle'         => $billingCycle,
                'amount'                => $limits['amount'],
                'currency'              => strtoupper(config('paystack.currency', 'KES')),
                'max_users'             => $limits['max_users'],
                'paystack_customer_code'  => $paystackCustomerCode,
                'paystack_subscription_code' => $paystackSubscriptionCode,
                'current_period_end'    => $periodEnd,
                'trial_ends_at'         => null,
            ]
        );

        // Update tenant plan limits
        $tenant->update([
            'plan'        => $plan,
            'status'      => 'active',
            'max_users'   => $limits['max_users'],
            'max_modules' => $limits['max_modules'],
        ]);

        // Enable all modules allowed for this plan
        $this->enableModulesForPlan($tenant, $plan);

        Log::info("Subscription activated: {$tenant->name} → {$plan}/{$billingCycle}", [
            'tenant_id' => $tenant->id,
            'reference' => $transactionData['reference'] ?? null,
        ]);

        return $subscription;
    }

    // ── 3. Cancel subscription ────────────────────────────────────────────────

    /**
     * Cancel a Paystack subscription (stops recurring charges).
     * Downgrades the tenant to free at the end of the billing period.
     */
    public function cancel(Tenant $tenant): void
    {
        $subscription = $tenant->subscription;

        // Cancel recurring billing on Paystack
        if ($subscription?->paystack_subscription_code) {
            try {
                $this->post('/subscription/disable', [
                    'code'  => $subscription->paystack_subscription_code,
                    'token' => $subscription->paystack_email_token ?? '',
                ]);
            } catch (\Throwable $e) {
                Log::error('Failed to cancel Paystack subscription', [
                    'tenant_id' => $tenant->id,
                    'error'     => $e->getMessage(),
                ]);
                // Don't rethrow — still mark as cancelled locally
            }
        }

        // Update local records
        $subscription?->update([
            'status'     => 'cancelled',
            'cancelled_at' => now(),
        ]);

        Log::info("Subscription cancelled: {$tenant->name}", ['tenant_id' => $tenant->id]);
    }

    // ── 4. Webhook handling ───────────────────────────────────────────────────

    /**
     * Verify the Paystack webhook signature.
     *
     * Paystack signs webhooks with HMAC-SHA512 using your secret key.
     * The signature is in the x-paystack-signature header.
     */
    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        $expectedSignature = hash_hmac(
            'sha512',
            $payload,
            config('paystack.secret_key') // Note: uses secret_key, NOT webhook_secret
        );

        return hash_equals($expectedSignature, $signature);
    }

    /**
     * Handle Paystack webhook events.
     *
     * Key events:
     *   charge.success           → payment completed (one-off or subscription renewal)
     *   subscription.create      → new subscription activated
     *   subscription.disable     → subscription cancelled
     *   invoice.payment_failed   → recurring charge failed
     *   invoice.update           → invoice paid/updated
     */
    public function handleWebhook(array $event): void
    {
        $eventType = $event['event'] ?? '';
        $data      = $event['data'] ?? [];

        Log::info("Paystack webhook: {$eventType}", ['reference' => $data['reference'] ?? null]);

        match ($eventType) {
            'charge.success'       => $this->handleChargeSuccess($data),
            'subscription.create'  => $this->handleSubscriptionCreated($data),
            'subscription.disable' => $this->handleSubscriptionDisabled($data),
            'invoice.payment_failed' => $this->handlePaymentFailed($data),
            default                => null, // Unhandled event — ignore
        };
    }

    // ── 5. Plan details ───────────────────────────────────────────────────────

    public function getPlanDetails(): array
    {
        $currency = strtoupper(config('paystack.currency', 'KES'));

        return [
            [
                'key'           => 'free',
                'name'          => 'Free',
                'price_monthly' => 0,
                'price_annual'  => 0,
                'currency'      => $currency,
                'max_users'     => 1,
                'max_modules'   => 1,
                'features'      => ['1 user seat', '1 free module', '14-day full trial'],
                'cta'           => 'Current Plan',
                'highlighted'   => false,
            ],
            [
                'key'           => 'starter',
                'name'          => 'Starter',
                'price_monthly' => 29,
                'price_annual'  => round(29 * 12 * 0.8),
                'currency'      => 'USD',
                'max_users'     => 5,
                'max_modules'   => 3,
                'features'      => ['Up to 5 users', 'Any 3 modules', 'Email support', 'Basic analytics'],
                'cta'           => 'Upgrade to Starter',
                'highlighted'   => false,
                'plan_codes'    => config('paystack.plans.starter'),
            ],
            [
                'key'           => 'growth',
                'name'          => 'Growth',
                'price_monthly' => 79,
                'price_annual'  => round(79 * 12 * 0.8),
                'currency'      => 'USD',
                'max_users'     => 15,
                'max_modules'   => 9999,
                'features'      => ['Up to 15 users', 'All 10 modules', 'Priority support', 'Advanced analytics'],
                'cta'           => 'Upgrade to Growth',
                'highlighted'   => true,
                'plan_codes'    => config('paystack.plans.growth'),
            ],
            [
                'key'           => 'enterprise',
                'name'          => 'Enterprise',
                'price_monthly' => 199,
                'price_annual'  => round(199 * 12 * 0.8),
                'currency'      => 'USD',
                'max_users'     => 9999,
                'max_modules'   => 9999,
                'features'      => ['Unlimited users', 'All modules + HR', 'Dedicated support', 'SLA guarantee'],
                'cta'           => 'Contact Sales',
                'highlighted'   => false,
            ],
        ];
    }

    // ── Private: webhook handlers ─────────────────────────────────────────────

    private function handleChargeSuccess(array $data): void
    {
        $metadata = $data['metadata'] ?? [];
        $tenantId = $metadata['tenant_id'] ?? null;

        if (!$tenantId) return;

        $tenant = \App\Models\Tenant::find($tenantId);
        if (!$tenant) return;

        $plan          = $metadata['plan'] ?? null;
        $billingCycle  = $metadata['billing_cycle'] ?? 'monthly';

        if ($plan && isset(self::PLAN_LIMITS[$plan])) {
            $this->activateSubscription($tenant, $plan, $billingCycle, $data);
        }
    }

    private function handleSubscriptionCreated(array $data): void
    {
        // Subscription is already activated by handleChargeSuccess
        // Just update the subscription_code if we have it
        $customerCode = $data['customer']['customer_code'] ?? null;
        if (!$customerCode) return;

        Subscription::where('paystack_customer_code', $customerCode)->update([
            'paystack_subscription_code' => $data['subscription_code'] ?? null,
            'paystack_email_token'       => $data['email_token'] ?? null,
        ]);
    }

    private function handleSubscriptionDisabled(array $data): void
    {
        $subscriptionCode = $data['subscription_code'] ?? null;
        if (!$subscriptionCode) return;

        $subscription = Subscription::where('paystack_subscription_code', $subscriptionCode)->first();
        if (!$subscription) return;

        $subscription->update(['status' => 'cancelled', 'cancelled_at' => now()]);

        Log::info('Paystack subscription disabled via webhook', [
            'subscription_code' => $subscriptionCode,
        ]);
    }

    private function handlePaymentFailed(array $data): void
    {
        $subscriptionCode = $data['subscription']['subscription_code'] ?? null;
        if (!$subscriptionCode) return;

        $subscription = Subscription::where('paystack_subscription_code', $subscriptionCode)->first();
        $subscription?->update(['status' => 'past_due']);

        Log::warning('Paystack payment failed', ['subscription_code' => $subscriptionCode]);
    }

    // ── Private: module enablement ────────────────────────────────────────────

    private function enableModulesForPlan(Tenant $tenant, string $plan): void
    {
        $limits = self::PLAN_LIMITS[$plan];

        if ($limits['max_modules'] === 9999) {
            // Enable all modules
            Module::where('is_active', true)->each(fn ($m) => $tenant->enableModule($m->key));
        }
        // For starter (max 3): keep existing enabled modules — user can pick via settings
        // Don't remove modules they already have
    }

    // ── HTTP helpers ──────────────────────────────────────────────────────────

    private function post(string $endpoint, array $data): array
    {
        $response = Http::withToken($this->secretKey)
            ->acceptJson()
            ->post($this->baseUrl . $endpoint, $data);

        if (!$response->successful()) {
            $error = $response->json('message') ?? $response->body();
            throw new \RuntimeException("Paystack API error ({$endpoint}): {$error}");
        }

        $body = $response->json();

        if (!($body['status'] ?? false)) {
            throw new \RuntimeException("Paystack error: " . ($body['message'] ?? 'Unknown error'));
        }

        return $body;
    }

    private function get(string $endpoint): array
    {
        $response = Http::withToken($this->secretKey)
            ->acceptJson()
            ->get($this->baseUrl . $endpoint);

        if (!$response->successful()) {
            $error = $response->json('message') ?? $response->body();
            throw new \RuntimeException("Paystack API error ({$endpoint}): {$error}");
        }

        $body = $response->json();

        if (!($body['status'] ?? false)) {
            throw new \RuntimeException("Paystack error: " . ($body['message'] ?? 'Unknown error'));
        }

        return $body;
    }
}
