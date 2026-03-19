import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type BreadcrumbItem } from '@/types';
import { Mail, Phone, Globe, MapPin, Star, Edit, Package, ShoppingCart, Plus, TrendingUp } from 'lucide-react';

const fmt = (n:number,c='USD')=>new Intl.NumberFormat('en-US',{style:'currency',currency:c}).format(n);
const fmtDate = (d:string)=>new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
const PO_COLORS: Record<string,string> = { draft:'bg-gray-100 text-gray-700', sent:'bg-blue-100 text-blue-700', confirmed:'bg-indigo-100 text-indigo-700', delivered:'bg-green-100 text-green-700', cancelled:'bg-red-100 text-red-700' };

interface Props {
    supplier: any;
    products: any[];
    recentOrders: any[];
    stats: { total_orders:number; total_spent:number; products_count:number; pending_orders:number };
}

export default function SupplierShow({ supplier, products, recentOrders, stats }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [{ title:'Suppliers',href:'/suppliers'},{title:supplier.name,href:`/suppliers/${supplier.id}`}];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={supplier.name} />
            <div className="p-6 space-y-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold">{supplier.name}</h1>
                            {supplier.category && <Badge variant="outline">{supplier.category}</Badge>}
                            {!supplier.active && <Badge className="bg-red-100 text-red-700">Inactive</Badge>}
                        </div>
                        {supplier.contact_person && <p className="text-muted-foreground mt-0.5">{supplier.contact_person}</p>}
                        {supplier.rating > 0 && <div className="flex items-center gap-1 mt-1 text-amber-500"><Star className="h-4 w-4 fill-current"/><span className="text-sm font-medium">{supplier.rating}/5</span></div>}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild><Link href={`/suppliers/${supplier.id}/edit`}><Edit className="h-4 w-4 mr-1.5"/>Edit</Link></Button>
                        <Button size="sm" asChild><Link href={`/purchase-orders/create?supplier_id=${supplier.id}`}><ShoppingCart className="h-4 w-4 mr-1.5"/>New PO</Link></Button>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[['Total Orders',stats.total_orders,'text-blue-600'],['Total Spent',fmt(stats.total_spent),'text-gray-700'],['Products',stats.products_count,'text-amber-600'],['Pending',stats.pending_orders,'text-indigo-600']].map(([l,v,c]:any)=>(
                        <Card key={l} className="p-4"><p className="text-xs text-muted-foreground uppercase tracking-wider">{l}</p><p className={`text-xl font-bold mt-1 ${c}`}>{v}</p></Card>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Contact Info */}
                    <Card className="p-5 space-y-3">
                        <h2 className="font-semibold text-sm">Contact Info</h2>
                        <div className="space-y-2.5 text-sm">
                            {supplier.email && <a href={`mailto:${supplier.email}`} className="flex items-center gap-2 hover:text-primary"><Mail className="h-4 w-4 text-muted-foreground"/>{supplier.email}</a>}
                            {supplier.phone && <a href={`tel:${supplier.phone}`} className="flex items-center gap-2 hover:text-primary"><Phone className="h-4 w-4 text-muted-foreground"/>{supplier.phone}</a>}
                            {supplier.website && <a href={supplier.website} target="_blank" className="flex items-center gap-2 hover:text-primary text-xs break-all"><Globe className="h-4 w-4 text-muted-foreground flex-shrink-0"/>{supplier.website}</a>}
                            {supplier.address && <p className="flex items-start gap-2 text-muted-foreground text-xs"><MapPin className="h-4 w-4 flex-shrink-0 mt-0.5"/>{supplier.address}</p>}
                            {supplier.payment_terms && <div className="pt-2 border-t"><p className="text-xs font-medium text-muted-foreground">Payment Terms</p><p className="text-sm">{supplier.payment_terms}</p></div>}
                            {supplier.notes && <div className="pt-2 border-t"><p className="text-xs text-muted-foreground whitespace-pre-wrap">{supplier.notes}</p></div>}
                        </div>
                    </Card>

                    {/* Products */}
                    <Card className="p-5 lg:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold">Products / Catalog</h2>
                            <Button size="sm" variant="outline" asChild><Link href={`/products/create?supplier_id=${supplier.id}`}><Plus className="h-3.5 w-3.5 mr-1"/>Add Product</Link></Button>
                        </div>
                        {products.length === 0
                            ? <p className="text-sm text-muted-foreground text-center py-6">No products catalogued for this supplier</p>
                            : <table className="w-full text-sm">
                                <thead><tr className="border-b text-left text-muted-foreground text-xs"><th className="pb-2">Name</th><th className="pb-2">SKU</th><th className="pb-2 text-right">Cost</th><th className="pb-2 text-right">Price</th><th className="pb-2 text-right">Margin</th></tr></thead>
                                <tbody className="divide-y">
                                    {products.map((p:any)=>{
                                        const margin = p.unit_cost>0?Math.round((p.unit_price-p.unit_cost)/p.unit_cost*100):0;
                                        return (
                                            <tr key={p.id} className="hover:bg-muted/30">
                                                <td className="py-2"><Link href={`/products/${p.id}`} className="text-primary hover:underline">{p.name}</Link></td>
                                                <td className="py-2 text-muted-foreground font-mono text-xs">{p.sku||'—'}</td>
                                                <td className="py-2 text-right">{fmt(p.unit_cost)}</td>
                                                <td className="py-2 text-right font-medium">{fmt(p.unit_price)}</td>
                                                <td className="py-2 text-right"><span className={`flex items-center justify-end gap-0.5 text-xs ${margin>=0?'text-green-600':'text-red-600'}`}><TrendingUp className="h-3 w-3"/>{margin}%</span></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>}
                    </Card>
                </div>

                {/* Recent Orders */}
                <Card className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold">Recent Purchase Orders</h2>
                        <Button size="sm" variant="outline" asChild><Link href={`/purchase-orders/create?supplier_id=${supplier.id}`}><Plus className="h-3.5 w-3.5 mr-1.5"/>New PO</Link></Button>
                    </div>
                    {recentOrders.length === 0
                        ? <p className="text-sm text-muted-foreground text-center py-6">No purchase orders yet</p>
                        : <table className="w-full text-sm">
                            <thead><tr className="border-b text-left text-muted-foreground text-xs"><th className="pb-2">Number</th><th className="pb-2">Client</th><th className="pb-2">Date</th><th className="pb-2 text-right">Total</th><th className="pb-2 text-center">Status</th></tr></thead>
                            <tbody className="divide-y">
                                {recentOrders.map((o:any)=>(
                                    <tr key={o.id} className="hover:bg-muted/30">
                                        <td className="py-2"><Link href={`/purchase-orders/${o.id}`} className="text-primary hover:underline font-medium">{o.number}</Link></td>
                                        <td className="py-2 text-muted-foreground">{o.client?.company||o.client?.name||'—'}</td>
                                        <td className="py-2 text-muted-foreground">{o.order_date?fmtDate(o.order_date):'—'}</td>
                                        <td className="py-2 text-right font-medium">{fmt(o.total,o.currency)}</td>
                                        <td className="py-2 text-center"><Badge className={`text-xs capitalize ${PO_COLORS[o.status]??''}`}>{o.status.replace('_',' ')}</Badge></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>}
                </Card>
            </div>
        </AppLayout>
    );
}