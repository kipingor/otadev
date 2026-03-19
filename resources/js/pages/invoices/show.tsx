import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import { Send, CreditCard, X, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
// FIX: replace native confirm() with project-standard dialogs
import { useDeleteConfirmation, useConfirmDialog } from '@/components/ui/confirm-dialog';

const STATUS_COLORS: Record<string, string> = {
    draft:     'bg-gray-100 text-gray-700',
    issued:    'bg-blue-100 text-blue-700',
    paid:      'bg-green-100 text-green-700',
    overdue:   'bg-red-100 text-red-700',
    cancelled: 'bg-zinc-100 text-zinc-500',
};
const fmt     = (n: number, c = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency: c }).format(n);
const fmtDate = (d: string)            => new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

interface Invoice {
    id: number; number: string; status: string; currency: string;
    issue_date: string; due_date: string; sent_at: string | null;
    subtotal: number; tax: number; total: number; notes: string | null;
    lines:    { description: string; quantity: number; unit_price: number; amount: number }[];
    client:   { id: number; name: string; email: string } | null;
    project:  { id: number; name: string } | null;
    payments: { id: number; amount: number; method: string; reference: string | null; paid_at: string; notes: string | null }[];
}

interface Props { invoice: Invoice; amount_paid: number; amount_due: number }

export default function InvoiceShow({ invoice, amount_paid, amount_due }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Accounting', href: '/accounting' },
        { title: 'Invoices',   href: '/invoices' },
        { title: invoice.number, href: `/invoices/${invoice.id}` },
    ];

    const [paymentOpen, setPaymentOpen] = useState(false);
    const [payForm, setPayForm] = useState({
        amount: String(amount_due), method: 'bank', reference: '', notes: '',
        paid_at: new Date().toISOString().slice(0, 10),
    });
    const [saving, setSaving] = useState(false);

    // FIX: was confirm() — use project dialogs
    const { confirmDelete, ConfirmDialog }       = useDeleteConfirmation();
    const { confirm } = useConfirmDialog();

    function recordPayment() {
        setSaving(true);
        router.post(`/invoices/${invoice.id}/payment`, payForm, {
            onSuccess: () => { setPaymentOpen(false); setSaving(false); },
            onFinish:  () => setSaving(false),
            preserveScroll: true,
        });
    }

    const handleSend = () => confirm({
        title: 'Mark as Sent',
        description: 'This will mark the invoice as sent to the client.',
        confirmLabel: 'Mark Sent',
        onConfirm: async () => {
            router.post(`/invoices/${invoice.id}/send`, {}, { preserveScroll: true });
        },
    });

    const handleCancel = () => confirm({
        title: 'Cancel Invoice',
        description: 'Are you sure you want to cancel this invoice? This cannot be undone.',
        confirmLabel: 'Cancel Invoice',
        variant: 'warning',
        onConfirm: async () => {
            router.post(`/invoices/${invoice.id}/cancel`, {}, { preserveScroll: true });
        },
    });

    const handleDelete = () => confirmDelete({
        itemName: `Invoice ${invoice.number}`,
        onConfirm: async () => {
            router.delete(`/invoices/${invoice.id}`);
        },
    });

    const canEdit   = ['draft', 'issued'].includes(invoice.status);
    const canSend   = ['draft'].includes(invoice.status);
    const canPay    = ['issued', 'overdue'].includes(invoice.status);
    const canCancel = !['paid', 'cancelled'].includes(invoice.status);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Invoice ${invoice.number}`} />
            <div className="p-6 max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold">{invoice.number}</h1>
                            <Badge className={`capitalize ${STATUS_COLORS[invoice.status] ?? ''}`}>
                                {invoice.status}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {invoice.client?.name ?? 'Unknown client'} {invoice.project ? `· ${invoice.project.name}` : ''}
                        </p>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                        {canEdit && (
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/invoices/${invoice.id}/edit`}>
                                    <Edit className="h-4 w-4 mr-1.5" />Edit
                                </Link>
                            </Button>
                        )}
                        {/* FIX: was confirm() inline */}
                        {canSend && (
                            <Button variant="outline" size="sm" onClick={handleSend}>
                                <Send className="h-4 w-4 mr-1.5" />Mark Sent
                            </Button>
                        )}
                        {canPay && (
                            <Button size="sm" onClick={() => setPaymentOpen(true)}>
                                <CreditCard className="h-4 w-4 mr-1.5" />Record Payment
                            </Button>
                        )}
                        {/* FIX: was confirm() inline */}
                        {canCancel && (
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={handleCancel}>
                                <X className="h-4 w-4 mr-1.5" />Cancel
                            </Button>
                        )}
                    </div>
                </div>

                {/* Record Payment Panel */}
                {paymentOpen && (
                    <Card className="p-5 border-blue-200 bg-blue-50/30">
                        <h3 className="font-semibold mb-4">Record Payment</h3>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                            <div>
                                <label className="text-xs font-medium mb-1 block">Amount *</label>
                                <Input type="number" step="0.01" value={payForm.amount}
                                    onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} />
                            </div>
                            <div>
                                <label className="text-xs font-medium mb-1 block">Method *</label>
                                <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                                    value={payForm.method} onChange={e => setPayForm(f => ({ ...f, method: e.target.value }))}>
                                    {['bank', 'mpesa', 'cash', 'card', 'cheque', 'paypal'].map(m => (
                                        <option key={m} value={m} className="capitalize">{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium mb-1 block">Reference</label>
                                <Input placeholder="Txn ID / cheque no." value={payForm.reference}
                                    onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))} />
                            </div>
                            <div>
                                <label className="text-xs font-medium mb-1 block">Date *</label>
                                <Input type="date" value={payForm.paid_at}
                                    onChange={e => setPayForm(f => ({ ...f, paid_at: e.target.value }))} />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={recordPayment} disabled={saving}>
                                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                                {saving ? 'Saving…' : 'Record Payment'}
                            </Button>
                            <Button variant="outline" onClick={() => setPaymentOpen(false)}>Cancel</Button>
                        </div>
                    </Card>
                )}

                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="p-6">
                            <div className="grid sm:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Bill To</p>
                                    <p className="font-semibold">{invoice.client?.name ?? '—'}</p>
                                    <p className="text-sm text-muted-foreground">{invoice.client?.email}</p>
                                </div>
                                <div className="sm:text-right">
                                    <div className="space-y-1 text-sm">
                                        <div className="flex sm:justify-end gap-4"><span className="text-muted-foreground">Issue Date</span><span className="font-medium">{fmtDate(invoice.issue_date)}</span></div>
                                        <div className="flex sm:justify-end gap-4"><span className="text-muted-foreground">Due Date</span><span className="font-medium">{fmtDate(invoice.due_date)}</span></div>
                                        {invoice.sent_at && <div className="flex sm:justify-end gap-4"><span className="text-muted-foreground">Sent</span><span className="font-medium">{fmtDate(invoice.sent_at)}</span></div>}
                                    </div>
                                </div>
                            </div>

                            <table className="w-full text-sm mb-4">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="pb-2 font-medium">Description</th>
                                        <th className="pb-2 font-medium text-center">Qty</th>
                                        <th className="pb-2 font-medium text-right">Unit Price</th>
                                        <th className="pb-2 font-medium text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {Array.isArray(invoice.lines) && invoice.lines.map((line, i) => (
                                        <tr key={i}>
                                            <td className="py-2.5">{line.description}</td>
                                            <td className="py-2.5 text-center">{line.quantity}</td>
                                            <td className="py-2.5 text-right">{fmt(line.unit_price, invoice.currency)}</td>
                                            <td className="py-2.5 text-right font-medium">{fmt(line.amount, invoice.currency)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="border-t pt-3 space-y-1 text-sm">
                                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmt(invoice.subtotal, invoice.currency)}</span></div>
                                {Number(invoice.tax) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{fmt(invoice.tax, invoice.currency)}</span></div>}
                                <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span>{fmt(invoice.total, invoice.currency)}</span></div>
                            </div>

                            {invoice.notes && (
                                <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                                    <p className="font-medium text-foreground mb-1">Notes</p>
                                    <p className="whitespace-pre-wrap">{invoice.notes}</p>
                                </div>
                            )}
                        </Card>

                        {invoice.payments.length > 0 && (
                            <Card className="p-6">
                                <h2 className="font-semibold mb-4">Payment History</h2>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="pb-2 font-medium">Date</th>
                                            <th className="pb-2 font-medium">Method</th>
                                            <th className="pb-2 font-medium">Reference</th>
                                            <th className="pb-2 font-medium text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {invoice.payments.map(p => (
                                            <tr key={p.id}>
                                                <td className="py-2.5">{fmtDate(p.paid_at)}</td>
                                                <td className="py-2.5 capitalize">{p.method}</td>
                                                <td className="py-2.5 text-muted-foreground">{p.reference ?? '—'}</td>
                                                <td className="py-2.5 text-right font-medium text-green-600">{fmt(p.amount, invoice.currency)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-4">
                        <Card className="p-5 space-y-3">
                            <h3 className="font-semibold text-sm">Payment Summary</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-muted-foreground">Invoice Total</span><span className="font-medium">{fmt(invoice.total, invoice.currency)}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="font-medium text-green-600">{fmt(amount_paid, invoice.currency)}</span></div>
                                <div className="flex justify-between border-t pt-2 font-semibold">
                                    <span>Amount Due</span>
                                    <span className={amount_due > 0 ? 'text-red-600' : 'text-green-600'}>{fmt(amount_due, invoice.currency)}</span>
                                </div>
                            </div>
                            {invoice.status === 'paid' && (
                                <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                                    <CheckCircle2 className="h-4 w-4" />Fully Paid
                                </div>
                            )}
                        </Card>

                        <Card className="p-5 space-y-2 text-sm">
                            <h3 className="font-semibold">Quick Actions</h3>
                            <div className="space-y-1.5">
                                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                                    <Link href={`/follow-ups?invoice_id=${invoice.id}`}>
                                        <Send className="h-3.5 w-3.5 mr-2" />Schedule Follow-up
                                    </Link>
                                </Button>
                                {invoice.status === 'draft' && (
                                    /* FIX: was confirm() inline */
                                    <Button variant="ghost" size="sm" className="w-full justify-start text-red-600 hover:text-red-700"
                                        onClick={handleDelete}>
                                        <Trash2 className="h-3.5 w-3.5 mr-2" />Delete Draft
                                    </Button>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* FIX: dialog portals */}
            <ConfirmDialog />
        </AppLayout>
    );
}