import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Building2, Users, TrendingUp, AlertTriangle, Search } from 'lucide-react';
import { useState } from 'react';
import type { BreadcrumbItem } from '@/types';

interface TenantRow {
    id: string; name: string; slug: string; email: string;
    plan: string; status: string; max_users: number;
    tenant_users_count: number;
    subscription: { status: string; amount: number; currency: string } | null;
    created_at: string;
}

interface Stats { total: number; active: number; trial: number; suspended: number; mrr: number }

interface Props {
    tenants: { data: TenantRow[]; current_page: number; last_page: number; total: number };
    stats: Stats;
    filters: { search?: string; plan?: string; status?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Super Admin', href: '/super-admin' },
    { title: 'Tenants', href: '/super-admin/tenants' },
];

const PLAN_COLORS: Record<string, string> = {
    free: 'bg-gray-100 text-gray-600', starter: 'bg-blue-100 text-blue-700',
    growth: 'bg-emerald-100 text-emerald-700', enterprise: 'bg-purple-100 text-purple-700',
};
const STATUS_COLORS: Record<string, string> = {
    trial: 'bg-amber-100 text-amber-700', active: 'bg-emerald-100 text-emerald-700',
    suspended: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-500',
};

export default function SuperAdminTenantsIndex({ tenants, stats, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    function applySearch(e: React.FormEvent) {
        e.preventDefault();
        router.get('/super-admin/tenants', { search }, { preserveState: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Super Admin — Tenants" />
            <div className="p-6 space-y-6 max-w-7xl mx-auto">

                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">All Workspaces</h1>
                    <Badge variant="outline" className="text-xs">Internal — Super Admin Only</Badge>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                        { label: 'Total',      value: stats.total,     icon: Building2,    color: '' },
                        { label: 'Active',     value: stats.active,    icon: TrendingUp,   color: 'text-emerald-600' },
                        { label: 'Trial',      value: stats.trial,     icon: Users,        color: 'text-amber-600' },
                        { label: 'Suspended',  value: stats.suspended, icon: AlertTriangle,color: 'text-red-600' },
                        { label: 'MRR',        value: `$${stats.mrr.toLocaleString()}`, icon: TrendingUp, color: 'text-primary' },
                    ].map(s => (
                        <Card key={s.label} className="p-4 flex items-center gap-3">
                            <s.icon className={cn('h-5 w-5 flex-shrink-0', s.color || 'text-muted-foreground')} />
                            <div>
                                <p className="text-xs text-muted-foreground">{s.label}</p>
                                <p className="text-lg font-bold">{s.value}</p>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Search */}
                <form onSubmit={applySearch} className="flex gap-2 max-w-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            className="pl-8"
                            placeholder="Search by name or email…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <Button type="submit" variant="outline">Search</Button>
                </form>

                {/* Table */}
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium">Workspace</th>
                                    <th className="text-left px-4 py-3 font-medium">Plan</th>
                                    <th className="text-left px-4 py-3 font-medium">Status</th>
                                    <th className="text-left px-4 py-3 font-medium">Users</th>
                                    <th className="text-left px-4 py-3 font-medium">MRR</th>
                                    <th className="text-left px-4 py-3 font-medium">Created</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {tenants.data.map(t => (
                                    <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="font-medium">{t.name}</p>
                                            <p className="text-xs text-muted-foreground">{t.email}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className={cn('capitalize text-xs', PLAN_COLORS[t.plan] ?? '')}>
                                                {t.plan}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className={cn('capitalize text-xs', STATUS_COLORS[t.status] ?? '')}>
                                                {t.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {t.tenant_users_count} / {t.max_users >= 9999 ? '∞' : t.max_users}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {t.subscription?.amount
                                                ? `$${t.subscription.amount}/mo`
                                                : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs">
                                            {new Date(t.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Button asChild size="sm" variant="ghost">
                                                <Link href={`/super-admin/tenants/${t.id}`}>View</Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {tenants.last_page > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20 text-sm">
                            <span className="text-muted-foreground">
                                Page {tenants.current_page} of {tenants.last_page} ({tenants.total} total)
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    size="sm" variant="outline"
                                    disabled={tenants.current_page <= 1}
                                    onClick={() => router.get('/super-admin/tenants', { ...filters, page: tenants.current_page - 1 })}
                                >← Prev</Button>
                                <Button
                                    size="sm" variant="outline"
                                    disabled={tenants.current_page >= tenants.last_page}
                                    onClick={() => router.get('/super-admin/tenants', { ...filters, page: tenants.current_page + 1 })}
                                >Next →</Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}
