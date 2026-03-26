import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, Zap, RefreshCw } from 'lucide-react';
import type { PlanDetail } from '@/types/tenant';

interface ExpiredProps { plans: PlanDetail[] }

export function TrialExpiredPage({ plans }: ExpiredProps) {
    const growth = plans.find(p => p.key === 'growth');
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
            <Head title="Trial Expired" />
            <Card className="w-full max-w-md p-8 text-center space-y-5">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                    <AlertTriangle className="h-8 w-8 text-amber-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Your trial has ended</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Your 14-day trial is over. Upgrade to keep your data and continue working.
                        All your leads, projects, and invoices are safe and waiting.
                    </p>
                </div>
                {growth && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-left text-sm">
                        <p className="font-semibold">{growth.name} — ${growth.price_monthly}/month</p>
                        <ul className="mt-2 space-y-1 text-muted-foreground">
                            {growth.features.slice(0, 4).map(f => (
                                <li key={f} className="flex items-center gap-2">
                                    <span className="text-emerald-500">✓</span> {f}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <Button asChild size="lg" className="w-full">
                    <Link href="/subscription/plans">
                        <Zap className="h-4 w-4 mr-2" />
                        Choose a plan to continue
                    </Link>
                </Button>
                <p className="text-xs text-muted-foreground">
                    Need help?{' '}
                    <a href="mailto:support@yourapp.com" className="underline">Contact support</a>
                </p>
            </Card>
        </div>
    );
}

export function SuspendedPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
            <Head title="Workspace Suspended" />
            <Card className="w-full max-w-md p-8 text-center space-y-5">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Workspace suspended</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        This workspace has been suspended, usually due to a failed payment or
                        a billing issue. Please contact support to resolve this.
                    </p>
                </div>
                <Button asChild size="lg" className="w-full">
                    <a href="mailto:support@yourapp.com?subject=Workspace Suspended">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Contact support to reactivate
                    </a>
                </Button>
                <p className="text-xs text-muted-foreground">
                    Your data is safe and will be restored once the issue is resolved.
                </p>
            </Card>
        </div>
    );
}

// Default export for the expired page (route: subscription/expired)
export default TrialExpiredPage;
