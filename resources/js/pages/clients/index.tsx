import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { type BreadcrumbItem } from '@/types';
import { Plus, Search, Building2, Mail, Phone, FolderOpen, FileText } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Clients', href: '/clients' }];
const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(n);

interface Client { id: number; name: string; email: string; company: string | null; phone: string | null; client_since: string | null; projects_count: number; invoices_count: number; total_billed: number | null; }
interface Props { clients: { data: Client[]; total: number; last_page: number; current_page: number }; stats: { total: number; new_month: number; active: number }; }

export default function ClientsIndex({ clients, stats }: Props) {
    const [search, setSearch] = useState('');

    function doSearch(q: string) { setSearch(q); router.get('/clients', q ? { search: q } : {}, { preserveScroll: true }); }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Clients" />
            <div className="p-6 space-y-6 max-w-6xl mx-auto">
                <div className="flex items-center justify-between">
                    <div><h1 className="text-2xl font-bold tracking-tight">Clients</h1><p className="text-sm text-muted-foreground mt-0.5">Your CRM — all clients in one place</p></div>
                    <Button asChild><Link href="/clients/create"><Plus className="h-4 w-4 mr-1.5" />New Client</Link></Button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    {[['Total Clients', stats.total, 'text-blue-600'], ['New This Month', stats.new_month, 'text-green-600'], ['Active Projects', stats.active, 'text-amber-600']].map(([l, v, c]: any) => (
                        <Card key={l} className="p-4"><p className="text-xs text-muted-foreground uppercase tracking-wider">{l}</p><p className={`text-2xl font-bold mt-1 ${c}`}>{v}</p></Card>
                    ))}
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search clients by name, email, company…" className="pl-9" value={search} onChange={e => doSearch(e.target.value)} />
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {clients.data.map(c => (
                        <Link key={c.id} href={`/clients/${c.id}`}>
                            <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer h-full">
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <span className="text-blue-700 font-semibold text-sm">{c.name.slice(0,2).toUpperCase()}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm truncate">{c.name}</p>
                                        {c.company && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Building2 className="h-3 w-3" />{c.company}</p>}
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Mail className="h-3 w-3" />{c.email}</p>
                                        {c.phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mt-3 pt-3 border-t text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><FolderOpen className="h-3 w-3" />{c.projects_count} projects</span>
                                    <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{c.invoices_count} invoices</span>
                                    {c.total_billed && <span className="ml-auto font-semibold text-foreground">{fmt(c.total_billed)}</span>}
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>

                {clients.data.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground">
                        <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="mb-4">No clients yet. Add your first client or convert a won opportunity.</p>
                        <Button asChild><Link href="/clients/create">Add Client</Link></Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}