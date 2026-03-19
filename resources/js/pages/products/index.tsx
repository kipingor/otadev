import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { type BreadcrumbItem } from '@/types';
import { Plus, Search, Package, TrendingUp } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title:'Products', href:'/products' }];
const fmt = (n:number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);

interface Props {
    products: { data: any[]; total: number; current_page: number; last_page: number };
    categories: string[];
    suppliers: { id:number; name:string }[];
}

export default function ProductsIndex({ products, categories, suppliers }: Props) {
    const [search, setSearch] = useState('');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products" />
            <div className="p-6 space-y-6 max-w-6xl mx-auto">
                <div className="flex items-center justify-between">
                    <div><h1 className="text-2xl font-bold">Products</h1><p className="text-sm text-muted-foreground mt-0.5">{products.total} products in catalog</p></div>
                    <Button asChild><Link href="/products/create"><Plus className="h-4 w-4 mr-1.5"/>Add Product</Link></Button>
                </div>

                <div className="flex gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"/>
                        <Input placeholder="Search by name or SKU…" className="pl-9" value={search}
                            onChange={e => { setSearch(e.target.value); router.get('/products', e.target.value ? { search: e.target.value } : {}, { preserveScroll:true }); }} />
                    </div>
                    <select className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-[140px]"
                        onChange={e => router.get('/products', e.target.value ? { category: e.target.value } : {})}>
                        <option value="">All categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-[150px]"
                        onChange={e => router.get('/products', e.target.value ? { supplier_id: e.target.value } : {})}>
                        <option value="">All suppliers</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>

                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="border-b text-left text-muted-foreground">
                                <th className="px-4 py-3 font-medium">Product</th>
                                <th className="px-4 py-3 font-medium">SKU</th>
                                <th className="px-4 py-3 font-medium">Supplier</th>
                                <th className="px-4 py-3 font-medium">Category</th>
                                <th className="px-4 py-3 font-medium text-right">Cost</th>
                                <th className="px-4 py-3 font-medium text-right">Price</th>
                                <th className="px-4 py-3 font-medium text-right">Margin</th>
                                <th className="px-4 py-3 font-medium text-center">Stock</th>
                                <th className="px-4 py-3 font-medium text-center">Active</th>
                            </tr></thead>
                            <tbody className="divide-y">
                                {products.data.map((p:any) => {
                                    const margin = p.unit_cost > 0 ? Math.round((p.unit_price - p.unit_cost) / p.unit_cost * 100) : 0;
                                    return (
                                        <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <Link href={`/products/${p.id}`} className="font-medium text-primary hover:underline flex items-center gap-2">
                                                    <Package className="h-4 w-4 text-muted-foreground"/>{p.name}
                                                </Link>
                                                {p.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.description}</p>}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.sku || '—'}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{p.supplier?.name || '—'}</td>
                                            <td className="px-4 py-3">{p.category ? <Badge variant="outline" className="text-xs">{p.category}</Badge> : '—'}</td>
                                            <td className="px-4 py-3 text-right">{fmt(p.unit_cost)}</td>
                                            <td className="px-4 py-3 text-right font-medium">{fmt(p.unit_price)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`text-xs font-medium flex items-center justify-end gap-0.5 ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    <TrendingUp className="h-3 w-3"/>{margin}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-muted-foreground">{p.stock_qty ?? '—'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <div className={`inline-block h-2 w-2 rounded-full ${p.active ? 'bg-green-500' : 'bg-gray-300'}`}/>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {products.data.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <Package className="h-8 w-8 mx-auto mb-2 opacity-30"/>
                                <p>No products yet. <Link href="/products/create" className="text-primary hover:underline">Add your first product</Link></p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}