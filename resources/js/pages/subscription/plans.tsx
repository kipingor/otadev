import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { CheckCircle2, Zap, Lock, Star, Users, Loader2, XCircle } from 'lucide-react';
import { useState } from 'react';
import type { TenantData, SubscriptionData, PlanDetail, Module, ModuleKey } from '@/types/tenant';
import type { BreadcrumbItem } from '@/types';

interface Props {
    tenant: TenantData | null;
    subscription: SubscriptionData | null;
    plans: PlanDetail[];
    all_modules: Module[];
    enabled_modules: ModuleKey[];
    paystack_public_key: string; // passed but not used in redirect flow
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Subscription', href: '/subscription/plans' },
    { title: 'Plans', href: '/subscription/plans' },
];

const MODULE_LABELS: Record<string, string> = {
    leads: 'Lead Management',      pipeline: 'Pipeline & Kanban',
    contacts: 'Contact Management', opportunities: 'Opportunities',
    projects: 'Project Management', accounting: 'Invoices & Accounting',
    clients: 'Client CRM',          analytics: 'Analytics',
    supply_chain: 'Supply Chain',   hr: 'HR & Leave',
};

export default function SubscriptionPlans({
    tenant, subscription, plans, all_modules, enabled_modules,
}: Props) {
    const [annual, setAnnual]     = useState(false);
    const [upgrading, setUpgrading] = useState<string | null>(null);
    const [cancelling, setCancelling] = useState(false);

    const currentPlan = tenant?.plan ?? 'free';

    function handleUpgrade(planKey: string) {
        if (planKey === 'enterprise') {
            window.location.href = 'mailto:hello@otadevelopment.com?subject=Enterprise Plan Enquiry';
            return;
        }
        if (planKey === currentPlan) return;

        setUpgrading(planKey);

        // POST to backend → backend calls Paystack → redirects user to checkout
        // No Stripe Elements / client-side JS needed — pure server-side redirect.
        router.post('/subscription/upgrade', {
            plan:          planKey,
            billing_cycle: annual ? 'annual' : 'monthly',
        }, {
            onFinish: () => setUpgrading(null),
        });
    }

    function handleCancel() {
        if (!confirm('Cancel your subscription? You can continue using the app until the end of your billing period.')) return;
        setCancelling(true);
        router.post('/subscription/cancel', {}, { onFinish: () => setCancelling(false) });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Subscription Plans" />

            <div className="p-6 max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">Choose your plan</h1>
                    <p className="text-muted-foreground">
                        Pay securely via Paystack — card, bank transfer, or M-Pesa.
                    </p>

                    {/* Annual toggle */}
                    <div className="flex items-center justify-center gap-3 pt-2">
                        <Label htmlFor="billing-toggle" className="text-sm">Monthly</Label>
                        <Switch id="billing-toggle" checked={annual} onCheckedChange={setAnnual} />
                        <Label htmlFor="billing-toggle" className="text-sm">
                            Annual
                            <Badge className="ml-1.5 bg-emerald-100 text-emerald-700 text-[10px]">Save 20%</Badge>
                        </Label>
                    </div>
                </div>

                {/* Current subscription status */}
                {subscription && currentPlan !== 'free' && (
                    <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
                        <div className="flex items-center gap-3">
                            <Star className="h-5 w-5 text-primary" />
                            <div>
                                <p className="font-semibold capitalize">
                                    {currentPlan} plan
                                    <Badge className="ml-2 capitalize" variant="outline">{subscription.status}</Badge>
                                </p>
                                {subscription.current_period_end && (
                                    <p className="text-xs text-muted-foreground">
                                        Renews {new Date(subscription.current_period_end).toLocaleDateString('en-US', {
                                            day: 'numeric', month: 'long', year: 'numeric',
                                        })}
                                    </p>
                                )}
                            </div>
                        </div>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={handleCancel}
                            disabled={cancelling}
                        >
                            {cancelling
                                ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                                : <XCircle className="h-4 w-4 mr-1.5" />
                            }
                            Cancel plan
                        </Button>
                    </div>
                )}

                {/* Plan cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {plans.map((plan) => {
                        const isCurrent  = currentPlan === plan.key;
                        const isUpgrade  = upgrading === plan.key;
                        const price      = annual ? Math.round(plan.price_monthly * 0.8) : plan.price_monthly;
                        const isFree     = plan.key === 'free';
                        const isEnterprise = plan.key === 'enterprise';

                        return (
                            <Card
                                key={plan.key}
                                className={cn(
                                    'relative flex flex-col p-5',
                                    plan.highlighted && 'border-primary shadow-lg ring-1 ring-primary/20',
                                    isCurrent && 'bg-primary/[0.02]',
                                )}
                            >
                                {plan.highlighted && (
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                                        <Badge className="bg-primary text-primary-foreground text-xs px-3">
                                            Most popular
                                        </Badge>
                                    </div>
                                )}

                                <div className="mb-4">
                                    <p className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                                        {plan.name}
                                    </p>
                                    <div className="flex items-baseline gap-1 mt-2">
                                        {isFree
                                            ? <span className="text-2xl font-bold">Free</span>
                                            : <>
                                                <span className="text-2xl font-bold">${price}</span>
                                                <span className="text-sm text-muted-foreground">/mo</span>
                                            </>
                                        }
                                    </div>
                                    {annual && !isFree && (
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            ${plan.price_monthly}/mo billed monthly
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {typeof plan.max_users === 'number'
                                            ? `${plan.max_users} user${plan.max_users > 1 ? 's' : ''}`
                                            : plan.max_users
                                        }
                                        {' · '}
                                        {typeof plan.max_modules === 'number' && plan.max_modules < 9999
                                            ? `${plan.max_modules} module${plan.max_modules > 1 ? 's' : ''}`
                                            : 'All modules'
                                        }
                                    </p>
                                </div>

                                <ul className="space-y-1.5 flex-1 mb-5">
                                    {plan.features.map(f => (
                                        <li key={f} className="flex items-start gap-2 text-sm">
                                            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                            <span className="text-muted-foreground">{f}</span>
                                        </li>
                                    ))}
                                </ul>

                                {isCurrent ? (
                                    <Button variant="outline" disabled className="w-full">
                                        <Zap className="h-3.5 w-3.5 mr-1.5" />
                                        Current plan
                                    </Button>
                                ) : isEnterprise ? (
                                    <Button variant="outline" className="w-full"
                                        onClick={() => handleUpgrade('enterprise')}>
                                        Contact sales
                                    </Button>
                                ) : isFree ? null : (
                                    <Button
                                        className="w-full"
                                        variant={plan.highlighted ? 'default' : 'outline'}
                                        onClick={() => handleUpgrade(plan.key)}
                                        disabled={!!upgrading}
                                    >
                                        {isUpgrade
                                            ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Redirecting to payment…</>
                                            : `Upgrade to ${plan.name}`
                                        }
                                    </Button>
                                )}
                            </Card>
                        );
                    })}
                </div>

                {/* Payment methods note */}
                <div className="text-center text-sm text-muted-foreground space-y-1">
                    <p className="flex items-center justify-center gap-2 flex-wrap">
                        <span>Secured by Paystack</span>
                        <span className="text-muted-foreground/40">·</span>
                        <span>💳 Card</span>
                        <span className="text-muted-foreground/40">·</span>
                        <span>🏦 Bank transfer</span>
                        <span className="text-muted-foreground/40">·</span>
                        <span>📱 M-Pesa</span>
                        <span className="text-muted-foreground/40">·</span>
                        <span>🇰🇪 KES, 🇺🇸 USD, 🇳🇬 NGN, 🇬🇭 GHS</span>
                    </p>
                    <p>All plans include a 14-day trial of Growth features. Cancel anytime.</p>
                </div>

                {/* Module comparison */}
                <div>
                    <h2 className="font-semibold text-lg mb-4">Module availability</h2>
                    <div className="rounded-xl border overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-muted/40 border-b">
                                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Module</th>
                                    {plans.map(p => (
                                        <th key={p.key} className="px-4 py-3 text-center font-medium text-muted-foreground capitalize">
                                            {p.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {all_modules.map(module => (
                                    <tr key={module.key} className="hover:bg-muted/20">
                                        <td className="px-4 py-2.5 font-medium">
                                            {MODULE_LABELS[module.key] ?? module.name}
                                            {module.is_free && (
                                                <Badge className="ml-2 bg-emerald-50 text-emerald-700 text-[10px]">Free</Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            {module.is_free
                                                ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                                                : <span className="text-muted-foreground/30">—</span>}
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            {['leads','pipeline','contacts','opportunities','projects','accounting','clients'].includes(module.key)
                                                ? <CheckCircle2 className="h-4 w-4 text-primary mx-auto" />
                                                : <span className="text-muted-foreground/30">—</span>}
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            <CheckCircle2 className="h-4 w-4 text-primary mx-auto" />
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            <CheckCircle2 className="h-4 w-4 text-primary mx-auto" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}