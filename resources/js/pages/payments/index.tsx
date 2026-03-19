import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PaymentCard, { type Payment } from '@/pages/payments/payment-cards';
import { type BreadcrumbItem } from '@/types';
import { DollarSign, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Payments', href: '/payments' }];

const fmt = (amount: number, currency = 'USD') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

export default function PaymentsIndex() {
    const { props } = usePage<any>();
    const payments: Payment[] = props.payments?.data ?? [];
    const totals = props.totals ?? { month: 0, year: 0 };
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');

    const filtered = payments.filter((p) => {
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        const matchesSearch = !search || (
            p.invoice?.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
            p.invoice?.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
            p.transaction_id?.toLowerCase().includes(search.toLowerCase())
        );
        return matchesStatus && matchesSearch;
    });

    const completedTotal = payments
        .filter((p) => p.status === 'completed')
        .reduce((sum, p) => sum + Number(p.amount), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payments" />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Payments</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Track all payment transactions</p>
                    </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-medium text-muted-foreground">Total Received</p>
                        </div>
                        <p className="text-2xl font-bold">{fmt(completedTotal)}</p>
                    </div>
                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <p className="text-sm font-medium text-muted-foreground">Completed</p>
                        </div>
                        <p className="text-2xl font-bold">{payments.filter(p => p.status === 'completed').length}</p>
                    </div>
                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-amber-500" />
                            <p className="text-sm font-medium text-muted-foreground">Pending</p>
                        </div>
                        <p className="text-2xl font-bold">{payments.filter(p => p.status === 'pending').length}</p>
                    </div>
                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <XCircle className="h-4 w-4 text-red-500" />
                            <p className="text-sm font-medium text-muted-foreground">Failed</p>
                        </div>
                        <p className="text-2xl font-bold">{payments.filter(p => p.status === 'failed').length}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-3 flex-wrap">
                    <Input
                        placeholder="Search by invoice, client, or transaction ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-xs"
                    />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                            <SelectItem value="refunded">Refunded</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Payment list */}
                {filtered.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                        <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No payments found</p>
                        <p className="text-sm mt-1">Payments are recorded when invoices are paid.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((p) => <PaymentCard key={p.id} payment={p} />)}
                    </div>
                )}

                {/* Pagination links */}
                {props.payments?.links && (
                    <div className="flex gap-2 justify-center">
                        {props.payments.links.map((link: any, i: number) => (
                            link.url ? (
                                <Link key={i} href={link.url}
                                    className={`px-3 py-1.5 rounded text-sm border ${link.active ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }} />
                            ) : (
                                <span key={i} className="px-3 py-1.5 rounded text-sm border text-muted-foreground opacity-50"
                                    dangerouslySetInnerHTML={{ __html: link.label }} />
                            )
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}