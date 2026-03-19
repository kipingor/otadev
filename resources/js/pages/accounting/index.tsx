import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type BreadcrumbItem } from '@/types';
import { DollarSign, TrendingUp, AlertTriangle, CreditCard, FileText, Bell, BarChart3, ArrowRight, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Accounting', href: '/accounting' }];
const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700', issued: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700', overdue: 'bg-red-100 text-red-700', cancelled: 'bg-zinc-100 text-zinc-500',
};
const fmt = (n: number, c = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency: c }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

interface Props {
    summary: { total_billed: number; total_collected: number; total_overdue: number; total_expenses: number };
    monthly: { month: string; total: number }[];
    recentInvoices: any[];
    overdueInvoices: any[];
    recentPayments: any[];
    pendingFollowUps: any[];
    invoicesByStatus: Record<string, { count: number; total: number }>;
}

export default function AccountingIndex({ summary, monthly, recentInvoices, overdueInvoices, recentPayments, pendingFollowUps, invoicesByStatus }: Props) {
    const net = summary.total_collected - summary.total_expenses;
    const metricCards = [
        { label: 'Total Billed', value: fmt(summary.total_billed), icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Collected', value: fmt(summary.total_collected), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Overdue', value: fmt(summary.total_overdue), icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
        { label: 'Net Revenue', value: fmt(net), icon: DollarSign, color: net >= 0 ? 'text-emerald-600' : 'text-red-600', bg: net >= 0 ? 'bg-emerald-50' : 'bg-red-50' },
    ];
    const chartData = monthly.map(m => ({ month: m.month.slice(5), amount: Number(m.total) }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Accounting" />
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Accounting</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Billing, payments &amp; client communications</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild><Link href="/follow-ups"><Bell className="h-4 w-4 mr-1.5" />Follow-ups</Link></Button>
                        <Button variant="outline" size="sm" asChild><Link href="/client-reports"><BarChart3 className="h-4 w-4 mr-1.5" />Client Reports</Link></Button>
                        <Button size="sm" asChild><Link href="/invoices/create"><FileText className="h-4 w-4 mr-1.5" />New Invoice</Link></Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {metricCards.map(c => (
                        <Card key={c.label} className="p-5">
                            <div className="flex items-start justify-between">
                                <div><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{c.label}</p><p className="text-2xl font-bold mt-1">{c.value}</p></div>
                                <div className={`p-2 rounded-lg ${c.bg}`}><c.icon className={`h-5 w-5 ${c.color}`} /></div>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold">Monthly Revenue Collected</h2>
                            <span className="text-xs text-muted-foreground">Last 6 months</span>
                        </div>
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={chartData} barSize={28}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip formatter={(v: number) => fmt(v)} />
                                    <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No payment data yet</div>
                        )}
                    </Card>

                    <Card className="p-6">
                        <h2 className="font-semibold mb-4">Invoice Status</h2>
                        <div className="space-y-3">
                            {['draft', 'issued', 'paid', 'overdue', 'cancelled'].map(status => {
                                const s = invoicesByStatus[status];
                                if (!s) return null;
                                return (
                                    <div key={status} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge className={`text-xs capitalize ${STATUS_COLORS[status]}`}>{status}</Badge>
                                            <span className="text-xs text-muted-foreground">{s.count}</span>
                                        </div>
                                        <span className="text-sm font-medium">{fmt(s.total)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" />Overdue</h2>
                            <Button variant="ghost" size="sm" asChild><Link href="/invoices?status=overdue" className="text-xs">All <ArrowRight className="h-3 w-3 ml-1" /></Link></Button>
                        </div>
                        <div className="space-y-2">
                            {overdueInvoices.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No overdue invoices 🎉</p>
                                : overdueInvoices.map((inv: any) => (
                                    <Link key={inv.id} href={`/invoices/${inv.id}`} className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors block">
                                        <div><p className="text-sm font-medium">{inv.number}</p><p className="text-xs text-muted-foreground">{inv.client?.name}</p></div>
                                        <div className="text-right"><p className="text-sm font-semibold text-red-600">{fmt(inv.total, inv.currency)}</p><p className="text-xs text-muted-foreground">Due {fmtDate(inv.due_date)}</p></div>
                                    </Link>
                                ))}
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold flex items-center gap-2"><CreditCard className="h-4 w-4 text-green-500" />Recent Payments</h2>
                        </div>
                        <div className="space-y-3">
                            {recentPayments.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No payments recorded</p>
                                : recentPayments.map((p: any) => (
                                    <div key={p.id} className="flex items-center justify-between">
                                        <div><p className="text-sm font-medium">{p.invoice?.client?.name ?? '—'}</p><p className="text-xs text-muted-foreground capitalize">{p.method} · {p.invoice?.number}</p></div>
                                        <div className="text-right"><p className="text-sm font-semibold text-green-600">+{fmt(p.amount, p.currency)}</p><p className="text-xs text-muted-foreground">{fmtDate(p.paid_at)}</p></div>
                                    </div>
                                ))}
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold flex items-center gap-2"><Clock className="h-4 w-4 text-amber-500" />Pending Follow-ups</h2>
                            <Button variant="ghost" size="sm" asChild><Link href="/follow-ups" className="text-xs">All <ArrowRight className="h-3 w-3 ml-1" /></Link></Button>
                        </div>
                        <div className="space-y-2">
                            {pendingFollowUps.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No pending follow-ups</p>
                                : pendingFollowUps.map((f: any) => (
                                    <div key={f.id} className="flex items-start gap-2 p-2 rounded hover:bg-muted/50">
                                        <div className="h-2 w-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <div className="min-w-0"><p className="text-sm font-medium truncate">{f.subject}</p><p className="text-xs text-muted-foreground">{f.client?.name} · {f.scheduled_at ? fmtDate(f.scheduled_at) : 'Unscheduled'}</p></div>
                                    </div>
                                ))}
                        </div>
                    </Card>
                </div>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold">Recent Invoices</h2>
                        <Button variant="ghost" size="sm" asChild><Link href="/invoices" className="text-xs">View all <ArrowRight className="h-3 w-3 ml-1" /></Link></Button>
                    </div>
                    <table className="w-full text-sm">
                        <thead><tr className="border-b text-left text-muted-foreground">
                            <th className="pb-2 font-medium">Invoice</th><th className="pb-2 font-medium">Client</th>
                            <th className="pb-2 font-medium">Project</th><th className="pb-2 font-medium">Due</th>
                            <th className="pb-2 font-medium text-right">Amount</th><th className="pb-2 font-medium text-right">Status</th>
                        </tr></thead>
                        <tbody className="divide-y">
                            {recentInvoices.map((inv: any) => (
                                <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="py-2.5"><Link href={`/invoices/${inv.id}`} className="font-medium text-primary hover:underline">{inv.number}</Link></td>
                                    <td className="py-2.5 text-muted-foreground">{inv.client?.name ?? '—'}</td>
                                    <td className="py-2.5 text-muted-foreground">{inv.project?.name ?? '—'}</td>
                                    <td className="py-2.5 text-muted-foreground">{inv.due_date ? fmtDate(inv.due_date) : '—'}</td>
                                    <td className="py-2.5 text-right font-medium">{fmt(inv.total, inv.currency)}</td>
                                    <td className="py-2.5 text-right"><Badge className={`text-xs capitalize ${STATUS_COLORS[inv.status] ?? ''}`}>{inv.status}</Badge></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {recentInvoices.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No invoices yet. <Link href="/invoices/create" className="text-primary hover:underline">Create your first invoice</Link></p>}
                </Card>
            </div>
        </AppLayout>
    );
}