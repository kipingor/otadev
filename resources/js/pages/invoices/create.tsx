import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Accounting', href: '/accounting' },
    { title: 'Invoices', href: '/invoices' },
    { title: 'New Invoice', href: '/invoices/create' },
];

interface LineItem { description: string; quantity: string; unit_price: string }
const emptyLine = (): LineItem => ({ description: '', quantity: '1', unit_price: '' });

interface Props {
    clients: { id: number; name: string; email: string }[];
    projects: { id: number; name: string; client_id: number | null }[];
}

export default function InvoiceCreate({ clients, projects }: Props) {
    const [form, setForm] = useState({
        client_id: '', project_id: '', issue_date: new Date().toISOString().slice(0, 10),
        due_date: '', currency: 'USD', notes: '', tax_rate: '0',
    });
    const [lines, setLines] = useState<LineItem[]>([emptyLine()]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const filteredProjects = form.client_id
        ? projects.filter(p => !p.client_id || p.client_id === Number(form.client_id))
        : projects;

    function setLine(i: number, field: keyof LineItem, value: string) {
        setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
    }

    const subtotal = lines.reduce((sum, l) => sum + (parseFloat(l.quantity) || 0) * (parseFloat(l.unit_price) || 0), 0);
    const tax = subtotal * (parseFloat(form.tax_rate) || 0) / 100;
    const total = subtotal + tax;
    const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: form.currency || 'USD' }).format(n);

    function submit() {
        setSaving(true);
        const linesData = lines.reduce((acc, line, i) => {
            acc[`lines.${i}.description`] = line.description;
            acc[`lines.${i}.quantity`] = line.quantity;
            acc[`lines.${i}.unit_price`] = line.unit_price;
            return acc;
        }, {} as Record<string, string>);
        router.post('/invoices', { ...form, ...linesData }, {
            onError: e => { setErrors(e); setSaving(false); },
            onSuccess: () => setSaving(false),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Invoice" />
            <div className="p-6 max-w-4xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold tracking-tight">New Invoice</h1>

                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Client & Project */}
                        <Card className="p-6 space-y-4">
                            <h2 className="font-semibold">Bill To</h2>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">Client *</label>
                                    <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                                        value={form.client_id}
                                        onChange={e => setForm(f => ({ ...f, client_id: e.target.value, project_id: '' }))}>
                                        <option value="">Select client…</option>
                                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    {errors.client_id && <p className="text-xs text-red-500 mt-1">{errors.client_id}</p>}
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">Project (optional)</label>
                                    <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                                        value={form.project_id}
                                        onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}>
                                        <option value="">No project</option>
                                        {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </Card>

                        {/* Line Items */}
                        <Card className="p-6">
                            <h2 className="font-semibold mb-4">Line Items</h2>
                            <div className="space-y-2">
                                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
                                    <span className="col-span-6">Description</span>
                                    <span className="col-span-2 text-center">Qty</span>
                                    <span className="col-span-2 text-right">Unit Price</span>
                                    <span className="col-span-1 text-right">Amount</span>
                                    <span className="col-span-1"></span>
                                </div>
                                {lines.map((line, i) => (
                                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                                        <Input className="col-span-6 h-8 text-sm" placeholder="Description" value={line.description}
                                            onChange={e => setLine(i, 'description', e.target.value)} />
                                        <Input className="col-span-2 h-8 text-sm text-center" placeholder="1" value={line.quantity}
                                            onChange={e => setLine(i, 'quantity', e.target.value)} />
                                        <Input className="col-span-2 h-8 text-sm text-right" placeholder="0.00" value={line.unit_price}
                                            onChange={e => setLine(i, 'unit_price', e.target.value)} />
                                        <span className="col-span-1 text-right text-sm font-medium">
                                            {fmt((parseFloat(line.quantity) || 0) * (parseFloat(line.unit_price) || 0))}
                                        </span>
                                        <button className="col-span-1 flex justify-center text-muted-foreground hover:text-red-500"
                                            onClick={() => setLines(prev => prev.filter((_, idx) => idx !== i))} disabled={lines.length === 1}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <Button variant="outline" size="sm" className="mt-3" onClick={() => setLines(prev => [...prev, emptyLine()])}>
                                <Plus className="h-3.5 w-3.5 mr-1" />Add Line
                            </Button>
                            {errors.lines && <p className="text-xs text-red-500 mt-2">{errors.lines}</p>}
                        </Card>

                        {/* Notes */}
                        <Card className="p-6">
                            <h2 className="font-semibold mb-3">Notes</h2>
                            <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                                placeholder="Payment terms, bank details, etc." value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        <Card className="p-5 space-y-3">
                            <h2 className="font-semibold">Details</h2>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Issue Date *</label>
                                <Input type="date" value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Due Date *</label>
                                <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                                {errors.due_date && <p className="text-xs text-red-500 mt-1">{errors.due_date}</p>}
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Currency</label>
                                <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                                    value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                                    {['USD', 'EUR', 'GBP', 'KES', 'ZAR', 'NGN'].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Tax Rate (%)</label>
                                <Input type="number" min="0" max="100" step="0.1" value={form.tax_rate}
                                    onChange={e => setForm(f => ({ ...f, tax_rate: e.target.value }))} />
                            </div>
                        </Card>

                        <Card className="p-5 space-y-2">
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">{fmt(subtotal)}</span></div>
                            {tax > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax ({form.tax_rate}%)</span><span>{fmt(tax)}</span></div>}
                            <div className="flex justify-between font-semibold border-t pt-2 mt-2"><span>Total</span><span className="text-lg">{fmt(total)}</span></div>
                        </Card>

                        <Button className="w-full" onClick={submit} disabled={saving}>
                            {saving ? 'Saving…' : 'Create Invoice'}
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}