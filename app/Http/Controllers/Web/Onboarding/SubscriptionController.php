<?php

namespace App\Http\Controllers\Web\Onboarding;

use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Models\Subscription;
use App\Services\Tenant\PaystackService;
use App\Services\Tenant\TenantService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

/**
 * SubscriptionController
 *
 * Handles plan upgrades via Paystack (replaces Stripe).
 *
 * Routes to add to web.php:
 *   GET  /subscription/paystack/callback → paystackCallback
 *   POST /subscription/webhook/paystack  → paystackWebhook  (no auth)
 *
 * ── PAYSTACK FLOW ─────────────────────────────────────────────────────────────
 *
 * 1. POST /subscription/upgrade  → initializeTransaction → redirect to Paystack
 * 2. User pays on Paystack checkout page
 * 3. GET  /subscription/paystack/callback?reference=xxx → verify + activate
 * 4. POST /subscription/webhook/paystack → handle renewals/failures async
 *
 * ── SETUP STEPS ──────────────────────────────────────────────────────────────
 *
 * 1. Create an account at https://dashboard.paystack.com
 * 2. Create subscription plans for Starter, Growth, Enterprise (monthly + annual)
 * 3. Copy plan codes to .env:
 *    PAYSTACK_PUBLIC_KEY=pk_live_xxx
 *    PAYSTACK_SECRET_KEY=sk_live_xxx
 *    PAYSTACK_PLAN_STARTER_MONTHLY=PLN_xxx
 *    PAYSTACK_PLAN_GROWTH_MONTHLY=PLN_xxx
 *    PAYSTACK_PLAN_ENTERPRISE_MONTHLY=PLN_xxx
 * 4. Register webhook URL in dashboard:
 *    https://yourdomain.com/subscription/webhook/paystack
 * 5. Register callback URL:
 *    https://yourdomain.com/subscription/paystack/callback
 */
class SubscriptionController extends Controller
{
    public function __construct(
        protected PaystackService $paystackService,
        protected TenantService   $tenantService,
    ) {}

    // ── Plan listing page ─────────────────────────────────────────────────────

    public function plans(Request $request): Response
    {
        $tenant   = $request->attributes->get('current_tenant');
        $allModules = Module::where('is_active', true)->orderBy('sort_order')->get();

        return Inertia::render('subscription/plans', [
            'tenant'          => $tenant,
            'subscription'    => $tenant?->subscription,
            'plans'           => $this->paystackService->getPlanDetails(),
            'all_modules'     => $allModules,
            'enabled_modules' => $tenant?->enabledModules->pluck('key'),
            'paystack_public_key' => config('paystack.public_key'),
        ]);
    }

    // ── Step 1: Initiate upgrade → redirect to Paystack ──────────────────────

    public function upgrade(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'plan'          => ['required', 'in:starter,growth,enterprise'],
            'billing_cycle' => ['required', 'in:monthly,annual'],
        ]);

        $tenant = $request->attributes->get('current_tenant');

        if ($data['plan'] === 'enterprise') {
            return redirect()->away('mailto:hello@otadevelopment.com?subject=Enterprise Plan Enquiry');
        }

        try {
            $transaction = $this->paystackService->initializeTransaction(
                tenant:       $tenant,
                plan:         $data['plan'],
                billingCycle: $data['billing_cycle'],
            );

            // Store reference in session for verification
            session(['paystack_reference' => $transaction['reference']]);

            // Redirect user to Paystack checkout
            return redirect()->away($transaction['authorization_url']);

        } catch (\Exception $e) {
            Log::error('Paystack initialization failed', [
                'tenant_id' => $tenant->id,
                'error'     => $e->getMessage(),
            ]);
            return back()->with('error', 'Payment setup failed: ' . $e->getMessage());
        }
    }

    // ── Step 2: Callback after payment ───────────────────────────────────────

    /**
     * Paystack redirects here after checkout (success or failure).
     * Route: GET /subscription/paystack/callback
     */
    public function paystackCallback(Request $request): RedirectResponse
    {
        $reference = $request->get('reference')
            ?? session('paystack_reference');
        $plan         = $request->get('plan', 'starter');
        $billingCycle = $request->get('cycle', 'monthly');
        $tenantId     = $request->get('tenant');

        if (!$reference) {
            return redirect()->route('subscription.plans')
                ->with('error', 'Payment reference missing. Please try again.');
        }

        try {
            $transactionData = $this->paystackService->verifyTransaction($reference);

            $tenant = \App\Models\Tenant::findOrFail($tenantId ?? request()->user()?->current_tenant_id);

            $this->paystackService->activateSubscription(
                tenant:          $tenant,
                plan:            $plan,
                billingCycle:    $billingCycle,
                transactionData: $transactionData,
            );

            session()->forget('paystack_reference');

            return redirect()->route('web.dashboard')
                ->with('success', "🎉 You're now on the {$plan} plan! All features have been unlocked.");

        } catch (\Exception $e) {
            Log::error('Paystack callback verification failed', [
                'reference' => $reference,
                'error'     => $e->getMessage(),
            ]);

            return redirect()->route('subscription.plans')
                ->with('error', 'Payment could not be confirmed: ' . $e->getMessage());
        }
    }

    // ── Cancel subscription ───────────────────────────────────────────────────

    public function cancel(Request $request): RedirectResponse
    {
        $tenant = $request->attributes->get('current_tenant');

        try {
            $this->paystackService->cancel($tenant);
        } catch (\Exception $e) {
            return back()->with('error', 'Cancellation failed: ' . $e->getMessage());
        }

        return redirect()->route('subscription.plans')
            ->with('info', 'Your subscription has been cancelled. You can continue using the app until the end of your billing period.');
    }

    // ── Paystack webhook ──────────────────────────────────────────────────────

    /**
     * Route: POST /subscription/webhook/paystack  (no auth middleware)
     * Register this URL in your Paystack dashboard:
     *   https://dashboard.paystack.com → Settings → API Keys & Webhooks
     */
    public function paystackWebhook(Request $request): HttpResponse
    {
        $payload   = $request->getContent();
        $signature = $request->header('x-paystack-signature', '');

        // Verify the request came from Paystack
        if (!$this->paystackService->verifyWebhookSignature($payload, $signature)) {
            Log::warning('Invalid Paystack webhook signature');
            return response('Invalid signature.', 400);
        }

        $event = json_decode($payload, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return response('Invalid JSON.', 400);
        }

        try {
            $this->paystackService->handleWebhook($event);
        } catch (\Exception $e) {
            Log::error('Paystack webhook processing error', [
                'event' => $event['event'] ?? 'unknown',
                'error' => $e->getMessage(),
            ]);
            // Return 200 so Paystack doesn't retry indefinitely
            return response('Webhook processed with errors.', 200);
        }

        return response('Webhook handled.', 200);
    }

    // ── Status pages ──────────────────────────────────────────────────────────

    public function expired(): Response
    {
        return Inertia::render('subscription/expired', [
            'plans' => $this->paystackService->getPlanDetails(),
        ]);
    }

    public function suspended(): Response
    {
        return Inertia::render('subscription/suspended');
    }

    public function billing(Request $request): RedirectResponse
    {
        // Paystack doesn't have a hosted billing portal like Stripe.
        // Direct users to the plans page to manage their subscription.
        return redirect()->route('subscription.plans')
            ->with('info', 'Manage your subscription below. To cancel, click "Cancel Plan".');
    }
}