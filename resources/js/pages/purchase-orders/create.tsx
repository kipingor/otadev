import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title:'Purchase Orders',href:'/purchase-orders'},{title:'New PO',href:'/purchase-orders/create'}];
interface LineItem { product_id:string; description:string; quantity:string; unit_price:string; [key: string]: string }
const emptyLine = (): LineItem => ({ product_id:'', description:'', quantity:'1', unit_price:'' });

interface Props {
    suppliers: any[];
    products: any[];
    clients: { id:number; name:string; company:string|null; address:string|null }[];
    projects: { id:number; name:string; client_id:number|null }[];
}

export default function PurchaseOrderCreate({ suppliers, products, clients, projects }: Props) {
    const [form, setForm] = useState({ supplier_id:'', client_id:'', project_id:'', order_date:new Date().toISOString().slice(0,10), expected_delivery_date:'', currency:'USD', shipping_address:'', notes:'', tax_rate:'0' });
    const [lines, setLines] = useState<LineItem[]>([emptyLine()]);
    const [errors, setErrors] = useState<Record<string,string>>({});
    const [saving, setSaving] = useState(false);
    const s = f => setForm(prev=>({...prev,...f}));

    const supplierProducts = form.supplier_id ? products.filter(p=>p.supplier_id===+form.supplier_id) : products;

    function pickProduct(i:number, productId:string) {
        const p = products.find(pr=>pr.id===+productId);
        setLines(prev=>prev.map((l,idx)=>idx===i ? {...l, product_id:productId, description:p?.name??l.description, unit_price:String(p?.unit_price??l.unit_price)} : l));
    }

    const subtotal = lines.reduce((s,l)=>(s+(+l.quantity||0)*(+l.unit_price||0)),0);
    const tax = subtotal*(+form.tax_rate||0)/100;
    const total = subtotal+tax;
    const fmt = (n:number) => new Intl.NumberFormat('en-US',{style:'currency',currency:form.currency||'USD'}).format(n);

    function submit() {
        setSaving(true);
        router.post('/purchase-orders', {...form, lines}, { onError:e=>{setErrors(e);setSaving(false);}, onSuccess:()=>setSaving(false) });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Purchase Order" />
            <div className="p-6 max-w-4xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold">New Purchase Order</h1>
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="p-6 space-y-4">
                            <h2 className="font-semibold">Order Details</h2>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">Supplier *</label>
                                    <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                                        value={form.supplier_id} onChange={e=>s({supplier_id:e.target.value})}>
                                        <option value="">Select supplier…</option>
                                        {suppliers.map(s2=><option key={s2.id} value={s2.id}>{s2.name}</option>)}
                                    </select>
                                    {errors.supplier_id && <p className="text-xs text-red-500 mt-1">{errors.supplier_id}</p>}
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">Client (end customer)</label>
                                    <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                                        value={form.client_id} onChange={e=>s({client_id:e.target.value})}>
                                        <option value="">Select client…</option>
                                        {clients.map(c=><option key={c.id} value={c.id}>{c.company||c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">Project (optional)</label>
                                    <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                                        value={form.project_id} onChange={e=>s({project_id:e.target.value})}>
                                        <option value="">No project</option>
                                        {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">Currency</label>
                                    <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                                        value={form.currency} onChange={e=>s({currency:e.target.value})}>
                                        {['USD','EUR','GBP','KES','ZAR'].map(c=><option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                        </Card>

                        {/* Line Items */}
                        <Card className="p-6">
                            <h2 className="font-semibold mb-4">Items to Order</h2>
                            <div className="space-y-2">
                                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
                                    <span className="col-span-4">Description</span><span className="col-span-3">Product</span>
                                    <span className="col-span-2 text-center">Qty</span><span className="col-span-2 text-right">Unit Cost</span><span className="col-span-1"></span>
                                </div>
                                {lines.map((line,i) => (
                                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                                        <Input className="col-span-4 h-8 text-sm" placeholder="Description *" value={line.description} onChange={e=>setLines(prev=>prev.map((l,idx)=>idx===i?{...l,description:e.target.value}:l))} />
                                        <select className="col-span-3 h-8 rounded-md border border-input bg-background px-2 text-xs"
                                            value={line.product_id} onChange={e=>pickProduct(i,e.target.value)}>
                                            <option value="">Custom</option>
                                            {supplierProducts.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                        <Input className="col-span-2 h-8 text-sm text-center" placeholder="1" value={line.quantity} onChange={e=>setLines(prev=>prev.map((l,idx)=>idx===i?{...l,quantity:e.target.value}:l))} />
                                        <Input className="col-span-2 h-8 text-sm text-right" placeholder="0.00" value={line.unit_price} onChange={e=>setLines(prev=>prev.map((l,idx)=>idx===i?{...l,unit_price:e.target.value}:l))} />
                                        <button className="col-span-1 flex justify-center text-muted-foreground hover:text-red-500" onClick={()=>setLines(prev=>prev.filter((_,idx)=>idx!==i))} disabled={lines.length===1}><Trash2 className="h-3.5 w-3.5"/></button>
                                    </div>
                                ))}
                            </div>
                            <Button variant="outline" size="sm" className="mt-3" onClick={()=>setLines(prev=>[...prev,emptyLine()])}>
                                <Plus className="h-3.5 w-3.5 mr-1"/>Add Item
                            </Button>
                        </Card>

                        <Card className="p-5 space-y-3">
                            <h2 className="font-semibold text-sm">Shipping Address</h2>
                            <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                                value={form.shipping_address} onChange={e=>s({shipping_address:e.target.value})} placeholder="Delivery address for goods…" />
                            <Input placeholder="Notes / instructions for supplier…" value={form.notes} onChange={e=>s({notes:e.target.value})} />
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        <Card className="p-5 space-y-3">
                            <h2 className="font-semibold text-sm">Dates</h2>
                            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Order Date *</label><Input type="date" value={form.order_date} onChange={e=>s({order_date:e.target.value})} /></div>
                            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Expected Delivery</label><Input type="date" value={form.expected_delivery_date} onChange={e=>s({expected_delivery_date:e.target.value})} /></div>
                            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Tax Rate (%)</label><Input type="number" min="0" max="100" step="0.1" value={form.tax_rate} onChange={e=>s({tax_rate:e.target.value})} /></div>
                        </Card>
                        <Card className="p-5 space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmt(subtotal)}</span></div>
                            {tax>0&&<div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{fmt(tax)}</span></div>}
                            <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span className="text-lg">{fmt(total)}</span></div>
                        </Card>
                        <Button className="w-full" onClick={submit} disabled={saving||!form.supplier_id}>{saving?'Saving…':'Create PO'}</Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}