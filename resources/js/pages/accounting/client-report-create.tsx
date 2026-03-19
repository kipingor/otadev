import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Accounting', href: '/accounting' },
    { title: 'Client Reports', href: '/client-reports' },
    { title: 'New Report', href: '/client-reports/create' },
];

const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n ?? 0);
const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
const periodLabel = (start: string) =>
    new Date(start).toLocaleString('en-US', { month: 'long', year: 'numeric' });

// ── Types ─────────────────────────────────────────────────────────────────

interface ClientStub  { id: number; name: string; email: string }
interface ProjectStub { id: number; name: string; client_id: number | null; status: string }

interface TaskStub         { id: number; title: string; completed_at?: string | null; assignee?: string }
interface DelayedTaskStub  { id: number; title: string; due?: string; delay_reason?: string; mitigation?: string; assignee?: string }
interface UpcomingTaskStub { title: string; due?: string; priority: string; assignee?: string }

interface ProjectMetrics {
    id: number; name: string; status: string;
    tasks_total: number; tasks_done: number;
    hours_estimated: number; hours_spent: number;
    completed_tasks: TaskStub[];
    delayed_tasks:   DelayedTaskStub[];
    wins:            TaskStub[];
    upcoming_tasks:  UpcomingTaskStub[];
}

interface Metrics {
    type: 'project' | 'general';
    invoices_total: number; invoices_paid: number;
    billed: number; collected: number; outstanding: number;
    projects: ProjectMetrics[];
}

interface Props {
    clientsWithProjects: ClientStub[];
    allClients:          ClientStub[];
    projects:            ProjectStub[];
}

// ── Content generators ────────────────────────────────────────────────────

function buildProjectContent(clientName: string, label: string, metrics: Metrics): string {
    const L: string[] = [];
    L.push(`# ${label} – Project Report`);
    L.push('');
    L.push(`Dear ${clientName},`);
    L.push('');
    L.push('Please find below a summary of project activities and progress for the reporting period.');

    for (const p of metrics.projects) {
        const pct = p.tasks_total > 0 ? Math.round((p.tasks_done / p.tasks_total) * 100) : 0;
        L.push(''); L.push(`## ${p.name}`);
        L.push(`**Progress:** ${p.tasks_done} of ${p.tasks_total} tasks completed (${pct}%)`);
        if (p.hours_estimated > 0) {
            L.push(`**Hours:** ${p.hours_spent}h spent / ${p.hours_estimated}h estimated`);
        }

        if (p.completed_tasks.length > 0) {
            L.push(''); L.push('### ✅ Completed This Period');
            for (const t of p.completed_tasks) {
                const who  = t.assignee ? ` *(${t.assignee})*` : '';
                const when = t.completed_at ? ` — ${fmtDate(t.completed_at)}` : '';
                L.push(`- ${t.title}${who}${when}`);
            }
        }

        if (p.wins.length > 0) {
            L.push(''); L.push('### 🏆 Wins');
            for (const w of p.wins) {
                L.push(`- **${w.title}** delivered on schedule${w.assignee ? ` by ${w.assignee}` : ''}`);
            }
        }

        if (p.delayed_tasks.length > 0) {
            L.push(''); L.push('### ⚠ Issues & Delays');
            for (const d of p.delayed_tasks) {
                const due = d.due ? ` (due ${fmtDate(d.due)})` : '';
                const who = d.assignee ? `, assigned to ${d.assignee}` : '';
                L.push(`- **${d.title}**${due}${who}`);
                if (d.delay_reason) L.push(`  - *Cause:* ${d.delay_reason}`);
                L.push(`  - *Mitigation:* ${d.mitigation || '[Add mitigation steps here]'}`);
            }
        }

        if (p.upcoming_tasks.length > 0) {
            L.push(''); L.push('### 📋 Upcoming Work');
            for (const u of p.upcoming_tasks) {
                const due = u.due ? ` — due ${fmtDate(u.due)}` : '';
                const who = u.assignee ? ` *(${u.assignee})*` : '';
                L.push(`- ${u.title}${who}${due}`);
            }
        }
    }

    L.push(''); L.push('## 💳 Billing Summary');
    L.push(`- **Invoiced:** ${fmt(metrics.billed)}`);
    L.push(`- **Collected:** ${fmt(metrics.collected)}`);
    if (metrics.outstanding > 0) {
        L.push(`- **Overdue:** ${fmt(metrics.outstanding)} — *please review outstanding invoices*`);
    }
    L.push(`- **Invoices:** ${metrics.invoices_paid} of ${metrics.invoices_total} paid`);
    L.push(''); L.push('---');
    L.push("*If you have any questions about this report, please don't hesitate to reach out.*");
    return L.join('\n');
}

function buildGeneralTemplate(clientName: string, label: string, metrics: Metrics): string {
    return `# ${label} – Client Update

Dear ${clientName},

Please find below our regular update for the period ending ${label}.

## General Update

[Summarise the key activities, interactions, and outcomes from this period.]

## Work Completed

[List deliverables, meetings, or services provided this period.]

## Upcoming

[Outline what is planned for the next period.]

## Billing Summary

- **Invoiced:** ${fmt(metrics.billed)}
- **Collected:** ${fmt(metrics.collected)}${metrics.outstanding > 0 ? `\n- **Overdue:** ${fmt(metrics.outstanding)} — please review outstanding invoices` : ''}
- **Invoices:** ${metrics.invoices_paid} of ${metrics.invoices_total} paid

## Notes

[Any additional items, risks, or items requiring client attention.]

---
*If you have any questions, please don't hesitate to reach out.*`;
}

// ── Component ─────────────────────────────────────────────────────────────

export default function ClientReportCreate({ clientsWithProjects, allClients, projects }: Props) {
    const today         = new Date().toISOString().slice(0, 10);
    const firstOfMonth  = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

    const [reportType, setReportType] = useState<'project' | 'general'>('project');
    const [form, setForm] = useState({
        client_id: '', project_id: '', title: '',
        period_type: 'monthly', period_start: firstOfMonth, period_end: today,
        content: '',
    });
    const [saving,          setSaving]          = useState(false);
    const [loadingMetrics,  setLoadingMetrics]  = useState(false);
    const [metrics,         setMetrics]         = useState<Metrics | null>(null);
    const [errors,          setErrors]          = useState<Record<string, string>>({});

    // Clients shown depend on report type
    const clientList = reportType === 'project' ? clientsWithProjects : allClients;

    // Projects for selected client
    const clientProjects = form.client_id
        ? projects.filter(p => p.client_id === Number(form.client_id))
        : [];

    // ── Fetch metrics from API whenever client, project, or period changes ──
    const fetchMetrics = useCallback(async (
        clientId: string,
        projectId: string,
        from: string,
        to: string,
        type: 'project' | 'general',
    ) => {
        if (!clientId) { setMetrics(null); return; }
        setLoadingMetrics(true);
        try {
            const params = new URLSearchParams({
                client_id: clientId,
                from,
                to,
                type,
                ...(projectId ? { project_id: projectId } : {}),
            });
            const res = await api.get(`/client-report-metrics?${params}`);
            setMetrics(res.data);
        } catch {
            setMetrics(null);
        } finally {
            setLoadingMetrics(false);
        }
    }, []);

    // Re-fetch whenever relevant fields change
    useEffect(() => {
        if (!form.client_id) { setMetrics(null); return; }
        const t = setTimeout(() => {
            fetchMetrics(form.client_id, form.project_id, form.period_start, form.period_end, reportType);
        }, 300);
        return () => clearTimeout(t);
    }, [form.client_id, form.project_id, form.period_start, form.period_end, reportType]);

    // Auto-generate content whenever metrics arrive
    useEffect(() => {
        if (!metrics || !form.client_id) return;
        const client = clientList.find(c => c.id === Number(form.client_id));
        if (!client) return;
        const label = periodLabel(form.period_start);
        const content = reportType === 'project'
            ? buildProjectContent(client.name, label, metrics)
            : buildGeneralTemplate(client.name, label, metrics);
        setForm(f => ({ ...f, content }));
    }, [metrics, reportType]);

    // When client changes: reset project, update title
    function handleClientChange(clientId: string) {
        const client = clientList.find(c => c.id === Number(clientId));
        const label  = periodLabel(form.period_start);
        setForm(f => ({
            ...f,
            client_id:  clientId,
            project_id: '',
            title:      client ? `${client.name} – ${label} Report` : '',
            content:    '',
        }));
        setMetrics(null);
    }

    // When report type changes: clear client + content
    function handleTypeChange(type: 'project' | 'general') {
        setReportType(type);
        setForm(f => ({ ...f, client_id: '', project_id: '', content: '' }));
        setMetrics(null);
    }

    function regenerate() {
        if (!metrics || !form.client_id) return;
        const client = clientList.find(c => c.id === Number(form.client_id));
        if (!client) return;
        const label   = periodLabel(form.period_start);
        const content = reportType === 'project'
            ? buildProjectContent(client.name, label, metrics)
            : buildGeneralTemplate(client.name, label, metrics);
        setForm(f => ({ ...f, content }));
    }

    function submit() {
        setSaving(true);
        router.post('/client-reports', { ...form, report_type: reportType }, {
            onError:   e  => { setErrors(e); setSaving(false); },
            onSuccess: () => setSaving(false),
        });
    }

    const canGenerate = !!form.client_id && !loadingMetrics;
    const hasProject  = reportType === 'project';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Client Report" />
            <div className="p-6 max-w-4xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold tracking-tight">New Client Report</h1>

                {/* Report type toggle */}
                <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
                    {(['project', 'general'] as const).map(t => (
                        <button key={t}
                            onClick={() => handleTypeChange(t)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                reportType === t
                                    ? 'bg-background shadow text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}>
                            {t === 'project' ? '📋 Project Report' : '📄 General Report'}
                        </button>
                    ))}
                </div>

                {/* Helper text */}
                <p className="text-sm text-muted-foreground -mt-2">
                    {reportType === 'project'
                        ? 'Generates content automatically from project task data — completed tasks, wins, delays, and mitigations.'
                        : 'Standard template for client updates not tied to a specific project.'}
                </p>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* ── Left: form ───────────────────────────────────────── */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="p-6 space-y-4">
                            <h2 className="font-semibold">Report Details</h2>
                            <div className="grid sm:grid-cols-2 gap-4">

                                {/* Client */}
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">
                                        Client *
                                        {hasProject && (
                                            <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                                                (with projects only)
                                            </span>
                                        )}
                                    </label>
                                    <select
                                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                                        value={form.client_id}
                                        onChange={e => handleClientChange(e.target.value)}>
                                        <option value="">
                                            {clientList.length === 0
                                                ? hasProject ? 'No clients with projects found' : 'No clients found'
                                                : 'Select client…'}
                                        </option>
                                        {clientList.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    {errors.client_id && (
                                        <p className="text-xs text-red-500 mt-1">{errors.client_id}</p>
                                    )}
                                    {hasProject && clientsWithProjects.length === 0 && (
                                        <p className="text-xs text-amber-600 mt-1">
                                            No clients have projects yet. Create a project first, or switch to a General Report.
                                        </p>
                                    )}
                                </div>

                                {/* Project — only in project mode */}
                                {hasProject && (
                                    <div>
                                        <label className="text-sm font-medium mb-1.5 block">
                                            Project
                                            <span className="ml-1 text-xs text-muted-foreground font-normal">(optional — all if blank)</span>
                                        </label>
                                        <select
                                            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                                            value={form.project_id}
                                            onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}
                                            disabled={!form.client_id}>
                                            <option value="">All projects</option>
                                            {clientProjects.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name}
                                                    {p.status !== 'active' ? ` (${p.status})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Title */}
                                <div className="sm:col-span-2">
                                    <label className="text-sm font-medium mb-1.5 block">Report Title *</label>
                                    <Input
                                        value={form.title}
                                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                        placeholder="e.g. Acme Corp – March 2025 Report" />
                                    {errors.title && (
                                        <p className="text-xs text-red-500 mt-1">{errors.title}</p>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Content editor */}
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="font-semibold">Report Content</h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">Markdown supported. Edit freely after generation.</p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={regenerate}
                                    disabled={!canGenerate}>
                                    {loadingMetrics ? (
                                        <span className="flex items-center gap-1.5">
                                            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                                            </svg>
                                            Loading…
                                        </span>
                                    ) : '✨ Regenerate'}
                                </Button>
                            </div>

                            {/* Empty state hint */}
                            {!form.content && !loadingMetrics && (
                                <div className="flex flex-col items-center justify-center h-32 rounded-md border border-dashed text-center text-sm text-muted-foreground mb-3">
                                    {!form.client_id
                                        ? 'Select a client above to generate report content'
                                        : 'Click ✨ Regenerate or start typing below'}
                                </div>
                            )}

                            {loadingMetrics && !form.content && (
                                <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                                    Fetching data…
                                </div>
                            )}

                            <textarea
                                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm font-mono min-h-[420px] resize-y"
                                value={form.content}
                                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                                placeholder="Report content (Markdown)…"
                            />
                            {errors.content && (
                                <p className="text-xs text-red-500 mt-1">{errors.content}</p>
                            )}
                        </Card>
                    </div>

                    {/* ── Right sidebar ─────────────────────────────────── */}
                    <div className="space-y-4">

                        {/* Period */}
                        <Card className="p-5 space-y-3">
                            <h2 className="font-semibold text-sm">Period</h2>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Period Type</label>
                                <select
                                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                                    value={form.period_type}
                                    onChange={e => setForm(f => ({ ...f, period_type: e.target.value }))}>
                                    {[['weekly','Weekly'],['monthly','Monthly'],['quarterly','Quarterly'],['custom','Custom']].map(([v, l]) => (
                                        <option key={v} value={v}>{l}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Start Date *</label>
                                <Input type="date" value={form.period_start}
                                    onChange={e => setForm(f => ({ ...f, period_start: e.target.value }))} />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">End Date *</label>
                                <Input type="date" value={form.period_end}
                                    onChange={e => setForm(f => ({ ...f, period_end: e.target.value }))} />
                            </div>
                        </Card>

                        {/* Metrics summary card */}
                        {metrics && (
                            <Card className="p-5">
                                <h3 className="font-semibold text-sm mb-3">Data Snapshot</h3>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Invoices</span>
                                        <span>{metrics.invoices_paid}/{metrics.invoices_total} paid</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Billed</span>
                                        <span className="font-medium">{fmt(metrics.billed)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Collected</span>
                                        <span className="font-medium text-green-600">{fmt(metrics.collected)}</span>
                                    </div>
                                    {metrics.outstanding > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Overdue</span>
                                            <span className="font-medium text-red-600">{fmt(metrics.outstanding)}</span>
                                        </div>
                                    )}
                                    {metrics.projects?.map(p => (
                                        <div key={p.id} className="border-t pt-2 mt-2">
                                            <p className="font-medium mb-1">{p.name}</p>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Tasks</span>
                                                <span>{p.tasks_done}/{p.tasks_total} done</span>
                                            </div>
                                            {p.wins.length > 0 && (
                                                <div className="flex justify-between text-green-600">
                                                    <span>🏆 Wins</span><span>{p.wins.length}</span>
                                                </div>
                                            )}
                                            {p.delayed_tasks.length > 0 && (
                                                <div className="flex justify-between text-amber-600">
                                                    <span>⚠ Delayed</span><span>{p.delayed_tasks.length}</span>
                                                </div>
                                            )}
                                            {p.hours_estimated > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Hours</span>
                                                    <span>{p.hours_spent}h / {p.hours_estimated}h</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        <Button
                            className="w-full"
                            onClick={submit}
                            disabled={saving || !form.client_id || !form.title || !form.content}>
                            {saving ? 'Saving…' : 'Create Report'}
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}