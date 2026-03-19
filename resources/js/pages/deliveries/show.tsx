import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import { Truck, CheckCircle2, XCircle, FileText, CheckSquare, Package, PenLine } from 'lucide-react';
import { useState } from 'react';

const fmt = (d:string) => new Date(d).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
const STATUS_COLORS: Record<string,string> = { pending:'bg-gray-100 text-gray-700', in_transit:'bg-blue-100 text-blue-700', delivered:'bg-green-100 text-green-700', partial:'bg-amber-100 text-amber-700', rejected:'bg-red-100 text-red-700' };
const DOC_COLORS: Record<string,string> = { pending:'bg-amber-100 text-amber-700', approved:'bg-green-100 text-green-700', rejected:'bg-red-100 text-red-700' };

export default function DeliveryShow({ delivery }: { delivery: any }) {
    const breadcrumbs: BreadcrumbItem[] = [{ title:'Deliveries',href:'/deliveries'},{title:delivery.number,href:`/deliveries/${delivery.id}`}];
    const [signOffOpen, setSignOffOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [docOpen, setDocOpen] = useState(false);
    const [signForm, setSignForm] = useState({ signed_by:'', client_notes:'', delivered_date:new Date().toISOString().slice(0,10) });
    const [rejectForm, setRejectForm] = useState({ signed_by:'', client_notes:'' });
    const [docForm, setDocForm] = useState({ type:'grn', title:'', notes:'' });

    function dispatch() { router.post(`/deliveries/${delivery.id}/dispatch`,{},{preserveScroll:true}); }
    function deliver() { router.post(`/deliveries/${delivery.id}/deliver`, signForm, { onSuccess:()=>setSignOffOpen(false), preserveScroll:true }); }
    function reject() { router.post(`/deliveries/${delivery.id}/reject`, rejectForm, { onSuccess:()=>setRejectOpen(false), preserveScroll:true }); }
    function uploadDoc() { router.post(`/deliveries/${delivery.id}/documents`, docForm, { onSuccess:()=>setDocOpen(false), preserveScroll:true }); }
    function approveDoc(docId:number, action:string) { router.post(`/delivery-documents/${docId}/approve`, { action }, { preserveScroll:true }); }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Delivery ${delivery.number}`} />
            <div className="p-6 max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3"><h1 className="text-2xl font-bold">{delivery.number}</h1><Badge className={`capitalize ${STATUS_COLORS[delivery.status]??''}`}>{delivery.status.replace('_',' ')}</Badge></div>
                        <p className="text-muted-foreground text-sm mt-0.5">PO: <Link href={`/purchase-orders/${delivery.purchase_order?.id}`} className="hover:underline text-primary">{delivery.purchase_order?.number}</Link></p>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                        {delivery.status==='pending'    && <Button variant="outline" size="sm" onClick={dispatch}><Truck className="h-4 w-4 mr-1.5"/>Mark In Transit</Button>}
                        {delivery.status==='in_transit' && <Button size="sm" onClick={()=>setSignOffOpen(true)}><PenLine className="h-4 w-4 mr-1.5"/>Client Sign-off</Button>}
                        {delivery.status==='in_transit' && <Button variant="outline" size="sm" className="text-red-600" onClick={()=>setRejectOpen(true)}><XCircle className="h-4 w-4 mr-1.5"/>Reject</Button>}
                        <Button variant="outline" size="sm" onClick={()=>setDocOpen(true)}><FileText className="h-4 w-4 mr-1.5"/>Add Document</Button>
                    </div>
                </div>

                {/* Client Sign-off Panel */}
                {signOffOpen && (
                    <Card className="p-5 border-green-200 bg-green-50/20">
                        <h3 className="font-semibold mb-1 flex items-center gap-2"><PenLine className="h-4 w-4"/>Client Delivery Sign-off</h3>
                        <p className="text-sm text-muted-foreground mb-4">Record the client's acceptance of this delivery. A GRN will be auto-generated.</p>
                        <div className="grid sm:grid-cols-2 gap-3 mb-4">
                            <div><label className="text-xs font-medium mb-1 block">Signed By (client name) *</label><Input placeholder="Full name of person signing" value={signForm.signed_by} onChange={e=>setSignForm(f=>({...f,signed_by:e.target.value}))}/></div>
                            <div><label className="text-xs font-medium mb-1 block">Delivery Date *</label><Input type="date" value={signForm.delivered_date} onChange={e=>setSignForm(f=>({...f,delivered_date:e.target.value}))}/></div>
                            <div className="sm:col-span-2"><label className="text-xs font-medium mb-1 block">Client Notes / Remarks</label><textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={2} value={signForm.client_notes} onChange={e=>setSignForm(f=>({...f,client_notes:e.target.value}))} placeholder="Any comments from the client about the delivery…"/></div>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={deliver} disabled={!signForm.signed_by}><CheckCircle2 className="h-4 w-4 mr-1.5"/>Confirm Delivery & Generate GRN</Button>
                            <Button variant="outline" onClick={()=>setSignOffOpen(false)}>Cancel</Button>
                        </div>
                    </Card>
                )}

                {/* Reject Panel */}
                {rejectOpen && (
                    <Card className="p-5 border-red-200 bg-red-50/20">
                        <h3 className="font-semibold mb-3 text-red-700">Record Delivery Rejection</h3>
                        <div className="grid sm:grid-cols-2 gap-3 mb-3">
                            <div><label className="text-xs font-medium mb-1 block">Rejected By</label><Input value={rejectForm.signed_by} onChange={e=>setRejectForm(f=>({...f,signed_by:e.target.value}))}/></div>
                            <div><label className="text-xs font-medium mb-1 block">Reason *</label><Input placeholder="Why was delivery rejected?" value={rejectForm.client_notes} onChange={e=>setRejectForm(f=>({...f,client_notes:e.target.value}))}/></div>
                        </div>
                        <div className="flex gap-2"><Button variant="destructive" onClick={reject} disabled={!rejectForm.client_notes}>Record Rejection</Button><Button variant="outline" onClick={()=>setRejectOpen(false)}>Cancel</Button></div>
                    </Card>
                )}

                {/* Add Document Panel */}
                {docOpen && (
                    <Card className="p-5 border-amber-200 bg-amber-50/20">
                        <h3 className="font-semibold mb-4">Attach Document</h3>
                        <div className="grid sm:grid-cols-3 gap-3 mb-3">
                            <div><label className="text-xs font-medium mb-1 block">Type</label>
                                <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={docForm.type} onChange={e=>setDocForm(f=>({...f,type:e.target.value}))}>
                                    {[['grn','GRN'],['delivery_note','Delivery Note'],['contract','Contract'],['invoice','Invoice'],['other','Other']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
                                </select>
                            </div>
                            <div className="sm:col-span-2"><label className="text-xs font-medium mb-1 block">Title *</label><Input value={docForm.title} onChange={e=>setDocForm(f=>({...f,title:e.target.value}))}/></div>
                        </div>
                        <div className="flex gap-2"><Button onClick={uploadDoc} disabled={!docForm.title}>Attach</Button><Button variant="outline" onClick={()=>setDocOpen(false)}>Cancel</Button></div>
                    </Card>
                )}

                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Items */}
                        <Card className="p-6">
                            <h2 className="font-semibold mb-4 flex items-center gap-2"><Package className="h-4 w-4"/>Items</h2>
                            <table className="w-full text-sm">
                                <thead><tr className="border-b text-left text-muted-foreground"><th className="pb-2">Description</th><th className="pb-2 text-center">Qty</th><th className="pb-2 text-right">Unit Price</th><th className="pb-2 text-right">Amount</th></tr></thead>
                                <tbody className="divide-y">
                                    {(delivery.items||[]).map((l:any,i:number)=>(
                                        <tr key={i}><td className="py-2">{l.description}</td><td className="py-2 text-center">{l.quantity}</td><td className="py-2 text-right">{l.unit_price != null?`$${l.unit_price}`:'—'}</td><td className="py-2 text-right">{l.amount != null?`$${l.amount}`:'—'}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </Card>

                        {/* Documents */}
                        <Card className="p-6">
                            <h2 className="font-semibold mb-4 flex items-center gap-2"><FileText className="h-4 w-4"/>Documents</h2>
                            {delivery.documents?.length===0
                                ? <p className="text-sm text-muted-foreground text-center py-4">No documents attached</p>
                                : delivery.documents?.map((d:any)=>(
                                    <div key={d.id} className="flex items-center justify-between p-3 border rounded-lg mb-2">
                                        <div>
                                            <p className="text-sm font-medium">{d.title}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{d.type.replace('_',' ')} · {d.uploader?.name}</p>
                                            {d.notes && <p className="text-xs text-muted-foreground italic">{d.notes}</p>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className={`text-xs ${DOC_COLORS[d.status]??''}`}>{d.status}</Badge>
                                            {d.status==='pending' && (
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="sm" className="h-7 px-2 text-green-600" onClick={()=>approveDoc(d.id,'approved')}><CheckSquare className="h-3.5 w-3.5"/></Button>
                                                    <Button variant="ghost" size="sm" className="h-7 px-2 text-red-600" onClick={()=>approveDoc(d.id,'rejected')}><XCircle className="h-3.5 w-3.5"/></Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4 text-sm">
                        {delivery.status==='delivered' && (
                            <Card className="p-5 bg-green-50 border-green-200">
                                <div className="flex items-center gap-2 text-green-700 font-semibold mb-2"><CheckCircle2 className="h-4 w-4"/>Delivery Confirmed</div>
                                <div className="space-y-1 text-xs text-green-700">
                                    <p>Signed by: <strong>{delivery.signed_by}</strong></p>
                                    {delivery.delivered_date && <p>Date: {fmt(delivery.delivered_date)}</p>}
                                    {delivery.client_notes && <p className="italic mt-1">"{delivery.client_notes}"</p>}
                                </div>
                            </Card>
                        )}
                        {delivery.client && (
                            <Card className="p-5 space-y-1">
                                <h3 className="font-semibold">Client</h3>
                                <Link href={`/clients/${delivery.client.id}`} className="text-primary hover:underline font-medium">{delivery.client.company||delivery.client.name}</Link>
                                {delivery.client.address && <p className="text-xs text-muted-foreground">{delivery.client.address}</p>}
                                {delivery.client.phone && <p className="text-xs text-muted-foreground">{delivery.client.phone}</p>}
                            </Card>
                        )}
                        {delivery.carrier && (
                            <Card className="p-5 space-y-1">
                                <h3 className="font-semibold">Carrier</h3>
                                <p>{delivery.carrier}</p>
                                {delivery.tracking_number && <p className="text-muted-foreground font-mono text-xs">{delivery.tracking_number}</p>}
                                {delivery.tracking_url && <a href={delivery.tracking_url} target="_blank" className="text-primary text-xs hover:underline">Track shipment →</a>}
                            </Card>
                        )}
                        {delivery.delivery_notes && <Card className="p-5"><h3 className="font-semibold mb-1">Notes</h3><p className="text-xs text-muted-foreground whitespace-pre-wrap">{delivery.delivery_notes}</p></Card>}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}