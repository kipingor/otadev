<?php

namespace App\Services\Tenant;

use App\Models\Module;
use App\Models\Subscription;
use App\Models\Tenant;
use Illuminate\Support\Facades\Log;
use Stripe\StripeClient;

/**
 * SubscriptionService
 *
 * Wraps Stripe operations for plan upgrades, cancellations, and
 * webhook event processing.
 *
 * Requires in .env:
 *   STRIPE_KEY=pk_live_...
 *   STRIPE_SECRET=sk_live_...
 *   STRIPE_WEBHOOK_SECRET=whsec_...
 *
 * And in config/services.php:
 *   'stripe' => [
 *       'key'            => env('STRIPE_KEY'),
 *       'secret'         => env('STRIPE_SECRET'),
 *       'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
 *   ],
 *
 * Also add to composer.json: "stripe/stripe-php": "^13.0"
 */
class SubscriptionService
{
    private StripeClient $stripe;

    // Stripe Price IDs — populate these after creating products in Stripe dashboard
    private const PRICE_IDS = [
        'starter'    => ['monthly' => 'price_starter_monthly',    'annual' => 'price_starter_annual'],
        'growth'     => ['monthly' => 'price_growth_monthly',     'annual' => 'price_growth_annual'],
        'enterprise' => ['monthly' => 'price_enterprise_monthly', 'annual' => 'price_enterprise_annual'],
    ];

    public function __construct()
    {
        $this->stripe = new StripeClient(config('services.stripe.secret'));
    }

    /**
     * Upgrade a tenant to a paid plan.
     *
     * Creates or updates the Stripe subscription, then updates the local
     * Subscription + Tenant records and enables the appropriate modules.
     */
    public function upgrade(
        Tenant $tenant,
        string $plan,
        string $billingCycle,
        string $paymentMethodId,
        array  $moduleKeys = [],
    ): Subscription {
        $priceId = self::PRICE_IDS[$plan][$billingCycle]
            ?? throw new \InvalidArgumentException("Unknown plan/cycle: {$plan}/{$billingCycle}");

        // ── Stripe: ensure customer exists ────────────────────────────────────
        $customerId = $tenant->stripe_customer_id;
        if (!$customerId) {
            $customer   = $this->stripe->customers->create([
                'email'    => $tenant->email,
                'name'     => $tenant->name,
                'metadata' => ['tenant_id' => $tenant->id],
            ]);
            $customerId = $customer->id;
            $tenant->update(['stripe_customer_id' => $customerId]);
        }

        // ── Stripe: attach payment method ─────────────────────────────────────
        $this->stripe->paymentMethods->attach($paymentMethodId, ['customer' => $customerId]);
        $this->stripe->customers->update($customerId, [
            'invoice_settings' => ['default_payment_method' => $paymentMethodId],
        ]);

        // ── Stripe: create or update subscription ─────────────────────────────
        $localSub = $tenant->subscription;

        if ($localSub?->stripe_subscription_id) {
            $stripeSub = $this->stripe->subscriptions->update(
                $localSub->stripe_subscription_id,
                ['items' => [['price' => $priceId]]]
            );
        } else {
            $stripeSub = $this->stripe->subscriptions->create([
                'customer' => $customerId,
                'items'    => [['price' => $priceId]],
                'metadata' => ['tenant_id' => $tenant->id],
            ]);
        }

        // ── Local: update subscription record ─────────────────────────────────
        $amount = Subscription::monthlyPriceFor($plan);
        if ($billingCycle === 'annual') {
            $amount = Subscription::annualPriceFor($plan);
        }

        $subscription = Subscription::updateOrCreate(
            ['tenant_id' => $tenant->id],
            [
                'stripe_subscription_id' => $stripeSub->id,
                'stripe_price_id'        => $priceId,
                'plan'                   => $plan,
                'billing_cycle'          => $billingCycle,
                'status'                 => 'active',
                'max_users'              => match ($plan) {
                    'starter' => 5, 'growth' => 15, default => 9999,
                },
                'amount'                 => $amount,
                'current_period_start'   => now(),
                'current_period_end'     => $billingCycle === 'annual' ? now()->addYear() : now()->addMonth(),
            ]
        );

        // ── Local: upgrade tenant plan ────────────────────────────────────────
        $tenant->upgradeToPlan($plan);

        // ── Enable requested modules (or all plan-available modules) ──────────
        $modulesToEnable = !empty($moduleKeys)
            ? Module::whereIn('key', $moduleKeys)->where('is_active', true)->get()
            : Module::whereJsonContains('plan_availability', $plan)->where('is_active', true)->get();

        foreach ($modulesToEnable as $module) {
            $tenant->enableModule($module->key);
        }

        return $subscription;
    }

    /** Cancel at period end (Stripe will send a webhook when it actually ends) */
    public function cancel(Tenant $tenant): void
    {
        $sub = $tenant->subscription;

        if ($sub?->stripe_subscription_id) {
            $this->stripe->subscriptions->update($sub->stripe_subscription_id, [
                'cancel_at_period_end' => true,
            ]);
        }

        $sub?->update([
            'status'       => 'cancelled',
            'cancelled_at' => now(),
        ]);
    }

    /** Generate a Stripe billing portal URL for self-service billing management */
    public function getBillingPortalUrl(Tenant $tenant, string $returnUrl): string
    {
        $session = $this->stripe->billingPortal->sessions->create([
            'customer'   => $tenant->stripe_customer_id,
            'return_url' => $returnUrl,
        ]);

        return $session->url;
    }

    /**
     * Handle incoming Stripe webhook events.
     * Called from SubscriptionController::stripeWebhook() after signature verification.
     */
    public function handleStripeWebhook(\Stripe\Event $event): void
    {
        match ($event->type) {
            'customer.subscription.updated' => $this->onSubscriptionUpdated($event->data->object),
            'customer.subscription.deleted' => $this->onSubscriptionDeleted($event->data->object),
            'invoice.payment_failed'        => $this->onPaymentFailed($event->data->object),
            'invoice.payment_succeeded'     => $this->onPaymentSucceeded($event->data->object),
            default                         => Log::info('Unhandled Stripe webhook', ['type' => $event->type]),
        };
    }

    // ── Webhook handlers ──────────────────────────────────────────────────────

    private function onSubscriptionUpdated(\Stripe\Subscription $stripeSub): void
    {
        $sub = Subscription::where('stripe_subscription_id', $stripeSub->id)->first();
        if (!$sub) {
            return;
        }

        $sub->update([
            'status'               => $stripeSub->status,
            'current_period_start' => \Carbon\Carbon::createFromTimestamp($stripeSub->current_period_start),
            'current_period_end'   => \Carbon\Carbon::createFromTimestamp($stripeSub->current_period_end),
        ]);
    }

    private function onSubscriptionDeleted(\Stripe\Subscription $stripeSub): void
    {
        $sub = Subscription::where('stripe_subscription_id', $stripeSub->id)->first();
        if (!$sub) {
            return;
        }

        $tenant = $sub->tenant;

        // Downgrade to free
        $sub->update(['status' => 'cancelled', 'plan' => 'free']);
        $tenant->upgradeToPlan('free');

        // Disable all paid modules
        $tenant->modules()->wherePivot('is_enabled', true)->each(function ($module) use ($tenant) {
            if (!$module->is_free) {
                $tenant->disableModule($module->key);
            }
        });
    }

    private function onPaymentFailed(\Stripe\Invoice $invoice): void
    {
        $sub = Subscription::where('stripe_subscription_id', $invoice->subscription)->first();
        $sub?->update(['status' => 'past_due']);
    }

    private function onPaymentSucceeded(\Stripe\Invoice $invoice): void
    {
        $sub = Subscription::where('stripe_subscription_id', $invoice->subscription)->first();
        if ($sub && $sub->status === 'past_due') {
            $sub->update(['status' => 'active']);
        }
    }

    // ── Plan details (for UI) ─────────────────────────────────────────────────

    public function getPlanDetails(): array
    {
        return app(TenantService::class)->getPlanComparison();
    }
}
