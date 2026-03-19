import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type BreadcrumbItem } from '@/types';
import { Truck } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title:'Deliveries', href:'/deliveries' }];
const fmtDate = (d:string) => new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
const STATUS_COLORS: Record<string,string> = { pending:'bg-gray-100 text-gray-700', in_transit:'bg-blue-100 text-blue-700', delivered:'bg-green-100 text-green-700', partial:'bg-amber-100 text-amber-700', rejected:'bg-red-100 text-red-700' };

interface Props {
    deliveries: { data:any[]; total:number; current_page:number; last_page:number };
    counts: Record<string,number>;
}

export default function DeliveriesIndex({ deliveries, counts }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Deliveries" />
            <div className="p-6 space-y-6 max-w-5xl mx-auto">
                <div className="flex items-center justify-between">
                    <div><h1 className="text-2xl font-bold">Deliveries</h1><p className="text-sm text-muted-foreground mt-0.5">{deliveries.total} total deliveries</p></div>
                </div>

                <div className="flex gap-2 flex-wrap">
                    {Object.entries(counts).map(([s,cnt])=>(
                        <Button key={s} variant="outline" size="sm" onClick={()=>router.get('/deliveries',{status:s},{preserveScroll:true})}>
                            <span className="capitalize">{s.replace('_',' ')}</span>
                            <Badge variant="secondary" className="ml-1.5 text-xs">{cnt}</Badge>
                        </Button>
                    ))}
                    <Button variant="ghost" size="sm" onClick={()=>router.get('/deliveries',{})}>All</Button>
                </div>

                <div className="space-y-3">
                    {deliveries.data.map((d:any)=>(
                        <Card key={d.id} className="p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg ${d.status==='delivered'?'bg-green-50':'bg-blue-50'}`}>
                                        <Truck className={`h-4 w-4 ${d.status==='delivered'?'text-green-600':'text-blue-600'}`}/>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Link href={`/deliveries/${d.id}`} className="font-semibold text-sm hover:text-primary hover:underline">{d.number}</Link>
                                            <Badge className={`text-xs capitalize ${STATUS_COLORS[d.status]??''}`}>{d.status.replace('_',' ')}</Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            PO: <Link href={`/purchase-orders/${d.purchase_order?.id}`} className="hover:underline">{d.purchase_order?.number}</Link>
                                            {d.purchase_order?.supplier && ` · ${d.purchase_order.supplier.name}`}
                                        </p>
                                        {d.client && <p className="text-xs text-muted-foreground">Client: {d.client.company||d.client.name}</p>}
                                        {d.carrier && <p className="text-xs text-muted-foreground">Carrier: {d.carrier} {d.tracking_number?`· ${d.tracking_number}`:''}</p>}
                                    </div>
                                </div>
                                <div className="text-right text-xs text-muted-foreground flex-shrink-0">
                                    {d.expected_date && <p>Expected: {fmtDate(d.expected_date)}</p>}
                                    {d.delivered_date && <p className="text-green-600">Delivered: {fmtDate(d.delivered_date)}</p>}
                                    {d.signed_by && <p className="text-green-600">Signed by: {d.signed_by}</p>}
                                </div>
                            </div>
                        </Card>
                    ))}
                    {deliveries.data.length===0 && (
                        <div className="text-center py-16 text-muted-foreground">
                            <Truck className="h-10 w-10 mx-auto mb-3 opacity-30"/>
                            <p>No deliveries yet. Create a delivery from a confirmed purchase order.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}