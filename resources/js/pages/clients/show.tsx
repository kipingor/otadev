import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type BreadcrumbItem } from '@/types';
import { Mail, Phone, Building2, MapPin, Edit, Plus, FileText, FolderOpen, Bell, TrendingUp, AlertTriangle } from 'lucide-react';

const fmt = (n: number, c='USD') => new Intl.NumberFormat('en-US',{style:'currency',currency:c}).format(n);
const fmtDate = (d:string) => new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
const STAGE_COLORS: Record<string,string> = {prospect:'bg-gray-100 text-gray-700',proposal:'bg-blue-100 text-blue-700',negotiation:'bg-amber-100 text-amber-700',won:'bg-green-100 text-green-700',lost:'bg-red-100 text-red-700'};
const STATUS_COLORS: Record<string,string> = {draft:'bg-gray-100 text-gray-700',issued:'bg-blue-100 text-blue-700',paid:'bg-green-100 text-green-700',overdue:'bg-red-100 text-red-700'};

interface Props {
    client: any; projects: any[]; invoices: any[]; leads: any[];
    opportunities: any[]; followUps: any[];
    financials: { total_billed:number; total_collected:number; total_overdue:number; projects_count:number };
}

export default function ClientShow({ client, projects, invoices, leads, opportunities, followUps, financials }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [{ title:'Clients', href:'/clients' }, { title:client.name, href:`/clients/${client.id}` }];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={client.name} />
            <div className="p-6 space-y-6 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-700 font-bold text-lg">{client.name.slice(0,2).toUpperCase()}</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{client.name}</h1>
                            {client.company && <p className="text-muted-foreground flex items-center gap-1 mt-0.5"><Building2 className="h-4 w-4"/>{client.company}</p>}
                            <p className="text-sm text-muted-foreground">Client since {client.client_since ? fmtDate(client.client_since) : '—'}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild><Link href={`/clients/${client.id}/edit`}><Edit className="h-4 w-4 mr-1.5"/>Edit</Link></Button>
                        <Button size="sm" asChild><Link href={`/invoices/create?client_id=${client.id}`}><FileText className="h-4 w-4 mr-1.5"/>New Invoice</Link></Button>
                    </div>
                </div>

                {/* Financial KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        ['Total Billed', fmt(financials.total_billed), 'text-blue-600', null],
                        ['Collected', fmt(financials.total_collected), 'text-green-600', null],
                        ['Overdue', fmt(financials.total_overdue), financials.total_overdue>0?'text-red-600':'text-gray-500', null],
                        ['Projects', financials.projects_count, 'text-amber-600', null],
                    ].map(([l,v,c]:any) => (
                        <Card key={l} className="p-4"><p className="text-xs text-muted-foreground uppercase tracking-wider">{l}</p><p className={`text-xl font-bold mt-1 ${c}`}>{v}</p></Card>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Contact Info */}
                    <Card className="p-5 space-y-3">
                        <h2 className="font-semibold text-sm">Contact Info</h2>
                        <div className="space-y-2.5 text-sm">
                            <a href={`mailto:${client.email}`} className="flex items-center gap-2 hover:text-primary"><Mail className="h-4 w-4 text-muted-foreground flex-shrink-0"/>{client.email}</a>
                            {client.phone && <a href={`tel:${client.phone}`} className="flex items-center gap-2 hover:text-primary"><Phone className="h-4 w-4 text-muted-foreground flex-shrink-0"/>{client.phone}</a>}
                            {client.address && <p className="flex items-start gap-2 text-muted-foreground"><MapPin className="h-4 w-4 flex-shrink-0 mt-0.5"/>{client.address}</p>}
                            {client.notes && <p className="text-muted-foreground text-xs pt-2 border-t">{client.notes}</p>}
                        </div>
                        <div className="pt-2 border-t space-y-1.5">
                            <Button variant="outline" size="sm" className="w-full justify-start text-xs" asChild>
                                <Link href={`/follow-ups?client_id=${client.id}`}><Bell className="h-3.5 w-3.5 mr-2"/>Schedule Follow-up</Link>
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start text-xs" asChild>
                                <Link href={`/client-reports/create?client_id=${client.id}`}><TrendingUp className="h-3.5 w-3.5 mr-2"/>Create Report</Link>
                            </Button>
                        </div>
                    </Card>

                    {/* Pending Follow-ups */}
                    <Card className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-semibold text-sm">Pending Follow-ups</h2>
                            <Button variant="ghost" size="sm" asChild><Link href={`/follow-ups?client_id=${client.id}`} className="text-xs">View all</Link></Button>
                        </div>
                        {followUps.length === 0
                            ? <p className="text-xs text-muted-foreground text-center py-4">No pending follow-ups</p>
                            : followUps.map((f:any) => (
                                <div key={f.id} className="flex items-start gap-2 py-2 border-b last:border-0">
                                    <div className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0"/>
                                    <div><p className="text-xs font-medium">{f.subject}</p><p className="text-xs text-muted-foreground">{f.scheduled_at ? fmtDate(f.scheduled_at) : 'Unscheduled'}</p></div>
                                </div>
                            ))}
                    </Card>

                    {/* Linked Opportunities */}
                    <Card className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-semibold text-sm">Opportunities</h2>
                            <Button variant="ghost" size="sm" asChild><Link href={`/opportunities?client_id=${client.id}`} className="text-xs">View all</Link></Button>
                        </div>
                        {opportunities.length === 0
                            ? <p className="text-xs text-muted-foreground text-center py-4">No opportunities linked</p>
                            : opportunities.map((o:any) => (
                                <Link key={o.id} href={`/opportunities/${o.id}`} className="flex items-center justify-between py-2 border-b last:border-0 hover:text-primary">
                                    <div><p className="text-xs font-medium truncate max-w-[140px]">{o.title}</p><Badge className={`text-[10px] mt-0.5 ${STAGE_COLORS[o.stage]??''}`}>{o.stage}</Badge></div>
                                    {o.estimated_value && <span className="text-xs font-medium">{fmt(o.estimated_value, o.currency)}</span>}
                                </Link>
                            ))}
                    </Card>
                </div>

                {/* Projects */}
                <Card className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold">Projects</h2>
                        <Button size="sm" variant="outline" asChild><Link href={`/projects/create?client_id=${client.id}`}><Plus className="h-3.5 w-3.5 mr-1.5"/>New Project</Link></Button>
                    </div>
                    {projects.length === 0
                        ? <p className="text-sm text-muted-foreground text-center py-6">No projects yet</p>
                        : <div className="grid sm:grid-cols-2 gap-3">
                            {projects.map((p:any) => (
                                <Link key={p.id} href={`/projects/${p.id}`}>
                                    <div className="border rounded-lg p-3 hover:bg-muted/40 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium text-sm">{p.name}</p>
                                            <Badge variant="outline" className="text-xs capitalize">{p.status}</Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">{p.tasks_count} tasks</p>
                                    </div>
                                </Link>
                            ))}
                        </div>}
                </Card>

                {/* Invoices */}
                <Card className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold">Invoices</h2>
                        <Button size="sm" variant="outline" asChild><Link href={`/invoices/create?client_id=${client.id}`}><Plus className="h-3.5 w-3.5 mr-1.5"/>New Invoice</Link></Button>
                    </div>
                    <table className="w-full text-sm">
                        <thead><tr className="border-b text-left text-muted-foreground text-xs">
                            <th className="pb-2">Number</th><th className="pb-2">Due</th><th className="pb-2 text-right">Amount</th><th className="pb-2 text-right">Status</th>
                        </tr></thead>
                        <tbody className="divide-y">
                            {invoices.map((inv:any) => (
                                <tr key={inv.id} className="hover:bg-muted/30">
                                    <td className="py-2"><Link href={`/invoices/${inv.id}`} className="text-primary hover:underline font-medium">{inv.number}</Link></td>
                                    <td className="py-2 text-muted-foreground text-xs">{inv.due_date ? fmtDate(inv.due_date) : '—'}</td>
                                    <td className="py-2 text-right font-medium">{fmt(inv.total, inv.currency)}</td>
                                    <td className="py-2 text-right"><Badge className={`text-[10px] capitalize ${STATUS_COLORS[inv.status]??''}`}>{inv.status}</Badge></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {invoices.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No invoices yet</p>}
                </Card>
            </div>
        </AppLayout>
    );
}