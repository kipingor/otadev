import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    TrendingUp, TrendingDown, Users, Target, DollarSign, FolderOpen,
    BarChart2, CheckCircle, XCircle, Layers, Calendar, Filter
} from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000   ? `${(n / 1_000).toFixed(1)}K`
    : String(n);

const fmtCurrency = (n: number, currency = 'USD') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

const PALETTE = ['#6366f1','#22c55e','#f59e0b','#ef4444','#3b82f6','#a855f7','#14b8a6','#f97316'];

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({
    icon: Icon, label, value, sub, trend, color = 'indigo',
}: {
    icon: React.ElementType; label: string; value: string | number;
    sub?: string; trend?: number; color?: string;
}) {
    const colors: Record<string, string> = {
        indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
        green:  'bg-green-50  text-green-600  dark:bg-green-900/30  dark:text-green-400',
        amber:  'bg-amber-50  text-amber-600  dark:bg-amber-900/30  dark:text-amber-400',
        red:    'bg-red-50    text-red-600    dark:bg-red-900/30    dark:text-red-400',
        blue:   'bg-blue-50   text-blue-600   dark:bg-blue-900/30   dark:text-blue-400',
    };
    return (
        <Card className="relative overflow-hidden">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className={`flex size-10 items-center justify-center rounded-lg ${colors[color] ?? colors.indigo}`}>
                        <Icon className="size-5" />
                    </div>
                    {trend !== undefined && (
                        <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {trend >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                            {Math.abs(trend)}%
                        </div>
                    )}
                </div>
                <div className="mt-4">
                    <p className="text-2xl font-bold tracking-tight">{value}</p>
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
                </div>
            </CardContent>
        </Card>
    );
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionTitle({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                <Icon className="size-4 text-muted-foreground" />
            </div>
            <div>
                <h2 className="text-lg font-semibold">{title}</h2>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
        </div>
    );
}

// ── Custom tooltip ────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border bg-background p-3 shadow-lg text-sm">
            {label && <p className="mb-1 font-medium">{label}</p>}
            {payload.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                    <span className="size-2 rounded-full" style={{ background: p.fill ?? p.color }} />
                    <span className="text-muted-foreground">{p.name ?? p.dataKey}:</span>
                    <span className="font-medium">{p.value}</span>
                </div>
            ))}
        </div>
    );
};

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ReportsIndex() {
    const {
        period,
        leadSummary,
        leadsByStatus,
        leadsBySource,
        leadsOverTime,
        opportunitySummary,
        opportunitiesByStage,
        projectSummary,
        projectsByStatus,
        conversionFunnel,
    } = usePage<any>().props;

    const [activePeriod, setActivePeriod] = useState<string>(period ?? '30');

    const handlePeriodChange = (p: string) => {
        setActivePeriod(p);
        router.get('/reports', { period: p }, { preserveState: true, replace: true });
    };

    const periods = [
        { value: '7',   label: '7 days' },
        { value: '30',  label: '30 days' },
        { value: '90',  label: '90 days' },
        { value: '365', label: '1 year' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports" />
            <div className="space-y-10 px-4 py-8 md:px-8">

                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                        <p className="mt-1 text-muted-foreground">Comprehensive view of leads, opportunities and projects</p>
                    </div>
                    {/* Period selector */}
                    <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-1">
                        <Filter className="ml-2 size-4 text-muted-foreground" />
                        {periods.map((p) => (
                            <button
                                key={p.value}
                                onClick={() => handlePeriodChange(p.value)}
                                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                                    activePeriod === p.value
                                        ? 'bg-background shadow text-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── LEADS ─────────────────────────────────────────────────────── */}
                <section className="space-y-6">
                    <SectionTitle icon={Users} title="Leads" description={`Key metrics for the last ${activePeriod} days`} />

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <KpiCard icon={Users}       label="Total Leads"     value={leadSummary.total}
                            sub={`+${leadSummary.new_in_period} new this period`} color="indigo" />
                        <KpiCard icon={CheckCircle} label="Won"             value={leadSummary.won} color="green" />
                        <KpiCard icon={XCircle}     label="Lost"            value={leadSummary.lost} color="red" />
                        <KpiCard icon={Target}      label="Conversion Rate" value={`${leadSummary.conversion_rate}%`} color="blue" />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Leads over time */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-base">New Leads Over Time</CardTitle>
                                <CardDescription>Leads created in the selected period</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart data={leadsOverTime} margin={{ top: 4, right: 16, left: -20, bottom: 4 }}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                                        <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line type="monotone" dataKey="count" name="Leads"
                                            stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Leads by status */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">By Status</CardTitle>
                                <CardDescription>Current distribution</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={leadsByStatus} dataKey="count" nameKey="label"
                                            cx="50%" cy="50%" outerRadius={75} innerRadius={40}>
                                            {leadsByStatus.map((_: any, i: number) => (
                                                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend iconType="circle" iconSize={8} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Leads by source */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">By Source</CardTitle>
                            <CardDescription>Where leads are coming from in the selected period</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={leadsBySource} margin={{ top: 4, right: 16, left: -20, bottom: 4 }} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/60" />
                                    <XAxis type="number" tick={{ fontSize: 11 }} />
                                    <YAxis dataKey="source" type="category" tick={{ fontSize: 11 }} width={100} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="count" name="Leads" fill="#6366f1" radius={[0, 4, 4, 0]} maxBarSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </section>

                {/* ── OPPORTUNITIES ─────────────────────────────────────────────── */}
                <section className="space-y-6">
                    <SectionTitle icon={DollarSign} title="Opportunities" description="Sales pipeline overview" />

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <KpiCard icon={Layers}     label="Total Opportunities"  value={opportunitySummary.total} color="blue" />
                        <KpiCard icon={CheckCircle} label="Won"                 value={opportunitySummary.won} color="green" />
                        <KpiCard icon={Target}      label="Win Rate"            value={`${opportunitySummary.conversion_rate}%`} color="indigo" />
                        <KpiCard icon={DollarSign}  label="Won Value"
                            value={fmtCurrency(opportunitySummary.won_value)} color="green" />
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Pipeline by Stage</CardTitle>
                            <CardDescription>Count and estimated value per stage</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={opportunitiesByStage} margin={{ top: 4, right: 16, left: -10, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                    <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 11 }} />
                                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }}
                                        tickFormatter={(v) => fmt(v)} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar yAxisId="left"  dataKey="count" name="Count" fill="#6366f1" radius={[4,4,0,0]} maxBarSize={40} />
                                    <Bar yAxisId="right" dataKey="value" name="Value ($)" fill="#22c55e" radius={[4,4,0,0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </section>

                {/* ── PROJECTS ──────────────────────────────────────────────────── */}
                <section className="space-y-6">
                    <SectionTitle icon={FolderOpen} title="Projects" description="Delivery and execution status" />

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <KpiCard icon={FolderOpen}  label="Total Projects" value={projectSummary.total} color="indigo" />
                        <KpiCard icon={CheckCircle} label="Active"         value={projectSummary.active} color="green" />
                        <KpiCard icon={CheckCircle} label="Completed"      value={projectSummary.completed} color="blue" />
                        <KpiCard icon={Calendar}    label="Overdue"        value={projectSummary.overdue} color="red" />
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Projects by Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={projectsByStatus} margin={{ top: 4, right: 16, left: -20, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                                    <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="count" name="Projects" radius={[4,4,0,0]} maxBarSize={60}>
                                        {projectsByStatus.map((_: any, i: number) => (
                                            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </section>

                {/* ── CONVERSION FUNNEL ─────────────────────────────────────────── */}
                <section className="space-y-6">
                    <SectionTitle icon={BarChart2} title="Conversion Funnel"
                        description="How leads progress through the pipeline" />

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
                                {conversionFunnel.map((step: any, i: number) => {
                                    const maxCount = conversionFunnel[0]?.count || 1;
                                    const pct = Math.round((step.count / maxCount) * 100);
                                    return (
                                        <div key={i} className="flex flex-1 flex-col items-center gap-2">
                                            <span className="text-sm font-semibold">{step.count}</span>
                                            <div
                                                className="w-full rounded-t-lg transition-all"
                                                style={{ height: `${Math.max(pct * 1.8, 24)}px`, background: PALETTE[i % PALETTE.length] }}
                                            />
                                            <div className="text-center">
                                                <p className="text-xs font-medium">{step.label}</p>
                                                {i > 0 && (
                                                    <Badge variant="outline" className="text-xs mt-1">
                                                        {pct}%
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </section>

            </div>
        </AppLayout>
    );
}