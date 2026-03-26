import { Head, Link, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, CheckCircle2, Plus, ChevronRight, Users, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TenantMembership, PlanKey } from '@/types/tenant';

interface Props {
    memberships: TenantMembership[];
    current_tenant_id: string | null;
}

const PLAN_COLORS: Record<PlanKey, string> = {
    free:       'bg-gray-100 text-gray-600',
    starter:    'bg-blue-100 text-blue-700',
    growth:     'bg-emerald-100 text-emerald-700',
    enterprise: 'bg-purple-100 text-purple-700',
};

const ROLE_LABELS: Record<string, string> = {
    owner:  'Owner',
    admin:  'Admin',
    member: 'Member',
};

export default function SwitchTenant({ memberships, current_tenant_id }: Props) {
    function switchTo(tenantId: string) {
        router.post(`/switch-tenant/${tenantId}`);
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
            <Head title="Switch Workspace" />

            <div className="w-full max-w-lg space-y-6">
                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                        <Building2 className="h-7 w-7 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Your Workspaces</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Select a workspace to switch to, or create a new one.
                    </p>
                </div>

                {/* Workspace list */}
                <div className="space-y-3">
                    {memberships.map((m) => {
                        const isCurrent = m.tenant_id === current_tenant_id;
                        return (
                            <button
                                key={m.tenant_id}
                                onClick={() => !isCurrent && switchTo(m.tenant_id)}
                                disabled={isCurrent}
                                className={cn(
                                    'w-full text-left rounded-xl border-2 p-4 transition-all',
                                    isCurrent
                                        ? 'border-primary bg-primary/5 cursor-default'
                                        : 'border-border bg-card hover:border-primary/40 hover:shadow-sm cursor-pointer',
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {/* Avatar / Logo */}
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted font-bold text-sm uppercase text-muted-foreground">
                                            {m.name.slice(0, 2)}
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-sm">{m.name}</p>
                                                {isCurrent && (
                                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={cn(
                                                    'text-[10px] font-medium px-1.5 py-0.5 rounded capitalize',
                                                    PLAN_COLORS[m.plan as PlanKey] ?? 'bg-gray-100 text-gray-600',
                                                )}>
                                                    {m.plan}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {ROLE_LABELS[m.role] ?? m.role}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    · {m.enabled_modules.length} module{m.enabled_modules.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {!isCurrent && (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    {isCurrent && (
                                        <span className="text-xs font-medium text-primary">Active</span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Create new workspace */}
                <Card className="p-4 border-dashed">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30">
                                <Plus className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">New workspace</p>
                                <p className="text-xs text-muted-foreground">Create another company or team</p>
                            </div>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                            <Link href="/create-tenant">Create</Link>
                        </Button>
                    </div>
                </Card>

                {/* Back link */}
                <div className="text-center">
                    <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                        ← Back to dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}