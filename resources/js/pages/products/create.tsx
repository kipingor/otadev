import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title:'Products',href:'/products'},{title:'Add Product',href:'/products/create'}];

interface Props { suppliers: { id:number; name:string }[] }

export default function ProductCreate({ suppliers }: Props) {
    const [form, setForm] = useState({ name:'',sku:'',description:'',category:'',unit:'pcs',unit_cost:'',unit_price:'',stock_qty:'0',supplier_id:'',active:true });
    const [errors, setErrors] = useState<Record<string,string>>({});
    const [saving, setSaving] = useState(false);
    const s = f => setForm(prev=>({...prev,...f}));

    const margin = form.unit_cost && form.unit_price
        ? Math.round((+form.unit_price - +form.unit_cost) / +form.unit_cost * 100) : null;

    function submit() {
        setSaving(true);
        router.post('/products', form, { onError:e=>{setErrors(e);setSaving(false);}, onSuccess:()=>setSaving(false) });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add Product" />
            <div className="p-6 max-w-2xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold">Add Product</h1>
                <Card className="p-6 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="text-sm font-medium mb-1.5 block">Product Name *</label>
                            <Input value={form.name} onChange={e=>s({name:e.target.value})} placeholder="e.g. Dell Laptop OptiPlex 7090" />
                            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">SKU / Item Code</label>
                            <Input value={form.sku} onChange={e=>s({sku:e.target.value})} placeholder="DELL-7090-I5" />
                            {errors.sku && <p className="text-xs text-red-500 mt-1">{errors.sku}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Category</label>
                            <Input value={form.category} onChange={e=>s({category:e.target.value})} placeholder="Computers, Networking…" />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Supplier</label>
                            <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                                value={form.supplier_id} onChange={e=>s({supplier_id:e.target.value})}>
                                <option value="">No supplier</option>
                                {suppliers.map(s2=><option key={s2.id} value={s2.id}>{s2.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Unit</label>
                            <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                                value={form.unit} onChange={e=>s({unit:e.target.value})}>
                                {['pcs','each','box','kg','litre','licence','service','hour'].map(u=><option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Cost Price *</label>
                            <Input type="number" min="0" step="0.01" value={form.unit_cost} onChange={e=>s({unit_cost:e.target.value})} placeholder="0.00" />
                            {errors.unit_cost && <p className="text-xs text-red-500 mt-1">{errors.unit_cost}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Selling Price *
                                {margin !== null && <span className={`ml-2 text-xs font-normal ${margin>=0?'text-green-600':'text-red-600'}`}>({margin}% margin)</span>}
                            </label>
                            <Input type="number" min="0" step="0.01" value={form.unit_price} onChange={e=>s({unit_price:e.target.value})} placeholder="0.00" />
                            {errors.unit_price && <p className="text-xs text-red-500 mt-1">{errors.unit_price}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Initial Stock Qty</label>
                            <Input type="number" min="0" value={form.stock_qty} onChange={e=>s({stock_qty:e.target.value})} />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-sm font-medium mb-1.5 block">Description</label>
                            <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                                value={form.description} onChange={e=>s({description:e.target.value})} placeholder="Technical specs, notes…" />
                        </div>
                    </div>
                </Card>
                <div className="flex gap-3">
                    <Button onClick={submit} disabled={saving||!form.name||!form.unit_cost||!form.unit_price}>{saving?'Saving…':'Add Product'}</Button>
                    <Button variant="outline" onClick={()=>history.back()}>Cancel</Button>
                </div>
            </div>
        </AppLayout>
    );
}