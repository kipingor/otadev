import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type BreadcrumbItem } from '@/types';
import { Send, Trash2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link } from '@inertiajs/react';

const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700', sent: 'bg-blue-100 text-blue-700', viewed: 'bg-green-100 text-green-700',
};
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

interface Props {
    report: {
        id: number; title: string; status: string; period_type: string;
        period_start: string; period_end: string; content: string; metrics: any;
        sent_at: string | null; viewed_at: string | null;
        client: { id: number; name: string; email: string } | null;
        project: { id: number; name: string } | null;
        creator: { id: number; name: string } | null;
        created_at: string;
    };
}

// Simple markdown-ish renderer (just handle headers, bold, bullets)
function renderContent(text: string) {
    return text
        .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-4 mb-1">$1</h3>')
        .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-5 mb-2">$1</h2>')
        .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-6 mb-2">$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
        .replace(/^---$/gm, '<hr class="my-4 border-border" />')
        .replace(/\n\n/g, '</p><p class="mb-3">')
        .replace(/\n/g, '<br/>');
}

export default function ClientReportShow({ report }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Accounting', href: '/accounting' },
        { title: 'Client Reports', href: '/client-reports' },
        { title: report.title, href: `/client-reports/${report.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={report.title} />
            <div className="p-6 max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" asChild><Link href="/client-reports"><ArrowLeft className="h-4 w-4" /></Link></Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold">{report.title}</h1>
                                <Badge className={`capitalize ${STATUS_COLORS[report.status] ?? ''}`}>{report.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{report.client?.name} · {fmtDate(report.period_start)} – {fmtDate(report.period_end)}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {report.status === 'draft' && (
                            <Button size="sm" onClick={() => { if (confirm('Mark as sent to client?')) router.post(`/client-reports/${report.id}/send`, {}, { preserveScroll: true }); }}>
                                <Send className="h-4 w-4 mr-1.5" />Mark as Sent
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700"
                            onClick={() => { if (confirm('Delete this report?')) router.delete(`/client-reports/${report.id}`); }}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Card className="p-8">
                            <div
                                className="prose prose-sm max-w-none text-foreground"
                                dangerouslySetInnerHTML={{ __html: `<p class="mb-3">${renderContent(report.content)}</p>` }}
                            />
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <Card className="p-5 space-y-2 text-sm">
                            <h3 className="font-semibold">Report Info</h3>
                            <div className="flex justify-between"><span className="text-muted-foreground">Client</span><span className="font-medium">{report.client?.name ?? '—'}</span></div>
                            {report.project && <div className="flex justify-between"><span className="text-muted-foreground">Project</span><span>{report.project.name}</span></div>}
                            <div className="flex justify-between"><span className="text-muted-foreground">Period</span><span className="capitalize">{report.period_type}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{fmtDate(report.created_at)}</span></div>
                            {report.sent_at && <div className="flex justify-between text-blue-600"><span>Sent</span><span>{fmtDate(report.sent_at)}</span></div>}
                            {report.viewed_at && <div className="flex items-center justify-between text-green-600"><span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" />Viewed</span><span>{fmtDate(report.viewed_at)}</span></div>}
                        </Card>

                        {report.metrics && (
                            <Card className="p-5 text-sm">
                                <h3 className="font-semibold mb-3">Metrics Snapshot</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><span className="text-muted-foreground">Invoices paid</span><span>{report.metrics.invoices_paid}/{report.metrics.invoices_total}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Total billed</span><span>{fmt(report.metrics.billed)}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Collected</span><span className="text-green-600">{fmt(report.metrics.collected)}</span></div>
                                    {report.metrics.outstanding > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Outstanding</span><span className="text-red-600">{fmt(report.metrics.outstanding)}</span></div>}
                                    {report.metrics.projects?.map((p: any) => (
                                        <div key={p.id} className="border-t pt-2 mt-2">
                                            <p className="font-medium text-xs">{p.name}</p>
                                            <div className="flex justify-between text-xs mt-1"><span className="text-muted-foreground">Tasks</span><span>{p.tasks_done}/{p.tasks_total}</span></div>
                                            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Hours</span><span>{p.hours_spent}h/{p.hours_estimated}h</span></div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}