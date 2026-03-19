import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';

interface Props {
    prefill?: {
        name?: string; email?: string; phone?: string; company?: string;
        notes?: string; _lead_id?: string; _opportunity_id?: string;
    };
}

export default function ClientCreate({ prefill = {} }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Clients', href: '/clients' }, { title: 'New Client', href: '/clients/create' }];
    const [form, setForm] = useState({
        name: prefill.name ?? '', email: prefill.email ?? '', phone: prefill.phone ?? '',
        company: prefill.company ?? '', address: '', notes: prefill.notes ?? '',
        client_since: new Date().toISOString().slice(0,10),
        _lead_id: prefill._lead_id ?? '', _opportunity_id: prefill._opportunity_id ?? '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const isConversion = !!(prefill._lead_id || prefill._opportunity_id);

    function submit() {
        setSaving(true);
        router.post('/clients', form, {
            onError: e => { setErrors(e); setSaving(false); },
            onSuccess: () => setSaving(false),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Client" />
            <div className="p-6 max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <UserPlus className="h-6 w-6" />
                        {isConversion ? 'Convert to Client' : 'New Client'}
                    </h1>
                    {isConversion && <p className="text-sm text-muted-foreground mt-1">Pre-filled from {prefill._lead_id ? 'lead' : 'opportunity'} contact info. Review and confirm.</p>}
                </div>

                <Card className="p-6 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Full Name *</label>
                            <Input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="Jane Doe" />
                            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Email *</label>
                            <Input type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} placeholder="jane@acme.com" />
                            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Phone</label>
                            <Input value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} placeholder="+254 700 000000" />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Company / Organisation</label>
                            <Input value={form.company} onChange={e => setForm(f=>({...f,company:e.target.value}))} placeholder="Acme Corp" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-sm font-medium mb-1.5 block">Address</label>
                            <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[72px]"
                                value={form.address} onChange={e => setForm(f=>({...f,address:e.target.value}))} placeholder="Physical / mailing address" />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Client Since</label>
                            <Input type="date" value={form.client_since} onChange={e => setForm(f=>({...f,client_since:e.target.value}))} />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-sm font-medium mb-1.5 block">Notes</label>
                            <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                                value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} placeholder="Any relevant context about this client…" />
                        </div>
                    </div>
                </Card>

                <div className="flex gap-3">
                    <Button onClick={submit} disabled={saving || !form.name || !form.email}>
                        {saving ? 'Saving…' : isConversion ? 'Convert to Client' : 'Create Client'}
                    </Button>
                    <Button variant="outline" onClick={() => history.back()}>Cancel</Button>
                </div>
            </div>
        </AppLayout>
    );
}