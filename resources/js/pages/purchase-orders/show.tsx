import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import { Send, CheckCircle, X, Truck, FileText, CheckSquare, XCircle, Package } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useState } from 'react';

const fmt = (n:number,c='USD')=>new Intl.NumberFormat('en-US',{style:'currency',currency:c}).format(n);
const fmtDate = (d:string)=>new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
const STATUS_COLORS: Record<string,string> = { draft:'bg-gray-100 text-gray-700', sent:'bg-blue-100 text-blue-700', confirmed:'bg-indigo-100 text-indigo-700', partially_delivered:'bg-amber-100 text-amber-700', delivered:'bg-green-100 text-green-700', cancelled:'bg-red-100 text-red-700' };
const DOC_COLORS: Record<string,string> = { pending:'bg-amber-100 text-amber-700', approved:'bg-green-100 text-green-700', rejected:'bg-red-100 text-red-700' };

export default function PurchaseOrderShow({ order }: { order: any }) {
    const breadcrumbs: BreadcrumbItem[] = [{ title:'Purchase Orders',href:'/purchase-orders'},{title:order.number,href:`/purchase-orders/${order.id}`}];
    const [deliveryOpen, setDeliveryOpen] = useState(false);
    const [docOpen, setDocOpen] = useState(false);
    const [delivForm, setDelivForm] = useState({ carrier:'', tracking_number:'', tracking_url:'', expected_date:'', delivery_notes:'' });
    const [docForm, setDocForm] = useState({ type:'delivery_note', title:'', notes:'' });

    function createDelivery() {
        router.post(`/purchase-orders/${order.id}/deliveries`, delivForm, { onSuccess:()=>setDeliveryOpen(false), preserveScroll:true });
    }
    function uploadDoc() {
        router.post(`/purchase-orders/${order.id}/documents`, docForm, { onSuccess:()=>setDocOpen(false), preserveScroll:true });
    }

    const canSend     = order.status === 'draft';
    const canConfirm  = order.status === 'sent';
    const canDeliver  = ['confirmed','partially_delivered'].includes(order.status);
    const canCancel   = !['delivered','cancelled'].includes(order.status);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={order.number} />
            <div className="p-6 max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3"><h1 className="text-2xl font-bold">{order.number}</h1><Badge className={`capitalize ${STATUS_COLORS[order.status]??''}`}>{order.status.replace('_',' ')}</Badge></div>
                        <p className="text-muted-foreground text-sm mt-0.5">{order.supplier?.name} → {order.client?.company||order.client?.name||'No client'}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                        {canSend    && <Button variant="outline" size="sm" onClick={()=>router.post(`/purchase-orders/${order.id}/send`,{},{preserveScroll:true})}><Send className="h-4 w-4 mr-1.5"/>Send to Supplier</Button>}
                        {canConfirm && <Button variant="outline" size="sm" onClick={()=>router.post(`/purchase-orders/${order.id}/confirm`,{},{preserveScroll:true})}><CheckCircle className="h-4 w-4 mr-1.5"/>Mark Confirmed</Button>}
                        {canDeliver && <Button size="sm" onClick={()=>setDeliveryOpen(true)}><Truck className="h-4 w-4 mr-1.5"/>Create Delivery</Button>}
                        {canCancel  && <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={()=>{if(confirm('Cancel this PO?'))router.post(`/purchase-orders/${order.id}/cancel`,{},{preserveScroll:true})}}><X className="h-4 w-4 mr-1.5"/>Cancel</Button>}
                        <Button variant="outline" size="sm" onClick={()=>setDocOpen(true)}><FileText className="h-4 w-4 mr-1.5"/>Add Document</Button>
                    </div>
                </div>

                {/* Create Delivery Panel */}
                {deliveryOpen && (
                    <Card className="p-5 border-blue-200 bg-blue-50/20">
                        <h3 className="font-semibold mb-4">Create Delivery</h3>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                            <div><label className="text-xs font-medium mb-1 block">Carrier / Courier</label><Input placeholder="DHL, G4S, Own transport…" value={delivForm.carrier} onChange={e=>setDelivForm(f=>({...f,carrier:e.target.value}))}/></div>
                            <div><label className="text-xs font-medium mb-1 block">Tracking Number</label><Input value={delivForm.tracking_number} onChange={e=>setDelivForm(f=>({...f,tracking_number:e.target.value}))}/></div>
                            <div><label className="text-xs font-medium mb-1 block">Expected Delivery Date</label><Input type="date" value={delivForm.expected_date} onChange={e=>setDelivForm(f=>({...f,expected_date:e.target.value}))}/></div>
                            <div className="sm:col-span-3"><label className="text-xs font-medium mb-1 block">Notes</label><Input value={delivForm.delivery_notes} onChange={e=>setDelivForm(f=>({...f,delivery_notes:e.target.value}))}/></div>
                        </div>
                        <div className="flex gap-2"><Button onClick={createDelivery}>Create Delivery</Button><Button variant="outline" onClick={()=>setDeliveryOpen(false)}>Cancel</Button></div>
                    </Card>
                )}

                {/* Add Document Panel */}
                {docOpen && (
                    <Card className="p-5 border-amber-200 bg-amber-50/20">
                        <h3 className="font-semibold mb-4">Attach Document</h3>
                        <div className="grid sm:grid-cols-3 gap-3 mb-3">
                            <div><label className="text-xs font-medium mb-1 block">Document Type</label>
                                <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={docForm.type} onChange={e=>setDocForm(f=>({...f,type:e.target.value}))}>
                                    {[['grn','GRN'],['delivery_note','Delivery Note'],['contract','Contract / Agreement'],['invoice','Supplier Invoice'],['other','Other']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
                                </select>
                            </div>
                            <div className="sm:col-span-2"><label className="text-xs font-medium mb-1 block">Title *</label><Input placeholder="e.g. Supplier contract for computers" value={docForm.title} onChange={e=>setDocForm(f=>({...f,title:e.target.value}))}/></div>
                            <div className="sm:col-span-3"><label className="text-xs font-medium mb-1 block">Notes</label><Input value={docForm.notes} onChange={e=>setDocForm(f=>({...f,notes:e.target.value}))}/></div>
                        </div>
                        <div className="flex gap-2"><Button onClick={uploadDoc} disabled={!docForm.title}>Add Document</Button><Button variant="outline" onClick={()=>setDocOpen(false)}>Cancel</Button></div>
                    </Card>
                )}

                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Line Items */}
                        <Card className="p-6">
                            <h2 className="font-semibold mb-4 flex items-center gap-2"><Package className="h-4 w-4"/>Items Ordered</h2>
                            <table className="w-full text-sm">
                                <thead><tr className="border-b text-left text-muted-foreground"><th className="pb-2">Description</th><th className="pb-2 text-center">Qty</th><th className="pb-2 text-right">Unit Price</th><th className="pb-2 text-right">Amount</th></tr></thead>
                                <tbody className="divide-y">
                                    {(order.lines||[]).map((l:any,i:number)=>(
                                        <tr key={i}><td className="py-2">{l.description}</td><td className="py-2 text-center">{l.quantity}</td><td className="py-2 text-right">{fmt(l.unit_price,order.currency)}</td><td className="py-2 text-right font-medium">{fmt(l.amount,order.currency)}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="border-t pt-3 mt-2 space-y-1 text-sm">
                                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmt(order.subtotal,order.currency)}</span></div>
                                {+order.tax>0&&<div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{fmt(order.tax,order.currency)}</span></div>}
                                <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span>{fmt(order.total,order.currency)}</span></div>
                            </div>
                        </Card>

                        {/* Deliveries */}
                        {order.deliveries?.length > 0 && (
                            <Card className="p-6">
                                <h2 className="font-semibold mb-4 flex items-center gap-2"><Truck className="h-4 w-4"/>Deliveries</h2>
                                <div className="space-y-3">
                                    {order.deliveries.map((d:any)=>(
                                        <div key={d.id} className="border rounded-lg p-3">
                                            <div className="flex items-center justify-between">
                                                <Link href={`/deliveries/${d.id}`} className="font-medium text-sm text-primary hover:underline">{d.number}</Link>
                                                <Badge className={`text-xs capitalize ${STATUS_COLORS[d.status]??''}`}>{d.status}</Badge>
                                            </div>
                                            {d.carrier&&<p className="text-xs text-muted-foreground mt-0.5">Carrier: {d.carrier} {d.tracking_number?`· ${d.tracking_number}`:''}</p>}
                                            {d.expected_date&&<p className="text-xs text-muted-foreground">Expected: {fmtDate(d.expected_date)}</p>}
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Documents */}
                        {order.documents?.length > 0 && (
                            <Card className="p-6">
                                <h2 className="font-semibold mb-4 flex items-center gap-2"><FileText className="h-4 w-4"/>Documents</h2>
                                <div className="space-y-2">
                                    {order.documents.map((d:any)=>(
                                        <div key={d.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div><p className="text-sm font-medium">{d.title}</p><p className="text-xs text-muted-foreground capitalize">{d.type.replace('_',' ')} · Uploaded by {d.uploader?.name}</p></div>
                                            <Badge className={`text-xs ${DOC_COLORS[d.status]??''}`}>{d.status}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4 text-sm">
                        <Card className="p-5 space-y-2">
                            <h3 className="font-semibold">Supplier</h3>
                            <p className="font-medium">{order.supplier?.name}</p>
                            {order.supplier?.contact_person&&<p className="text-muted-foreground">{order.supplier.contact_person}</p>}
                            {order.supplier?.email&&<a href={`mailto:${order.supplier.email}`} className="text-primary block hover:underline text-xs">{order.supplier.email}</a>}
                            {order.supplier?.phone&&<p className="text-muted-foreground text-xs">{order.supplier.phone}</p>}
                        </Card>
                        {order.client && (
                            <Card className="p-5 space-y-2">
                                <h3 className="font-semibold">Client</h3>
                                <Link href={`/clients/${order.client.id}`} className="font-medium text-primary hover:underline">{order.client.company||order.client.name}</Link>
                                {order.client.email&&<a href={`mailto:${order.client.email}`} className="block text-xs text-muted-foreground hover:text-primary">{order.client.email}</a>}
                            </Card>
                        )}
                        <Card className="p-5 space-y-2">
                            <h3 className="font-semibold">Dates</h3>
                            {order.order_date&&<div className="flex justify-between"><span className="text-muted-foreground">Ordered</span><span>{fmtDate(order.order_date)}</span></div>}
                            {order.expected_delivery_date&&<div className="flex justify-between"><span className="text-muted-foreground">Expected</span><span>{fmtDate(order.expected_delivery_date)}</span></div>}
                        </Card>
                        {order.notes&&<Card className="p-5"><h3 className="font-semibold mb-2">Notes</h3><p className="text-muted-foreground text-xs whitespace-pre-wrap">{order.notes}</p></Card>}
                        {order.shipping_address&&<Card className="p-5"><h3 className="font-semibold mb-2">Ship To</h3><p className="text-muted-foreground text-xs whitespace-pre-wrap">{order.shipping_address}</p></Card>}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}