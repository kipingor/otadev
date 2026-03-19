import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import { Plus, Search, Filter } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Accounting', href: '/accounting' },
    { title: 'Invoices', href: '/invoices' },
];
const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700', issued: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700', overdue: 'bg-red-100 text-red-700', cancelled: 'bg-zinc-100 text-zinc-500',
};
const fmt = (n: number, c = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency: c }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

interface Props {
    invoices: { data: any[]; current_page: number; last_page: number; total: number };
    summary: { total_billed: number; total_paid: number; total_overdue: number; draft_count: number };
    clients: { id: number; name: string }[];
}

export default function InvoicesIndex({ invoices, summary, clients }: Props) {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState(params.get('status') ?? '');
    const [clientFilter, setClientFilter] = useState(params.get('client_id') ?? '');

    function applyFilters(overrides: Record<string, string> = {}) {
        const q: Record<string, string> = {};
        const s = overrides.status     ?? statusFilter;
        const c = overrides.client_id  ?? clientFilter;
        if (s) q.status = s;
        if (c) q.client_id = c;
        router.get('/invoices', q, { preserveScroll: true });
    }

    const summaryCards = [
        { label: 'Total Billed', value: fmt(summary.total_billed), color: 'text-blue-600' },
        { label: 'Collected', value: fmt(summary.total_paid), color: 'text-green-600' },
        { label: 'Overdue', value: fmt(summary.total_overdue), color: 'text-red-600' },
        { label: 'Drafts', value: summary.draft_count.toString(), color: 'text-gray-600' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Invoices" />
            <div className="p-6 space-y-6 max-w-6xl mx-auto">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
                    <Button asChild><Link href="/invoices/create"><Plus className="h-4 w-4 mr-1.5" />New Invoice</Link></Button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {summaryCards.map(c => (
                        <Card key={c.label} className="p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">{c.label}</p>
                            <p className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</p>
                        </Card>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search invoices..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-[130px]"
                        value={statusFilter}
                        onChange={e => { setStatusFilter(e.target.value); applyFilters({ status: e.target.value }); }}
                    >
                        <option value="">All statuses</option>
                        {['draft', 'issued', 'paid', 'overdue', 'cancelled'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                    </select>
                    <select
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-[150px]"
                        value={clientFilter}
                        onChange={e => { setClientFilter(e.target.value); applyFilters({ client_id: e.target.value }); }}
                    >
                        <option value="">All clients</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                {/* Table */}
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-muted-foreground">
                                    <th className="px-4 py-3 font-medium">Invoice</th>
                                    <th className="px-4 py-3 font-medium">Client</th>
                                    <th className="px-4 py-3 font-medium">Project</th>
                                    <th className="px-4 py-3 font-medium">Issued</th>
                                    <th className="px-4 py-3 font-medium">Due</th>
                                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                                    <th className="px-4 py-3 font-medium text-center">Status</th>
                                    <th className="px-4 py-3 font-medium"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {invoices.data
                                    .filter(inv => !search || inv.number.toLowerCase().includes(search.toLowerCase()) || inv.client?.name?.toLowerCase().includes(search.toLowerCase()))
                                    .map((inv: any) => (
                                        <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3 font-medium">
                                                <Link href={`/invoices/${inv.id}`} className="text-primary hover:underline">{inv.number}</Link>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">{inv.client?.name ?? '—'}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{inv.project?.name ?? '—'}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{inv.issue_date ? fmtDate(inv.issue_date) : '—'}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{inv.due_date ? fmtDate(inv.due_date) : '—'}</td>
                                            <td className="px-4 py-3 text-right font-semibold">{fmt(inv.total, inv.currency)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge className={`text-xs capitalize ${STATUS_COLORS[inv.status] ?? ''}`}>{inv.status}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/invoices/${inv.id}`}>View</Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                        {invoices.data.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                No invoices found. <Link href="/invoices/create" className="text-primary hover:underline">Create one</Link>
                            </div>
                        )}
                    </div>
                    {invoices.last_page > 1 && (
                        <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-muted-foreground">
                            <span>{invoices.total} total invoices</span>
                            <div className="flex gap-2">
                                {invoices.current_page > 1 && <Button variant="outline" size="sm" onClick={() => router.get('/invoices', { page: invoices.current_page - 1 })}>Previous</Button>}
                                {invoices.current_page < invoices.last_page && <Button variant="outline" size="sm" onClick={() => router.get('/invoices', { page: invoices.current_page + 1 })}>Next</Button>}
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}