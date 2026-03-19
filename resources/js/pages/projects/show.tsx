import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import api from '@/lib/axios';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
    AlertTriangle, CheckCircle2, Clock, TrendingUp, TrendingDown,
    Users, Shield, FileWarning, GitPullRequest, BookOpen, Activity,
    PlusCircle, Trash2, Edit, ArrowRight, DollarSign, CheckSquare, Circle, RotateCcw,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface EVM {
    bac: number; pv: number; ev: number; ac: number;
    cv: number; sv: number;
    cpi: number | null; spi: number | null;
    eac: number | null; etc: number | null; vac: number | null; tcpi: number | null;
    cost_status: 'on_track' | 'at_risk' | 'critical' | 'unknown';
    schedule_status: 'on_track' | 'at_risk' | 'critical' | 'unknown';
}

interface Risk { id: number; title: string; category: string; probability: number; impact: number; risk_score: number; response_type: string | null; response_plan: string | null; contingency_plan: string | null; trigger: string | null; status: string; owner?: { id: number; name: string; avatar?: string }; identified_date: string | null; review_date: string | null; notes: string | null; }
interface Issue { id: number; title: string; description: string | null; category: string; severity: string; priority: string; status: string; owner?: { name: string }; raised_date: string | null; target_resolution_date: string | null; resolved_date: string | null; impact_description: string | null; }
interface Change { id: number; title: string; description: string; change_type: string; status: string; impacts_scope: boolean; impacts_schedule: boolean; impacts_cost: boolean; schedule_impact_days: number | null; cost_impact: number | null; requestedBy?: { name: string }; requested_date: string | null; decision_date: string | null; }
interface Stakeholder { id: number; name: string; display_name?: string; role: string | null; organization: string | null; influence: string; interest: string; current_engagement: string; desired_engagement: string; management_strategy?: string; has_engagement_gap?: boolean; user?: { name: string; avatar?: string }; }
interface Lesson { id: number; title: string; situation: string; impact: string; recommendation: string; category: string; type: string; phase_captured: string | null; createdBy?: { name: string }; }

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number | null | undefined, decimals = 2) =>
    n == null ? '—' : n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const fmtMoney = (n: number | null | undefined, currency = 'USD') =>
    n == null ? '—' : new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n);

const statusColour = (s: string) => ({
    on_track: 'text-green-600', at_risk: 'text-amber-500', critical: 'text-red-600', unknown: 'text-gray-400',
}[s] ?? 'text-gray-400');

const riskLevel = (score: number) =>
    score >= 15 ? { label: 'High', cls: 'bg-red-100 text-red-700' }
    : score >= 6  ? { label: 'Medium', cls: 'bg-amber-100 text-amber-700' }
    : { label: 'Low', cls: 'bg-green-100 text-green-700' };

const severityBadge = (s: string) => ({
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-green-100 text-green-700',
}[s] ?? '');

const engagementColour = (e: string) => ({
    unaware: 'bg-gray-100 text-gray-600', resistant: 'bg-red-100 text-red-600',
    neutral: 'bg-blue-100 text-blue-600', supportive: 'bg-emerald-100 text-emerald-600',
    leading: 'bg-purple-100 text-purple-600',
}[e] ?? '');

const changeStatusBadge = (s: string) => ({
    submitted: 'bg-blue-100 text-blue-700', under_review: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700',
    deferred: 'bg-gray-100 text-gray-600', implemented: 'bg-purple-100 text-purple-700',
}[s] ?? '');

// ── EVM Metric Card ───────────────────────────────────────────────────────────

function EVMCard({ label, value, subtitle, highlight }: { label: string; value: string; subtitle?: string; highlight?: 'good' | 'bad' | 'neutral' }) {
    const colours = { good: 'text-green-600', bad: 'text-red-600', neutral: 'text-gray-800' };
    return (
        <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-lg font-bold ${colours[highlight ?? 'neutral']}`}>{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProjectShow({ project, progress, evm, riskSummary, budget, isAtRisk, timeline, recentActivity, availableUsers, canManage, riskCategories, riskResponseTypes, riskStatuses, changeTypes, changeTypeLabels, lessonCategories, lessonTypes, engagementLevels, phaseOptions }: any) {

    const [activeTab, setActiveTab] = useState('overview');

    return (
        <AppLayout>
            <Head title={project.name} />

            {/* ── Header ── */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-2xl font-bold">{project.name}</h1>
                        <Badge variant="outline" className="capitalize">{project.status}</Badge>
                        <Badge className="capitalize bg-blue-100 text-blue-700 border-0">{project.phase?.replace('_', ' ')}</Badge>
                        {isAtRisk && <Badge className="bg-red-100 text-red-700 border-0"><AlertTriangle className="w-3 h-3 mr-1" />At Risk</Badge>}
                    </div>
                    {project.description && <p className="text-muted-foreground mt-1 max-w-2xl text-sm">{project.description}</p>}
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                        {project.owner && <span>PM: <strong>{project.owner.name}</strong></span>}
                        {project.sponsor && <span>Sponsor: <strong>{project.sponsor.name}</strong></span>}
                        {project.client && <span>Client: <strong>{project.client.name}</strong></span>}
                        {project.start_date && <span>{project.start_date} → {project.end_date ?? '?'}</span>}
                    </div>
                </div>
                {canManage && (
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => {
                            // BUG FIX: 419 was caused by the XSRF cookie not being sent.
                            // Inertia router.post() always attaches XSRF-TOKEN automatically.
                            // The route path must match web.php exactly.
                            router.post(`/projects/${project.id}/advance-phase`, {}, {
                                preserveScroll: true,
                                onError: (e) => console.error('advancePhase error', e),
                            });
                        }}>
                            Advance Phase <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => router.get(`/projects/${project.id}/edit`)}>Edit</Button>
                    </div>
                )}
            </div>

            {/* ── Progress bar ── */}
            <div className="mb-6">
                <div className="flex justify-between text-sm mb-1">
                    <span>Overall Progress</span>
                    <span className="font-medium">{progress.overall}%</span>
                </div>
                <Progress value={progress.overall} className="h-2" />
            </div>

            {/* ── EVM Summary Row (PMBOK §7.4) ── */}
            {evm.bac > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
                    <EVMCard label="BAC" value={fmtMoney(evm.bac)} subtitle="Budget At Completion" />
                    <EVMCard label="EV" value={fmtMoney(evm.ev)} subtitle="Earned Value" />
                    <EVMCard label="PV" value={fmtMoney(evm.pv ?? 0)} subtitle="Planned Value" />
                    <EVMCard label="AC" value={fmtMoney(evm.ac)} subtitle="Actual Cost" />
                    <EVMCard label="CPI" value={fmt(evm.cpi)} subtitle="Cost Performance" highlight={evm.cpi == null ? 'neutral' : evm.cpi >= 1 ? 'good' : evm.cpi >= 0.8 ? 'neutral' : 'bad'} />
                    <EVMCard label="SPI" value={fmt(evm.spi)} subtitle="Schedule Performance" highlight={evm.spi == null ? 'neutral' : evm.spi >= 1 ? 'good' : evm.spi >= 0.8 ? 'neutral' : 'bad'} />
                    <EVMCard label="EAC" value={fmtMoney(evm.eac)} subtitle="Est. At Completion" highlight={evm.eac == null ? 'neutral' : evm.eac <= evm.bac ? 'good' : 'bad'} />
                </div>
            )}

            {/* ── Risk / Issue / Change summary chips ── */}
            <div className="flex gap-3 mb-6 flex-wrap">
                <button onClick={() => setActiveTab('risks')} className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm hover:bg-muted/50">
                    <Shield className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-medium text-red-600">{riskSummary.high}</span> high ·
                    <span className="font-medium text-amber-500">{riskSummary.medium}</span> medium risks
                </button>
                <button onClick={() => setActiveTab('issues')} className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm hover:bg-muted/50">
                    <FileWarning className="w-3.5 h-3.5 text-orange-500" />
                    {project.issues?.filter((i: Issue) => !['resolved','closed'].includes(i.status)).length ?? 0} open issues
                </button>
                <button onClick={() => setActiveTab('changes')} className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm hover:bg-muted/50">
                    <GitPullRequest className="w-3.5 h-3.5 text-blue-500" />
                    {project.changes?.filter((c: Change) => c.status === 'submitted').length ?? 0} pending changes
                </button>
            </div>

            {/* ── Tabs ── */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4 flex-wrap h-auto">
                    <TabsTrigger value="overview"><Activity className="w-3.5 h-3.5 mr-1" />Overview</TabsTrigger>
                    <TabsTrigger value="tasks"><CheckSquare className="w-3.5 h-3.5 mr-1" />Tasks</TabsTrigger>
                    <TabsTrigger value="risks"><Shield className="w-3.5 h-3.5 mr-1" />Risks</TabsTrigger>
                    <TabsTrigger value="issues"><FileWarning className="w-3.5 h-3.5 mr-1" />Issues</TabsTrigger>
                    <TabsTrigger value="changes"><GitPullRequest className="w-3.5 h-3.5 mr-1" />Changes</TabsTrigger>
                    <TabsTrigger value="stakeholders"><Users className="w-3.5 h-3.5 mr-1" />Stakeholders</TabsTrigger>
                    <TabsTrigger value="lessons"><BookOpen className="w-3.5 h-3.5 mr-1" />Lessons Learned</TabsTrigger>
                </TabsList>

                {/* ── Overview ── */}
                <TabsContent value="overview">
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader><CardTitle className="text-sm">EVM Detail (PMBOK §7.4)</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 gap-3 text-sm">
                                {[
                                    ['CV', evm.cv, 'Cost Variance', evm.cv >= 0],
                                    ['SV', evm.sv, 'Schedule Variance', evm.sv >= 0],
                                    ['ETC', evm.etc, 'Est. To Complete', null],
                                    ['VAC', evm.vac, 'Variance At Completion', evm.vac != null && evm.vac >= 0],
                                    ['TCPI', evm.tcpi, 'To-Complete PI', evm.tcpi != null && evm.tcpi <= 1],
                                ].map(([key, val, label, good]: any) => (
                                    <div key={key as string} className="rounded border p-2">
                                        <p className="text-xs text-muted-foreground">{key} — {label}</p>
                                        <p className={`font-semibold ${good === null ? '' : good ? 'text-green-600' : 'text-red-600'}`}>
                                            {typeof val === 'number' && Math.abs(val) > 100 ? fmtMoney(val) : fmt(val)}
                                        </p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle className="text-sm">Project Charter (PMBOK §4.1)</CardTitle></CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                {project.objectives && (
                                    <div><p className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-1">Objectives</p><p>{project.objectives}</p></div>
                                )}
                                {project.success_criteria?.length > 0 && (
                                    <div><p className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-1">Success Criteria</p>
                                        <ul className="list-disc list-inside space-y-0.5">{project.success_criteria.map((c: string, i: number) => <li key={i}>{c}</li>)}</ul>
                                    </div>
                                )}
                                {project.assumptions?.length > 0 && (
                                    <div><p className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-1">Assumptions</p>
                                        <ul className="list-disc list-inside space-y-0.5">{project.assumptions.map((a: string, i: number) => <li key={i}>{a}</li>)}</ul>
                                    </div>
                                )}
                                {project.constraints?.length > 0 && (
                                    <div><p className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-1">Constraints</p>
                                        <ul className="list-disc list-inside space-y-0.5">{project.constraints.map((c: string, i: number) => <li key={i}>{c}</li>)}</ul>
                                    </div>
                                )}
                                {!project.objectives && !project.success_criteria?.length && (
                                    <p className="text-muted-foreground italic text-sm">No charter fields defined yet. Edit the project to add objectives and success criteria.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ── Risk Register (PMBOK §11) ── */}
                <TabsContent value="tasks">
                    <TasksTab project={project} canManage={canManage} />
                </TabsContent>

                <TabsContent value="risks">
                    <RisksTab project={project} canManage={canManage} riskCategories={riskCategories} riskResponseTypes={riskResponseTypes} riskStatuses={riskStatuses} availableUsers={availableUsers} />
                </TabsContent>

                {/* ── Issue Log (PMBOK §4.3.3) ── */}
                <TabsContent value="issues">
                    <IssuesTab project={project} canManage={canManage} />
                </TabsContent>

                {/* ── Change Log (PMBOK §4.6) ── */}
                <TabsContent value="changes">
                    <ChangesTab project={project} canManage={canManage} changeTypes={changeTypes} changeTypeLabels={changeTypeLabels} />
                </TabsContent>

                {/* ── Stakeholder Register (PMBOK §13) ── */}
                <TabsContent value="stakeholders">
                    <StakeholdersTab project={project} canManage={canManage} engagementLevels={engagementLevels} />
                </TabsContent>

                {/* ── Lessons Learned (PMBOK §4.4) ── */}
                <TabsContent value="lessons">
                    <LessonsTab project={project} canManage={canManage} lessonCategories={lessonCategories} lessonTypes={lessonTypes} />
                </TabsContent>
            </Tabs>
        </AppLayout>
    );
}

// ── Risk Register Tab ─────────────────────────────────────────────────────────

function RisksTab({ project, canManage, riskCategories, riskResponseTypes, riskStatuses, availableUsers }: any) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm({
        title: '', description: '', category: 'other', probability: '3', impact: '3',
        response_type: '', response_plan: '', contingency_plan: '', trigger: '',
        owner_id: '', status: 'identified', identified_date: '', review_date: '', notes: '',
    });

    const submit = () => {
        post(`/projects/${project.id}/risks`, {
            onSuccess: () => { reset(); setOpen(false); },
        });
    };

    const deleteRisk = (id: number) => {
        if (confirm('Remove this risk from the register?')) {
            router.delete(`/projects/${project.id}/risks/${id}`);
        }
    };

    const realize = (id: number) => {
        const title = prompt('Issue title (this risk will be converted to an issue):');
        if (title) {
            router.post(`/projects/${project.id}/risks/${id}/realize`, { issue_title: title });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">Risk Register <span className="text-muted-foreground text-sm font-normal ml-1">PMBOK §11</span></h3>
                {canManage && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm"><PlusCircle className="w-4 h-4 mr-1" />Add Risk</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader><DialogTitle>Identify Risk</DialogTitle></DialogHeader>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <div className="col-span-2 space-y-1">
                                    <Label>Title *</Label>
                                    <Input value={data.title} onChange={e => setData('title', e.target.value)} />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label>Description</Label>
                                    <Textarea value={data.description} onChange={e => setData('description', e.target.value)} rows={2} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Category *</Label>
                                    <Select value={data.category} onValueChange={v => setData('category', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{riskCategories.map((c: string) => <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Status</Label>
                                    <Select value={data.status} onValueChange={v => setData('status', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{riskStatuses.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Probability (1–5) *</Label>
                                    <Select value={data.probability} onValueChange={v => setData('probability', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n} – {['Very Low','Low','Medium','High','Very High'][n-1]}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Impact (1–5) *</Label>
                                    <Select value={data.impact} onValueChange={v => setData('impact', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n} – {['Very Low','Low','Medium','High','Very High'][n-1]}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Response Strategy</Label>
                                    <Select value={data.response_type} onValueChange={v => setData('response_type', v)}>
                                        <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                                        <SelectContent>{riskResponseTypes.map((t: string) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Risk Owner</Label>
                                    <Select value={data.owner_id} onValueChange={v => setData('owner_id', v)}>
                                        <SelectTrigger><SelectValue placeholder="Assign…" /></SelectTrigger>
                                        <SelectContent>{availableUsers.map((u: any) => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label>Response Plan</Label>
                                    <Textarea value={data.response_plan} onChange={e => setData('response_plan', e.target.value)} rows={2} />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label>Contingency Plan</Label>
                                    <Textarea value={data.contingency_plan} onChange={e => setData('contingency_plan', e.target.value)} rows={2} />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label>Triggers / Warning Signs</Label>
                                    <Input value={data.trigger} onChange={e => setData('trigger', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Identified Date</Label>
                                    <Input type="date" value={data.identified_date} onChange={e => setData('identified_date', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Review Date</Label>
                                    <Input type="date" value={data.review_date} onChange={e => setData('review_date', e.target.value)} />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                                <Button onClick={submit} disabled={processing}>Add to Register</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {project.risks?.length === 0 && (
                <p className="text-muted-foreground text-sm py-8 text-center">No risks identified yet. Use the Risk Register to track and manage project risks.</p>
            )}

            <div className="space-y-2">
                {project.risks?.map((risk: Risk) => {
                    const score = risk.probability * risk.impact;
                    const level = riskLevel(score);
                    return (
                        <div key={risk.id} className="rounded-lg border p-3 flex items-start gap-3 hover:bg-muted/30">
                            <div className="text-center min-w-[48px]">
                                <div className={`inline-flex items-center justify-center rounded font-bold text-sm px-2 py-0.5 ${level.cls}`}>{level.label}</div>
                                <p className="text-xs text-muted-foreground mt-0.5">P{risk.probability}×I{risk.impact}</p>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-medium text-sm">{risk.title}</p>
                                    <Badge variant="outline" className="text-xs capitalize">{risk.category.replace('_',' ')}</Badge>
                                    <Badge variant="outline" className="text-xs capitalize">{risk.status}</Badge>
                                    {risk.response_type && <Badge className="text-xs bg-blue-50 text-blue-700 border-0 capitalize">{risk.response_type}</Badge>}
                                </div>
                                {risk.response_plan && <p className="text-xs text-muted-foreground mt-1">Response: {risk.response_plan}</p>}
                                {risk.trigger && <p className="text-xs text-muted-foreground">Trigger: {risk.trigger}</p>}
                                {risk.owner && <p className="text-xs text-muted-foreground">Owner: {risk.owner.name}</p>}
                            </div>
                            {canManage && (
                                <div className="flex gap-1 flex-1">
                                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => realize(risk.id)}>Realize</Button>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => deleteRisk(risk.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Issue Log Tab ─────────────────────────────────────────────────────────────

function IssuesTab({ project, canManage }: any) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, reset } = useForm({
        title: '', description: '', category: 'other', severity: 'medium', priority: 'medium',
        owner_id: '', target_resolution_date: '', impact_description: '', notes: '',
    });

    const submit = () => {
        post(`/projects/${project.id}/issues`, { onSuccess: () => { reset(); setOpen(false); } });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">Issue Log <span className="text-muted-foreground text-sm font-normal ml-1">PMBOK §4.3.3</span></h3>
                {canManage && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild><Button size="sm"><PlusCircle className="w-4 h-4 mr-1" />Log Issue</Button></DialogTrigger>
                        <DialogContent className="max-w-xl">
                            <DialogHeader><DialogTitle>Log Issue</DialogTitle></DialogHeader>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <div className="col-span-2 space-y-1"><Label>Title *</Label><Input value={data.title} onChange={e => setData('title', e.target.value)} /></div>
                                <div className="col-span-2 space-y-1"><Label>Description</Label><Textarea value={data.description} onChange={e => setData('description', e.target.value)} rows={2} /></div>
                                <div className="space-y-1"><Label>Severity</Label>
                                    <Select value={data.severity} onValueChange={v => setData('severity', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{['low','medium','high','critical'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1"><Label>Priority</Label>
                                    <Select value={data.priority} onValueChange={v => setData('priority', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{['low','medium','high','urgent'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1"><Label>Target Resolution</Label><Input type="date" value={data.target_resolution_date} onChange={e => setData('target_resolution_date', e.target.value)} /></div>
                                <div className="col-span-2 space-y-1"><Label>Impact on Scope / Schedule / Cost</Label><Textarea value={data.impact_description} onChange={e => setData('impact_description', e.target.value)} rows={2} /></div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                                <Button onClick={submit} disabled={processing}>Log Issue</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {project.issues?.length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No issues logged yet.</p>}

            <div className="space-y-2">
                {project.issues?.map((issue: Issue) => (
                    <div key={issue.id} className="rounded-lg border p-3 flex items-start gap-3 hover:bg-muted/30">
                        <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${severityBadge(issue.severity)}`}>{issue.severity}</span>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-sm">{issue.title}</p>
                                <Badge variant="outline" className="text-xs capitalize">{issue.status.replace('_',' ')}</Badge>
                                <Badge variant="outline" className="text-xs capitalize">{issue.priority}</Badge>
                            </div>
                            {issue.impact_description && <p className="text-xs text-muted-foreground mt-1">Impact: {issue.impact_description}</p>}
                            {issue.target_resolution_date && <p className="text-xs text-muted-foreground">Due: {issue.target_resolution_date}</p>}
                        </div>
                        {canManage && (
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => router.delete(`/projects/${project.id}/issues/${issue.id}`)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Change Log Tab ─────────────────────────────────────────────────────────────

function ChangesTab({ project, canManage, changeTypes, changeTypeLabels }: any) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, reset } = useForm({
        title: '', description: '', change_type: 'other', justification: '',
        impacts_scope: false, impacts_schedule: false, impacts_cost: false, impacts_quality: false,
        schedule_impact_days: '', cost_impact: '',
    });

    const submit = () => {
        post(`/projects/${project.id}/changes`, { onSuccess: () => { reset(); setOpen(false); } });
    };

    const action = (changeId: number, action: 'approve' | 'reject' | 'implement') => {
        const notes = action === 'reject' ? prompt('Reason for rejection:') : undefined;
        if (action === 'reject' && !notes) return;
        router.post(`/projects/${project.id}/changes/${changeId}/${action}`, { review_notes: notes ?? '' });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">Change Log <span className="text-muted-foreground text-sm font-normal ml-1">PMBOK §4.6</span></h3>
                {canManage && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild><Button size="sm"><PlusCircle className="w-4 h-4 mr-1" />Request Change</Button></DialogTrigger>
                        <DialogContent className="max-w-xl">
                            <DialogHeader><DialogTitle>Submit Change Request</DialogTitle></DialogHeader>
                            <div className="space-y-3 mt-2">
                                <div className="space-y-1"><Label>Title *</Label><Input value={data.title} onChange={e => setData('title', e.target.value)} /></div>
                                <div className="space-y-1"><Label>Description *</Label><Textarea value={data.description} onChange={e => setData('description', e.target.value)} rows={2} /></div>
                                <div className="space-y-1"><Label>Change Type *</Label>
                                    <Select value={data.change_type} onValueChange={v => setData('change_type', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{changeTypes.map((t: string) => <SelectItem key={t} value={t}>{changeTypeLabels[t] ?? t}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1"><Label>Schedule Impact (days)</Label><Input type="number" value={data.schedule_impact_days} onChange={e => setData('schedule_impact_days', e.target.value)} /></div>
                                    <div className="space-y-1"><Label>Cost Impact</Label><Input type="number" value={data.cost_impact} onChange={e => setData('cost_impact', e.target.value)} /></div>
                                </div>
                                <div className="space-y-1"><Label>Justification</Label><Textarea value={data.justification} onChange={e => setData('justification', e.target.value)} rows={2} /></div>
                                <div className="flex gap-4 flex-wrap text-sm">
                                    {['impacts_scope','impacts_schedule','impacts_cost','impacts_quality'].map(field => (
                                        <label key={field} className="flex items-center gap-1.5 cursor-pointer">
                                            <input type="checkbox" checked={(data as any)[field]} onChange={e => setData(field as any, e.target.checked)} />
                                            {field.replace('impacts_','')}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                                <Button onClick={submit} disabled={processing}>Submit Request</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {project.changes?.length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No change requests yet.</p>}

            <div className="space-y-2">
                {project.changes?.map((change: Change) => (
                    <div key={change.id} className="rounded-lg border p-3 hover:bg-muted/30">
                        <div className="flex items-start gap-3">
                            <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${changeStatusBadge(change.status)}`}>{change.status.replace('_',' ')}</span>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-medium text-sm">{change.title}</p>
                                    <Badge variant="outline" className="text-xs">{changeTypeLabels[change.change_type] ?? change.change_type}</Badge>
                                </div>
                                <div className="flex gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                                    {change.impacts_scope     && <span>Scope</span>}
                                    {change.impacts_schedule  && <span>Schedule {change.schedule_impact_days != null ? `(${change.schedule_impact_days > 0 ? '+' : ''}${change.schedule_impact_days}d)` : ''}</span>}
                                    {change.impacts_cost      && <span>Cost {change.cost_impact != null ? `(${fmtMoney(change.cost_impact)})` : ''}</span>}
                                    {change.requestedBy && <span>by {change.requestedBy.name}</span>}
                                </div>
                            </div>
                            {canManage && change.status === 'submitted' && (
                                <div className="flex gap-1">
                                    <Button size="sm" variant="outline" className="h-7 text-xs text-green-600" onClick={() => action(change.id, 'approve')}>Approve</Button>
                                    <Button size="sm" variant="outline" className="h-7 text-xs text-red-600" onClick={() => action(change.id, 'reject')}>Reject</Button>
                                </div>
                            )}
                            {canManage && change.status === 'approved' && (
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => action(change.id, 'implement')}>Mark Implemented</Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Stakeholder Register Tab ───────────────────────────────────────────────────

function StakeholdersTab({ project, canManage, engagementLevels }: any) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, reset } = useForm({
        name: '', email: '', organization: '', role: '',
        influence: 'medium', interest: 'medium',
        current_engagement: 'unaware', desired_engagement: 'supportive',
        preferred_communication: '', expectations: '', concerns: '', management_strategy: '',
    });

    const submit = () => {
        post(`/projects/${project.id}/stakeholders`, { onSuccess: () => { reset(); setOpen(false); } });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">Stakeholder Register <span className="text-muted-foreground text-sm font-normal ml-1">PMBOK §13</span></h3>
                {canManage && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild><Button size="sm"><PlusCircle className="w-4 h-4 mr-1" />Add Stakeholder</Button></DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader><DialogTitle>Add Stakeholder</DialogTitle></DialogHeader>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <div className="space-y-1"><Label>Name *</Label><Input value={data.name} onChange={e => setData('name', e.target.value)} /></div>
                                <div className="space-y-1"><Label>Email</Label><Input value={data.email} onChange={e => setData('email', e.target.value)} /></div>
                                <div className="space-y-1"><Label>Organization</Label><Input value={data.organization} onChange={e => setData('organization', e.target.value)} /></div>
                                <div className="space-y-1"><Label>Project Role</Label><Input value={data.role} onChange={e => setData('role', e.target.value)} /></div>
                                <div className="space-y-1"><Label>Influence (Power)</Label>
                                    <Select value={data.influence} onValueChange={v => setData('influence', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{['low','medium','high'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1"><Label>Interest</Label>
                                    <Select value={data.interest} onValueChange={v => setData('interest', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{['low','medium','high'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1"><Label>Current Engagement</Label>
                                    <Select value={data.current_engagement} onValueChange={v => setData('current_engagement', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{engagementLevels.map((l: string) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1"><Label>Desired Engagement</Label>
                                    <Select value={data.desired_engagement} onValueChange={v => setData('desired_engagement', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{engagementLevels.map((l: string) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-2 space-y-1"><Label>Expectations</Label><Textarea value={data.expectations} onChange={e => setData('expectations', e.target.value)} rows={2} /></div>
                                <div className="col-span-2 space-y-1"><Label>Concerns / Objections</Label><Textarea value={data.concerns} onChange={e => setData('concerns', e.target.value)} rows={2} /></div>
                                <div className="col-span-2 space-y-1"><Label>Engagement Strategy</Label><Textarea value={data.management_strategy} onChange={e => setData('management_strategy', e.target.value)} rows={2} /></div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                                <Button onClick={submit} disabled={processing}>Add Stakeholder</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {project.stakeholders?.length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No stakeholders identified yet.</p>}

            <div className="grid md:grid-cols-2 gap-3">
                {project.stakeholders?.map((s: Stakeholder) => (
                    <div key={s.id} className="rounded-lg border p-3 hover:bg-muted/30">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="font-medium text-sm">{s.display_name ?? s.name}</p>
                                {s.role && <p className="text-xs text-muted-foreground">{s.role}{s.organization ? ` · ${s.organization}` : ''}</p>}
                            </div>
                            <Badge variant="outline" className="text-xs whitespace-nowrap">{s.management_strategy ?? ''}</Badge>
                        </div>
                        <div className="flex gap-2 mt-2 flex-wrap">
                            <span className="text-xs border rounded px-1.5 py-0.5">Power: {s.influence}</span>
                            <span className="text-xs border rounded px-1.5 py-0.5">Interest: {s.interest}</span>
                            <span className={`text-xs rounded px-1.5 py-0.5 ${engagementColour(s.current_engagement)}`}>Current: {s.current_engagement}</span>
                            {s.has_engagement_gap && <span className={`text-xs rounded px-1.5 py-0.5 ${engagementColour(s.desired_engagement)}`}>Target: {s.desired_engagement}</span>}
                        </div>
                        {s.management_strategy && <p className="text-xs text-muted-foreground mt-2 italic">{s.management_strategy}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Lessons Learned Tab ───────────────────────────────────────────────────────

function LessonsTab({ project, canManage, lessonCategories, lessonTypes }: any) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, reset } = useForm({
        title: '', situation: '', impact: '', recommendation: '',
        category: 'other', type: 'negative', phase_captured: '',
    });

    const submit = () => {
        post(`/projects/${project.id}/lessons`, { onSuccess: () => { reset(); setOpen(false); } });
    };

    const typeColour = (t: string) => ({
        positive: 'bg-green-100 text-green-700',
        negative: 'bg-red-100 text-red-700',
        observation: 'bg-blue-100 text-blue-700',
    }[t] ?? '');

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">Lessons Learned <span className="text-muted-foreground text-sm font-normal ml-1">PMBOK §4.4 / §4.7</span></h3>
                {canManage && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild><Button size="sm"><PlusCircle className="w-4 h-4 mr-1" />Record Lesson</Button></DialogTrigger>
                        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader><DialogTitle>Record Lesson Learned</DialogTitle></DialogHeader>
                            <div className="space-y-3 mt-2">
                                <div className="space-y-1"><Label>Title *</Label><Input value={data.title} onChange={e => setData('title', e.target.value)} /></div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1"><Label>Category</Label>
                                        <Select value={data.category} onValueChange={v => setData('category', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>{lessonCategories.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1"><Label>Type</Label>
                                        <Select value={data.type} onValueChange={v => setData('type', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>{lessonTypes.map((t: string) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-1"><Label>What happened? (Situation) *</Label><Textarea value={data.situation} onChange={e => setData('situation', e.target.value)} rows={2} /></div>
                                <div className="space-y-1"><Label>What was the effect? (Impact) *</Label><Textarea value={data.impact} onChange={e => setData('impact', e.target.value)} rows={2} /></div>
                                <div className="space-y-1"><Label>What should future projects do? (Recommendation) *</Label><Textarea value={data.recommendation} onChange={e => setData('recommendation', e.target.value)} rows={2} /></div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                                <Button onClick={submit} disabled={processing}>Record Lesson</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {project.lessons?.length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No lessons recorded yet. Capture lessons throughout the project lifecycle.</p>}

            <div className="space-y-3">
                {project.lessons?.map((lesson: Lesson) => (
                    <div key={lesson.id} className="rounded-lg border p-4 hover:bg-muted/30">
                        <div className="flex items-start gap-3">
                            <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${typeColour(lesson.type)}`}>{lesson.type}</span>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                    <p className="font-medium text-sm">{lesson.title}</p>
                                    <Badge variant="outline" className="text-xs capitalize">{lesson.category}</Badge>
                                    {lesson.phase_captured && <Badge variant="outline" className="text-xs capitalize">{lesson.phase_captured.replace('_',' ')}</Badge>}
                                </div>
                                <div className="space-y-1.5 text-sm">
                                    <div><span className="font-medium text-xs text-muted-foreground uppercase tracking-wide">Situation: </span>{lesson.situation}</div>
                                    <div><span className="font-medium text-xs text-muted-foreground uppercase tracking-wide">Impact: </span>{lesson.impact}</div>
                                    <div><span className="font-medium text-xs text-green-700 uppercase tracking-wide">→ Recommendation: </span>{lesson.recommendation}</div>
                                </div>
                                {lesson.createdBy && <p className="text-xs text-muted-foreground mt-2">Recorded by {lesson.createdBy.name}</p>}
                            </div>
                            {canManage && (
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => router.delete(`/projects/${project.id}/lessons/${lesson.id}`)}><Trash2 className="w-3.5 h-3.5" /></Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
// ── Tasks Tab ─────────────────────────────────────────────────────────────────

interface Task {
    id: number;
    title: string;
    description?: string | null;
    status: 'todo' | 'in_progress' | 'review' | 'done';
    priority: 'low' | 'medium' | 'high';
    wbs_code?: string | null;
    due_date?: string | null;
    completed_at?: string | null;
    estimated_hours?: number | null;
    spent_hours?: number | null;
    assignee?: { id: number; name: string; avatar?: string } | null;
    children?: Task[];
    parent_id?: number | null;
    milestone_id?: number | null;
}

const taskStatusConfig: Record<string, { label: string; colour: string; icon: React.ReactNode }> = {
    todo:        { label: 'To Do',      colour: 'bg-gray-100 text-gray-700',    icon: <Circle className="w-3 h-3" /> },
    in_progress: { label: 'In Progress', colour: 'bg-blue-100 text-blue-700',   icon: <RotateCcw className="w-3 h-3" /> },
    review:      { label: 'Review',     colour: 'bg-amber-100 text-amber-700',  icon: <Clock className="w-3 h-3" /> },
    done:        { label: 'Done',       colour: 'bg-green-100 text-green-700',  icon: <CheckCircle2 className="w-3 h-3" /> },
};
const priorityColour: Record<string, string> = {
    low: 'text-gray-400', medium: 'text-amber-500', high: 'text-red-500',
};

function TaskRow({ task, project, canManage, depth = 0 }: { task: Task; project: any; canManage: boolean; depth?: number }) {
    const [expanded, setExpanded] = useState(true);
    const [editing, setEditing] = useState(false);
    const { data, setData, put, processing, reset } = useForm({
        title: task.title,
        status: task.status,
        priority: task.priority,
        estimated_hours: task.estimated_hours ?? '',
        spent_hours: task.spent_hours ?? '',
    });

    const statusCfg = taskStatusConfig[task.status] ?? taskStatusConfig.todo;
    const hasChildren = (task.children?.length ?? 0) > 0;

    return (
        <>
            <div className={`flex items-center gap-2 py-2 px-3 rounded hover:bg-muted/40 group ${depth > 0 ? 'ml-6 border-l-2 border-muted' : ''}`}>
                {/* Expand toggle */}
                <button className="w-4 shrink-0" onClick={() => hasChildren && setExpanded(!expanded)}>
                    {hasChildren ? (
                        <span className="text-muted-foreground text-xs">{expanded ? '▾' : '▸'}</span>
                    ) : <span className="w-4" />}
                </button>

                {/* WBS + title */}
                <div className="shrink-0 min-w-0">
                    <div className="flex items-center gap-2">
                        {task.wbs_code && <span className="text-xs text-muted-foreground font-mono flex-1">{task.wbs_code}</span>}
                        <span className={`text-sm font-medium truncate ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                        </span>
                    </div>
                    {task.assignee && (
                        <p className="text-xs text-muted-foreground mt-0.5">{task.assignee.name}</p>
                    )}
                </div>

                {/* Priority */}
                <span className={`text-xs font-medium capitalize shrink-0 ${priorityColour[task.priority]}`}>
                    {task.priority}
                </span>

                {/* Status badge */}
                {canManage ? (
                    <Select value={task.status} onValueChange={(val) => {
                        router.put(`/api/v1/tasks/${task.id}`, { status: val }, { preserveScroll: true });
                    }}>
                        <SelectTrigger className={`h-6 text-xs px-2 border-0 flex-1 ${statusCfg.colour}`}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(taskStatusConfig).map(([val, cfg]) => (
                                <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium shrink-0 ${statusCfg.colour}`}>
                        {statusCfg.icon}{statusCfg.label}
                    </span>
                )}

                {/* Hours */}
                {(task.estimated_hours != null || task.spent_hours != null) && (
                    <span className="text-xs text-muted-foreground flex-1 hidden sm:inline">
                        {task.spent_hours ?? 0}h / {task.estimated_hours ?? '?'}h
                    </span>
                )}

                {/* Due date */}
                {task.due_date && (
                    <span className={`text-xs shrink-0 hidden md:inline ${
                        !task.completed_at && new Date(task.due_date) < new Date() ? 'text-red-500 font-medium' : 'text-muted-foreground'
                    }`}>
                        {new Date(task.due_date).toLocaleDateString()}
                    </span>
                )}

                {/* Delete */}
                {canManage && (
                    <button className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 shrink-0"
                        onClick={() => { if (confirm('Delete task?')) router.delete(`/api/v1/tasks/${task.id}`, { preserveScroll: true }); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Children */}
            {expanded && hasChildren && task.children!.map((child) => (
                <TaskRow key={child.id} task={child} project={project} canManage={canManage} depth={depth + 1} />
            ))}
        </>
    );
}

function TasksTab({ project, canManage }: { project: any; canManage: boolean }) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm({
        title: '', description: '', priority: 'medium', estimated_hours: '', due_date: '',
        assigned_to: '', parent_id: '',
    });

    // Separate top-level tasks (no parent) — children are embedded in task.children
    const topLevelTasks: Task[] = (project.tasks ?? []).filter((t: Task) => !t.parent_id);

    const total = project.tasks?.length ?? 0;
    const done  = (project.tasks ?? []).filter((t: Task) => t.status === 'done').length;
    const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

    // Progress is only "complete" when ALL tasks are done
    const allDone = total > 0 && done === total;

    const submit = () => {
        // BUG FIX: was router.post to /projects/{id}/tasks (web route that doesn't exist).
        // Task creation goes through the API: POST /api/v1/projects/{id}/tasks
        api.post(`/projects/${project.id}/tasks`, {
            title: data.title,
            description: data.description || undefined,
            priority: data.priority,
            estimated_hours: data.estimated_hours ? Number(data.estimated_hours) : undefined,
            due_date: data.due_date || undefined,
            parent_id: data.parent_id ? Number(data.parent_id) : undefined,
            status: 'todo',
        })
        .then(() => {
            reset();
            setOpen(false);
            // Reload the page so the task list refreshes from Inertia props
            router.reload({ only: ['project'] });
        })
        .catch((err) => console.error('Task creation failed', err));
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold flex items-center gap-2">
                        Tasks
                        <Badge variant={allDone ? 'default' : 'secondary'}>{done}/{total} done</Badge>
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                        <Progress value={pct} className="w-40 h-2" />
                        <span className="text-sm text-muted-foreground">{pct}%</span>
                        {allDone && (
                            <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />All tasks complete
                            </span>
                        )}
                    </div>
                </div>
                {canManage && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm"><PlusCircle className="w-4 h-4 mr-1" />Add Task</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
                            <div className="space-y-3 mt-2">
                                <div className="space-y-1">
                                    <Label>Title *</Label>
                                    <Input value={data.title} onChange={e => setData('title', e.target.value)} placeholder="Task title" />
                                    {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label>Description</Label>
                                    <Textarea value={data.description} onChange={e => setData('description', e.target.value)} rows={2} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label>Priority</Label>
                                        <Select value={data.priority} onValueChange={v => setData('priority', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Estimated Hours</Label>
                                        <Input type="number" min="0" value={data.estimated_hours}
                                            onChange={e => setData('estimated_hours', e.target.value)} placeholder="0" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label>Due Date</Label>
                                        <Input type="date" value={data.due_date} onChange={e => setData('due_date', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Parent Task</Label>
                                        <Select value={data.parent_id} onValueChange={v => setData('parent_id', v)}>
                                            <SelectTrigger><SelectValue placeholder="None (top-level)" /></SelectTrigger>
                                            <SelectContent>
                                                {(project.tasks ?? []).filter((t: Task) => !t.parent_id).map((t: Task) => (
                                                    <SelectItem key={t.id} value={String(t.id)}>
                                                        {t.wbs_code ? `${t.wbs_code} — ` : ''}{t.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="outline" onClick={() => { reset(); setOpen(false); }}>Cancel</Button>
                                <Button onClick={submit} disabled={processing}>Add Task</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Group by status summary */}
            <div className="grid grid-cols-4 gap-3">
                {Object.entries(taskStatusConfig).map(([status, cfg]) => {
                    const count = (project.tasks ?? []).filter((t: Task) => t.status === status).length;
                    return (
                        <div key={status} className={`rounded-lg p-3 ${cfg.colour}`}>
                            <div className="flex items-center gap-1.5 mb-1">{cfg.icon}<span className="text-xs font-medium">{cfg.label}</span></div>
                            <p className="text-xl font-bold">{count}</p>
                        </div>
                    );
                })}
            </div>

            {/* Task list */}
            {total === 0 ? (
                <div className="py-12 text-center">
                    <CheckSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No tasks yet. Add the first task to get started.</p>
                </div>
            ) : (
                <div className="rounded-lg border divide-y">
                    {topLevelTasks.map((task: Task) => (
                        <TaskRow key={task.id} task={task} project={project} canManage={canManage} />
                    ))}
                </div>
            )}
        </div>
    );
}