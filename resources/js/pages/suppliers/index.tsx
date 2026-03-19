import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import { Plus, Search, Mail, Phone, Star, Package, ShoppingCart } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title:'Suppliers', href:'/suppliers' }];

interface Props {
    suppliers: { data:any[]; total:number; current_page:number; last_page:number };
    categories: string[];
}

export default function SuppliersIndex({ suppliers, categories }: Props) {
    const [search, setSearch] = useState('');

    function doSearch(q:string) { setSearch(q); router.get('/suppliers', q?{search:q}:{}, {preserveScroll:true}); }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Suppliers" />
            <div className="p-6 space-y-6 max-w-5xl mx-auto">
                <div className="flex items-center justify-between">
                    <div><h1 className="text-2xl font-bold">Suppliers</h1><p className="text-sm text-muted-foreground mt-0.5">{suppliers.total} suppliers</p></div>
                    <Button asChild><Link href="/suppliers/create"><Plus className="h-4 w-4 mr-1.5"/>Add Supplier</Link></Button>
                </div>

                <div className="flex gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"/>
                        <Input placeholder="Search suppliers…" className="pl-9" value={search} onChange={e=>doSearch(e.target.value)} />
                    </div>
                    <select className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-[150px]"
                        onChange={e=>router.get('/suppliers', e.target.value?{category:e.target.value}:{})}>
                        <option value="">All categories</option>
                        {categories.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div className="space-y-3">
                    {suppliers.data.map((s:any)=>(
                        <Card key={s.id} className="p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Link href={`/suppliers/${s.id}`} className="font-semibold hover:text-primary hover:underline">{s.name}</Link>
                                        {s.category && <Badge variant="outline" className="text-xs">{s.category}</Badge>}
                                        {!s.active && <Badge className="text-xs bg-red-100 text-red-700">Inactive</Badge>}
                                    </div>
                                    <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground flex-wrap">
                                        {s.contact_person && <span>{s.contact_person}</span>}
                                        {s.email && <a href={`mailto:${s.email}`} className="flex items-center gap-1 hover:text-primary"><Mail className="h-3 w-3"/>{s.email}</a>}
                                        {s.phone && <a href={`tel:${s.phone}`} className="flex items-center gap-1 hover:text-primary"><Phone className="h-3 w-3"/>{s.phone}</a>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
                                    <span className="flex items-center gap-1"><Package className="h-3.5 w-3.5"/>{s.products_count} products</span>
                                    <span className="flex items-center gap-1"><ShoppingCart className="h-3.5 w-3.5"/>{s.orders_count} POs</span>
                                    {s.rating > 0 && <span className="flex items-center gap-0.5 text-amber-500"><Star className="h-3.5 w-3.5 fill-current"/>{s.rating}</span>}
                                    <Button variant="outline" size="sm" asChild><Link href={`/suppliers/${s.id}`}>View</Link></Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                    {suppliers.data.length === 0 && (
                        <div className="text-center py-16 text-muted-foreground">
                            <p className="mb-4">No suppliers yet.</p>
                            <Button asChild><Link href="/suppliers/create">Add Supplier</Link></Button>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}