import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    Building2, Users, CreditCard, Package, ArrowLeft,
    ShieldAlert, CheckCircle2, AlertTriangle, XCircle, Zap,
} from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

interface TenantDetail {
    id: string; name: string; slug: string; email: string; phone: string | null;
    plan: string; status: string; max_users: number; max_modules: number;
    stripe_customer_id: string | null; trial_ends_at: string | null;
    created_at: string;
}

interface TenantUserRow {
    id: number; name: string; email: string; role: string;
    is_active: boolean; joined_at: string; last_active_at: string | null;
}

interface SubData {
    plan: string; status: string; amount: number; currency: string;
    billing_cycle: string; current_period_end: string | null;
}

interface Props {
    tenant: TenantDetail;
    tenant_users: TenantUserRow[];
    enabled_modules: string[];
    subscription: SubData | null;
}

const STATUS_ICON: Record<string, React.ComponentType<any>> = {
    active:    CheckCircle2,
    trial:     Zap,
    suspended: ShieldAlert,
    cancelled: XCircle,
};
const STATUS_COLOR: Record<string, string> = {
    active:    'text-emerald-600',
    trial:     'text-amber-500',
    suspended: 'text-red-500',
    cancelled: 'text-gray-400',
};

export default function SuperAdminTenantShow({ tenant, tenant_users, enabled_modules, subscription }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Super Admin', href: '/super-admin' },
        { title: 'Tenants', href: '/super-admin/tenants' },
        { title: tenant.name, href: `/super-admin/tenants/${tenant.id}` },
    ];

    const StatusIcon = STATUS_ICON[tenant.status] ?? AlertTriangle;

    function updatePlan(plan: string) {
        if (!confirm(`Change plan to ${plan}?`)) return;
        router.patch(`/super-admin/tenants/${tenant.id}/plan`, { plan });
    }

    function updateStatus(status: string) {
        if (!confirm(`Change status to ${status}?`)) return;
        router.patch(`/super-admin/tenants/${tenant.id}/status`, { status });
    }

    function impersonate(userId: number) {
        if (!confirm('Impersonate this user?')) return;
        router.post(`/super-admin/tenants/${tenant.id}/impersonate`, { user_id: userId });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${tenant.name} — Super Admin`} />

            <div className="p-6 max-w-5xl mx-auto space-y-6">
                {/* Back + Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <Link href="/super-admin/tenants"
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2">
                            <ArrowLeft className="h-3.5 w-3.5" /> All tenants
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted font-bold uppercase text-muted-foreground">
                                {tenant.name.slice(0, 2)}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">{tenant.name}</h1>
                                <p className="text-sm text-muted-foreground">{tenant.slug} · {tenant.email}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap justify-end">
                        <div className={cn('flex items-center gap-1.5 text-sm font-medium', STATUS_COLOR[tenant.status])}>
                            <StatusIcon className="h-4 w-4" />
                            <span className="capitalize">{tenant.status}</span>
                        </div>
                        <Badge className="capitalize">{tenant.plan}</Badge>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left: details + controls */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Subscription card */}
                        <Card className="p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                <h2 className="font-semibold">Subscription</h2>
                            </div>
                            {subscription ? (
                                <div className="grid sm:grid-cols-3 gap-4 text-sm">
                                    <div><p className="text-muted-foreground">Plan</p><p className="font-medium capitalize">{subscription.plan}</p></div>
                                    <div><p className="text-muted-foreground">Status</p><p className="font-medium capitalize">{subscription.status}</p></div>
                                    <div><p className="text-muted-foreground">Amount</p><p className="font-medium">{subscription.currency} {subscription.amount}/{subscription.billing_cycle === 'annual' ? 'yr' : 'mo'}</p></div>
                                    {subscription.current_period_end && (
                                        <div><p className="text-muted-foreground">Renews</p><p className="font-medium">{new Date(subscription.current_period_end).toLocaleDateString()}</p></div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No subscription record.</p>
                            )}
                        </Card>

                        {/* Users */}
                        <Card className="p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <h2 className="font-semibold">Users ({tenant_users.length} / {tenant.max_users})</h2>
                            </div>
                            <div className="space-y-2">
                                {tenant_users.map((u) => (
                                    <div key={u.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                        <div>
                                            <p className="text-sm font-medium">{u.name}</p>
                                            <p className="text-xs text-muted-foreground">{u.email} · <span className="capitalize">{u.role}</span></p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!u.is_active && <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>}
                                            <Button size="sm" variant="ghost" className="text-xs"
                                                onClick={() => impersonate(u.id)}>
                                                Impersonate
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Modules */}
                        <Card className="p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <h2 className="font-semibold">Enabled Modules</h2>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {enabled_modules.length > 0
                                    ? enabled_modules.map(m => (
                                        <Badge key={m} variant="secondary" className="capitalize">{m.replace('_', ' ')}</Badge>
                                    ))
                                    : <p className="text-sm text-muted-foreground">No modules enabled.</p>
                                }
                            </div>
                        </Card>
                    </div>

                    {/* Right: admin controls */}
                    <div className="space-y-4">
                        <Card className="p-4 space-y-3">
                            <h3 className="font-semibold text-sm">Force Plan Change</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {(['free', 'starter', 'growth', 'enterprise'] as const).map(p => (
                                    <Button key={p} size="sm" variant={tenant.plan === p ? 'default' : 'outline'}
                                        className="capitalize text-xs" onClick={() => updatePlan(p)}>
                                        {p}
                                    </Button>
                                ))}
                            </div>
                        </Card>

                        <Card className="p-4 space-y-3">
                            <h3 className="font-semibold text-sm">Status Control</h3>
                            <div className="space-y-2">
                                {tenant.status !== 'active' && (
                                    <Button size="sm" className="w-full" variant="outline"
                                        onClick={() => updateStatus('active')}>
                                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Activate
                                    </Button>
                                )}
                                {tenant.status !== 'suspended' && (
                                    <Button size="sm" className="w-full" variant="outline"
                                        onClick={() => updateStatus('suspended')}>
                                        <ShieldAlert className="h-3.5 w-3.5 mr-1.5 text-red-500" /> Suspend
                                    </Button>
                                )}
                                {tenant.status !== 'cancelled' && (
                                    <Button size="sm" className="w-full text-muted-foreground" variant="ghost"
                                        onClick={() => updateStatus('cancelled')}>
                                        <XCircle className="h-3.5 w-3.5 mr-1.5" /> Cancel
                                    </Button>
                                )}
                            </div>
                        </Card>

                        <Card className="p-4 space-y-1 text-sm">
                            <h3 className="font-semibold mb-2">Details</h3>
                            <p className="text-muted-foreground">ID: <span className="font-mono text-xs">{tenant.id}</span></p>
                            <p className="text-muted-foreground">Created: {new Date(tenant.created_at).toLocaleDateString()}</p>
                            {tenant.trial_ends_at && (
                                <p className="text-muted-foreground">Trial ends: {new Date(tenant.trial_ends_at).toLocaleDateString()}</p>
                            )}
                            {tenant.stripe_customer_id && (
                                <p className="text-muted-foreground text-xs">Stripe: {tenant.stripe_customer_id}</p>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}