import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title:'Suppliers',href:'/suppliers'},{title:'Add Supplier',href:'/suppliers/create'}];

export default function SupplierCreate() {
    const [form, setForm] = useState({ name:'',email:'',phone:'',address:'',website:'',contact_person:'',payment_terms:'',category:'',notes:'',rating:'' });
    const [errors, setErrors] = useState<Record<string,string>>({});
    const [saving, setSaving] = useState(false);
    const s = f => setForm(prev=>({...prev,...f}));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add Supplier" />
            <div className="p-6 max-w-2xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold">Add Supplier</h1>
                <Card className="p-6 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="text-sm font-medium mb-1.5 block">Company Name *</label>
                            <Input value={form.name} onChange={e=>s({name:e.target.value})} placeholder="Acme Technologies Ltd" />
                            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Contact Person</label>
                            <Input value={form.contact_person} onChange={e=>s({contact_person:e.target.value})} placeholder="John Smith" />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Category</label>
                            <Input value={form.category} onChange={e=>s({category:e.target.value})} placeholder="IT, Hardware, Services…" />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Email</label>
                            <Input type="email" value={form.email} onChange={e=>s({email:e.target.value})} placeholder="sales@acme.com" />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Phone</label>
                            <Input value={form.phone} onChange={e=>s({phone:e.target.value})} placeholder="+254 700 000000" />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Website</label>
                            <Input type="url" value={form.website} onChange={e=>s({website:e.target.value})} placeholder="https://acme.com" />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Payment Terms</label>
                            <Input value={form.payment_terms} onChange={e=>s({payment_terms:e.target.value})} placeholder="Net 30, COD, 50% upfront…" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-sm font-medium mb-1.5 block">Address</label>
                            <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[72px]" value={form.address} onChange={e=>s({address:e.target.value})} />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-sm font-medium mb-1.5 block">Notes</label>
                            <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[72px]" value={form.notes} onChange={e=>s({notes:e.target.value})} />
                        </div>
                    </div>
                </Card>
                <div className="flex gap-3">
                    <Button onClick={()=>{setSaving(true);router.post('/suppliers',form,{onError:e=>{setErrors(e);setSaving(false);},onSuccess:()=>setSaving(false)});}} disabled={saving||!form.name}>{saving?'Saving…':'Add Supplier'}</Button>
                    <Button variant="outline" onClick={()=>history.back()}>Cancel</Button>
                </div>
            </div>
        </AppLayout>
    );
}