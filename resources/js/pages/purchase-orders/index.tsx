import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type BreadcrumbItem } from '@/types';
import { Plus, ShoppingCart } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title:'Purchase Orders', href:'/purchase-orders' }];
const fmt = (n:number,c='USD') => new Intl.NumberFormat('en-US',{style:'currency',currency:c}).format(n);
const fmtDate = (d:string) => new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
const STATUS_COLORS: Record<string,string> = {
    draft:'bg-gray-100 text-gray-700', sent:'bg-blue-100 text-blue-700', confirmed:'bg-indigo-100 text-indigo-700',
    partially_delivered:'bg-amber-100 text-amber-700', delivered:'bg-green-100 text-green-700', cancelled:'bg-red-100 text-red-700'
};

interface Props {
    orders: { data:any[]; total:number; current_page:number; last_page:number };
    suppliers: {id:number;name:string}[];
    counts: Record<string,number>;
}

export default function PurchaseOrdersIndex({ orders, suppliers, counts }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Purchase Orders" />
            <div className="p-6 space-y-6 max-w-6xl mx-auto">
                <div className="flex items-center justify-between">
                    <div><h1 className="text-2xl font-bold">Purchase Orders</h1><p className="text-sm text-muted-foreground mt-0.5">{orders.total} orders total</p></div>
                    <Button asChild><Link href="/purchase-orders/create"><Plus className="h-4 w-4 mr-1.5"/>New PO</Link></Button>
                </div>

                {/* Status tabs */}
                <div className="flex gap-2 flex-wrap">
                    {Object.entries(counts).map(([status, cnt]) => (
                        <Button key={status} variant="outline" size="sm"
                            onClick={() => router.get('/purchase-orders', { status }, { preserveScroll:true })}>
                            <span className="capitalize">{status.replace('_',' ')}</span>
                            <Badge variant="secondary" className="ml-1.5 text-xs">{cnt}</Badge>
                        </Button>
                    ))}
                    <Button variant="ghost" size="sm" onClick={() => router.get('/purchase-orders', {})}>All</Button>
                </div>

                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="border-b text-left text-muted-foreground">
                                <th className="px-4 py-3 font-medium">PO Number</th>
                                <th className="px-4 py-3 font-medium">Supplier</th>
                                <th className="px-4 py-3 font-medium">Client</th>
                                <th className="px-4 py-3 font-medium">Order Date</th>
                                <th className="px-4 py-3 font-medium">Expected</th>
                                <th className="px-4 py-3 font-medium text-right">Total</th>
                                <th className="px-4 py-3 font-medium text-center">Status</th>
                            </tr></thead>
                            <tbody className="divide-y">
                                {orders.data.map((o:any) => (
                                    <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-medium">
                                            <Link href={`/purchase-orders/${o.id}`} className="text-primary hover:underline">{o.number}</Link>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{o.supplier?.name}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{o.client?.company || o.client?.name || '—'}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{o.order_date ? fmtDate(o.order_date) : '—'}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{o.expected_delivery_date ? fmtDate(o.expected_delivery_date) : '—'}</td>
                                        <td className="px-4 py-3 text-right font-semibold">{fmt(o.total, o.currency)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge className={`text-xs capitalize ${STATUS_COLORS[o.status]??''}`}>{o.status.replace('_',' ')}</Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {orders.data.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-30"/>
                                <p>No purchase orders. <Link href="/purchase-orders/create" className="text-primary hover:underline">Create one</Link></p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}