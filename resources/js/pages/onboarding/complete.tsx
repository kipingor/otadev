import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Zap, ArrowRight, Users, Star } from 'lucide-react';
import type { TenantData, PlanDetail, ModuleKey } from '@/types/tenant';

interface Props {
    tenant: TenantData | null;
    enabled_modules: ModuleKey[];
    upgrade_plans: PlanDetail[];
}

export default function OnboardingComplete({ tenant, enabled_modules, upgrade_plans }: Props) {
    const highlightedPlan = upgrade_plans.find(p => p.highlighted);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
            <Head title="Workspace Ready!" />

            <div className="w-full max-w-xl space-y-6">
                {/* Step indicator */}
                <div className="flex items-center gap-2">
                    {['Workspace', 'Module', 'Done'].map((step, i) => (
                        <div key={step} className="flex flex-1 items-center gap-2">
                            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold
                                ${i < 2 ? 'bg-primary/20 text-primary' : 'bg-primary text-primary-foreground'}`}>
                                {i < 2 ? '✓' : '✓'}
                            </div>
                            <span className={`text-xs ${i === 2 ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                                {step}
                            </span>
                            {i < 2 && <div className="flex-1 h-px bg-primary/30" />}
                        </div>
                    ))}
                </div>

                {/* Success card */}
                <Card className="p-8 text-center space-y-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                        <CheckCircle2 className="h-9 w-9 text-emerald-600" />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold">You're all set, {tenant?.name}!</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Your workspace is ready. You have a 14-day trial of all features.
                        </p>
                    </div>

                    {/* Active module(s) */}
                    {enabled_modules.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-2">
                            {enabled_modules.map(key => (
                                <Badge key={key} className="bg-primary/10 text-primary capitalize">
                                    {key.replace('_', ' ')} ✓
                                </Badge>
                            ))}
                        </div>
                    )}

                    <Button asChild size="lg" className="w-full mt-2">
                        <Link href="/dashboard">
                            Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </Card>

                {/* Upgrade nudge */}
                {highlightedPlan && (
                    <Card className="p-5 border-primary/30 bg-primary/5">
                        <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                                <Star className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold">
                                    Unlock everything with {highlightedPlan.name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    ${highlightedPlan.price_monthly}/mo · {highlightedPlan.max_users} users · all modules
                                </p>
                                <ul className="mt-2 space-y-0.5">
                                    {highlightedPlan.features.slice(0, 3).map(f => (
                                        <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <Button asChild size="sm" className="flex-shrink-0">
                                <Link href="/subscription/plans">
                                    <Zap className="h-3.5 w-3.5 mr-1" />
                                    Upgrade
                                </Link>
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Invite team */}
                <div className="text-center text-sm text-muted-foreground">
                    <Users className="inline h-3.5 w-3.5 mr-1" />
                    Want to bring your team?{' '}
                    <Link href="/subscription/plans" className="text-primary hover:underline font-medium">
                        Upgrade to add more users
                    </Link>
                </div>
            </div>
        </div>
    );
}
