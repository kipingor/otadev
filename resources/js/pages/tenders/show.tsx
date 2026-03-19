import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Sparkles, FileText, CheckSquare, AlertCircle, MessageSquare,
    Trophy, Send, CheckCircle2, Circle, ChevronDown, ChevronUp,
    ArrowRight, RefreshCw, Download, TrendingUp, Calendar, Clock,
    Plus
} from 'lucide-react';

interface ChecklistItem { id: string; category: string; label: string; done: boolean; notes?: string }
interface GapItem { id: string; category: string; question: string; why_needed: string; answer?: string; resolved: boolean }
interface GeneratedDoc { type: string; title: string; content: string; created_at: string }
interface ChatMessage { role: 'user' | 'assistant'; content: string; created_at?: string }

interface Tender {
    id: number; title: string; issuer?: string; reference_number?: string;
    status: string; submission_deadline?: string; submitted_at?: string;
    estimated_value?: number; currency: string; document_name?: string;
    extracted_data?: any; ai_analysis?: any;
    checklist?: ChecklistItem[];
    information_gaps?: GapItem[];
    generated_documents?: GeneratedDoc[];
    agent_conversation?: ChatMessage[];
    lead?: any; opportunity?: any; project?: any;
}

const STATUS_CFG: Record<string, { label: string; color: string }> = {
    reviewing: { label: 'Reviewing', color: 'bg-blue-100 text-blue-700' },
    drafting:  { label: 'Drafting',  color: 'bg-amber-100 text-amber-700' },
    submitted: { label: 'Submitted', color: 'bg-purple-100 text-purple-700' },
    won:       { label: 'Won 🎉',    color: 'bg-emerald-100 text-emerald-700' },
    lost:      { label: 'Lost',      color: 'bg-red-100 text-red-600' },
    withdrawn: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-500' },
};

const DOC_TYPES = [
    { value: 'cover_letter',         label: 'Cover Letter' },
    { value: 'capability_statement', label: 'Capability Statement' },
    { value: 'executive_summary',    label: 'Executive Summary' },
    { value: 'methodology',          label: 'Proposed Methodology' },
    { value: 'compliance_matrix',    label: 'Compliance Matrix' },
    { value: 'pricing_schedule',     label: 'Pricing Schedule' },
];

const CATEGORY_COLORS: Record<string, string> = {
    Documents:      'bg-blue-50 text-blue-700 border-blue-200',
    Compliance:     'bg-purple-50 text-purple-700 border-purple-200',
    Technical:      'bg-indigo-50 text-indigo-700 border-indigo-200',
    Financial:      'bg-emerald-50 text-emerald-700 border-emerald-200',
    Administrative: 'bg-gray-50 text-gray-600 border-gray-200',
    'Company Info':  'bg-amber-50 text-amber-700 border-amber-200',
    Legal:          'bg-red-50 text-red-700 border-red-200',
    Experience:     'bg-orange-50 text-orange-700 border-orange-200',
};

function csrfToken() {
    return (document.querySelector('meta[name=csrf-token]') as any)?.content ?? '';
}

async function api(url: string, body: any) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
        body: JSON.stringify(body),
    });
    return res.json();
}

function ProgressBar({ done, total }: { done: number; total: number }) {
    const pct = total > 0 ? Math.round(done / total * 100) : 0;
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-gray-500 w-12 text-right">{done}/{total}</span>
        </div>
    );
}

export default function TenderShow() {
    const { props } = usePage<{ tender: Tender }>();
    const [tender, setTender] = useState(props.tender);
    const [activeTab, setActiveTab] = useState<'overview' | 'checklist' | 'gaps' | 'documents' | 'chat'>('overview');

    // Chat state
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>(tender.agent_conversation ?? []);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Checklist state
    const [checklist, setChecklist] = useState<ChecklistItem[]>(tender.checklist ?? []);

    // Gaps state
    const [gaps, setGaps] = useState<GapItem[]>(tender.information_gaps ?? []);
    const [gapAnswers, setGapAnswers] = useState<Record<number, string>>({});

    // Document generation
    const [docType, setDocType] = useState('cover_letter');
    const [docContext, setDocContext] = useState('');
    const [docLoading, setDocLoading] = useState(false);
    const [generatedDocs, setGeneratedDocs] = useState<GeneratedDoc[]>(tender.generated_documents ?? []);
    const [viewingDoc, setViewingDoc] = useState<GeneratedDoc | null>(null);

    // Lead/opportunity/project actions
    const [actionLoading, setActionLoading] = useState('');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Tenders', href: '/tenders' },
        { title: tender.title, href: `/tenders/${tender.id}` },
    ];

    const cfg = STATUS_CFG[tender.status] ?? STATUS_CFG.reviewing;
    const doneCount = checklist.filter(i => i.done).length;
    const unresolvedGaps = gaps.filter(g => !g.resolved).length;
    const days = tender.submission_deadline ? Math.ceil((new Date(tender.submission_deadline).getTime() - Date.now()) / 86400000) : null;

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

    async function sendChat() {
        if (!chatInput.trim() || chatLoading) return;
        const msg = chatInput.trim();
        setChatInput('');
        setChatHistory(h => [...h, { role: 'user', content: msg }]);
        setChatLoading(true);
        try {
            const data = await api(`/tenders/${tender.id}/chat`, { message: msg });
            if (data.response) {
                setChatHistory(h => [...h, { role: 'assistant', content: data.response }]);
            }
        } finally {
            setChatLoading(false);
        }
    }

    async function toggleItem(index: number, done: boolean) {
        const updated = checklist.map((item, i) => i === index ? { ...item, done } : item);
        setChecklist(updated);
        await api(`/tenders/${tender.id}/toggle-checklist`, { item_index: index, done });
    }

    async function answerGap(index: number) {
        const answer = gapAnswers[index];
        if (!answer?.trim()) return;
        const data = await api(`/tenders/${tender.id}/answer-gap`, { gap_index: index, answer });
        if (data.gaps) {
            setGaps(data.gaps);
            setGapAnswers(a => { const c = { ...a }; delete c[index]; return c; });
        }
    }

    async function generateDocument() {
        setDocLoading(true);
        try {
            const data = await api(`/tenders/${tender.id}/generate-document`, {
                type: docType,
                additional_context: docContext,
            });
            if (data.document) {
                setGeneratedDocs(d => {
                    const next = d.filter(x => x.type !== data.document.type);
                    return [...next, data.document];
                });
                setViewingDoc(data.document);
            }
        } finally {
            setDocLoading(false);
        }
    }

    async function createLeadAndOpportunity() {
        setActionLoading('lead');
        try {
            const data = await api(`/tenders/${tender.id}/create-lead`, {});
            if (data.lead_url) router.visit(data.lead_url);
        } finally { setActionLoading(''); }
    }

    async function convertToProject() {
        setActionLoading('project');
        try {
            const data = await api(`/tenders/${tender.id}/convert-to-project`, {});
            if (data.project_url) router.visit(data.project_url);
        } finally { setActionLoading(''); }
    }

    const tabs = [
        { key: 'overview',   label: 'Overview',   icon: Sparkles },
        { key: 'checklist',  label: `Checklist (${doneCount}/${checklist.length})`, icon: CheckSquare },
        { key: 'gaps',       label: `Info Gaps${unresolvedGaps > 0 ? ` (${unresolvedGaps})` : ''}`, icon: AlertCircle },
        { key: 'documents',  label: `Documents (${generatedDocs.length})`, icon: FileText },
        { key: 'chat',       label: 'AI Agent',   icon: MessageSquare },
    ] as const;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={tender.title} />
            <div className="p-6 space-y-5 max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h1 className="text-2xl font-bold text-gray-900">{tender.title}</h1>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                            {tender.issuer && <span>{tender.issuer}</span>}
                            {tender.reference_number && <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{tender.reference_number}</span>}
                            {tender.submission_deadline && (
                                <span className={`flex items-center gap-1 ${days !== null && days <= 7 ? 'text-amber-600 font-semibold' : ''}`}>
                                    <Calendar className="h-3.5 w-3.5" />
                                    {tender.submission_deadline}
                                    {days !== null && days >= 0 && ` (${days}d)`}
                                </span>
                            )}
                            {tender.estimated_value && (
                                <span className="text-gray-700 font-medium">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: tender.currency }).format(tender.estimated_value)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                        {!tender.lead && tender.status !== 'lost' && tender.status !== 'withdrawn' && (
                            <Button variant="outline" size="sm" onClick={createLeadAndOpportunity} disabled={actionLoading === 'lead'} className="gap-1.5">
                                <TrendingUp className="h-3.5 w-3.5" />
                                {actionLoading === 'lead' ? 'Creating…' : 'Create Lead'}
                            </Button>
                        )}
                        {tender.status === 'won' && !tender.project && (
                            <Button size="sm" onClick={convertToProject} disabled={actionLoading === 'project'} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                                <Trophy className="h-3.5 w-3.5" />
                                {actionLoading === 'project' ? 'Creating…' : 'Convert to Project'}
                            </Button>
                        )}
                        {tender.lead && <Button asChild variant="outline" size="sm"><Link href={`/leads/${tender.lead.id}`}><ArrowRight className="h-3.5 w-3.5 mr-1" />View Lead</Link></Button>}
                        {tender.project && <Button asChild variant="outline" size="sm"><Link href={`/projects/${tender.project.id}`}><ArrowRight className="h-3.5 w-3.5 mr-1" />View Project</Link></Button>}
                        {['reviewing', 'drafting'].includes(tender.status) && (
                            <Button variant="outline" size="sm" onClick={() => router.post(`/tenders/${tender.id}/submit`)}>Mark Submitted</Button>
                        )}
                        {tender.status === 'submitted' && (
                            <>
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => router.post(`/tenders/${tender.id}/won`)}>Mark Won</Button>
                                <Button variant="outline" size="sm" onClick={() => router.post(`/tenders/${tender.id}/lost`)}>Mark Lost</Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Progress summary bar */}
                {checklist.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-6 flex-wrap">
                        <div className="flex-1 min-w-48">
                            <p className="text-xs text-gray-500 mb-1">Checklist Progress</p>
                            <ProgressBar done={doneCount} total={checklist.length} />
                        </div>
                        {unresolvedGaps > 0 && (
                            <div className="flex items-center gap-1.5 text-sm text-amber-700">
                                <AlertCircle className="h-4 w-4" />
                                {unresolvedGaps} information gap{unresolvedGaps !== 1 ? 's' : ''} need attention
                            </div>
                        )}
                        {tender.ai_analysis?.opportunity_score && (
                            <div className="text-sm">
                                <span className="text-gray-400 text-xs">Opportunity score</span>
                                <div className="text-xl font-bold text-emerald-600">{tender.ai_analysis.opportunity_score}<span className="text-sm text-gray-400">/100</span></div>
                            </div>
                        )}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
                    {tabs.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                                activeTab === key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Icon className="h-3.5 w-3.5" />{label}
                        </button>
                    ))}
                </div>

                {/* ── Overview ── */}
                {activeTab === 'overview' && (
                    <div className="space-y-5">
                        {tender.ai_analysis && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-indigo-500" />AI Strategic Analysis</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {tender.ai_analysis.summary && <p className="text-gray-700">{tender.ai_analysis.summary}</p>}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {(tender.ai_analysis.strengths ?? []).length > 0 && (
                                            <div>
                                                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Our Strengths</p>
                                                <ul className="space-y-1">{(tender.ai_analysis.strengths ?? []).map((s: string, i: number) => <li key={i} className="text-sm text-gray-700 flex gap-2"><span className="text-emerald-500 mt-0.5">✓</span>{s}</li>)}</ul>
                                            </div>
                                        )}
                                        {(tender.ai_analysis.risks ?? []).length > 0 && (
                                            <div>
                                                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Risks</p>
                                                <ul className="space-y-1">{(tender.ai_analysis.risks ?? []).map((r: string, i: number) => <li key={i} className="text-sm text-gray-700 flex gap-2"><span className="text-amber-500 mt-0.5">⚠</span>{r}</li>)}</ul>
                                            </div>
                                        )}
                                    </div>
                                    {tender.ai_analysis.recommended_approach && (
                                        <div className="bg-indigo-50 rounded-xl p-4">
                                            <p className="text-sm font-semibold text-indigo-700 mb-1">Recommended Approach</p>
                                            <p className="text-sm text-indigo-600">{tender.ai_analysis.recommended_approach}</p>
                                        </div>
                                    )}
                                    {(tender.ai_analysis.win_themes ?? []).length > 0 && (
                                        <div>
                                            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Win Themes</p>
                                            <div className="flex gap-2 flex-wrap">{(tender.ai_analysis.win_themes ?? []).map((t: string, i: number) => <span key={i} className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">{t}</span>)}</div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {tender.extracted_data && (
                            <Card>
                                <CardHeader className="pb-3"><CardTitle className="text-base">Extracted Requirements</CardTitle></CardHeader>
                                <CardContent className="space-y-4 text-sm">
                                    {(tender.extracted_data.scope_of_work ?? []).length > 0 && (
                                        <div>
                                            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Scope of Work</p>
                                            <ul className="space-y-1">{tender.extracted_data.scope_of_work.map((s: string, i: number) => <li key={i} className="text-gray-700 flex gap-2"><span className="text-gray-400">•</span>{s}</li>)}</ul>
                                        </div>
                                    )}
                                    {(tender.extracted_data.evaluation_criteria ?? []).length > 0 && (
                                        <div>
                                            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Evaluation Criteria</p>
                                            <div className="space-y-1">{tender.extracted_data.evaluation_criteria.map((c: any, i: number) => (
                                                <div key={i} className="flex items-center justify-between bg-gray-50 rounded px-3 py-1.5">
                                                    <span className="text-gray-700">{c.criterion}</span>
                                                    {c.weight && <span className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">{c.weight}</span>}
                                                </div>
                                            ))}</div>
                                        </div>
                                    )}
                                    {(tender.extracted_data.required_documents ?? []).length > 0 && (
                                        <div>
                                            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Required Documents</p>
                                            <ul className="space-y-1">{tender.extracted_data.required_documents.map((d: string, i: number) => <li key={i} className="text-gray-700 flex gap-2"><FileText className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />{d}</li>)}</ul>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* ── Checklist ── */}
                {activeTab === 'checklist' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">{doneCount} of {checklist.length} items complete</p>
                            <ProgressBar done={doneCount} total={checklist.length} />
                        </div>
                        {Object.entries(
                            checklist.reduce<Record<string, { item: ChecklistItem; index: number }[]>>((acc, item, i) => {
                                const cat = item.category ?? 'Other';
                                if (!acc[cat]) acc[cat] = [];
                                acc[cat].push({ item, index: i });
                                return acc;
                            }, {})
                        ).map(([category, items]) => (
                            <div key={category}>
                                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">{category}</p>
                                <div className="space-y-2">
                                    {items.map(({ item, index }) => (
                                        <div
                                            key={item.id}
                                            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                                item.done ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200 hover:border-gray-300'
                                            }`}
                                            onClick={() => toggleItem(index, !item.done)}
                                        >
                                            {item.done
                                                ? <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                : <Circle className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
                                            }
                                            <div className="flex-1">
                                                <p className={`text-sm font-medium ${item.done ? 'text-emerald-700 line-through' : 'text-gray-800'}`}>{item.label}</p>
                                                {item.notes && <p className="text-xs text-gray-400 mt-0.5">{item.notes}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Information Gaps ── */}
                {activeTab === 'gaps' && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-500">{unresolvedGaps} unresolved gaps — AI has identified information you need to provide for the bid.</p>
                        {gaps.length === 0 && <p className="text-center py-10 text-gray-400">No information gaps identified.</p>}
                        {Object.entries(
                            gaps.reduce<Record<string, { gap: GapItem; index: number }[]>>((acc, gap, i) => {
                                const cat = gap.category ?? 'Other';
                                if (!acc[cat]) acc[cat] = [];
                                acc[cat].push({ gap, index: i });
                                return acc;
                            }, {})
                        ).map(([category, items]) => (
                            <div key={category}>
                                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">{category}</p>
                                <div className="space-y-3">
                                    {items.map(({ gap, index }) => (
                                        <Card key={gap.id} className={`border ${gap.resolved ? 'border-emerald-200 bg-emerald-50/30' : 'border-amber-200 bg-amber-50/30'}`}>
                                            <CardContent className="pt-4 space-y-3">
                                                <div className="flex items-start gap-2">
                                                    {gap.resolved
                                                        ? <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                        : <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                                    }
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-gray-800">{gap.question}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">{gap.why_needed}</p>
                                                    </div>
                                                </div>
                                                {gap.resolved ? (
                                                    <div className="bg-white rounded-lg border border-emerald-200 px-3 py-2 text-sm text-emerald-700">{gap.answer}</div>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <Textarea
                                                            placeholder="Provide your answer…"
                                                            value={gapAnswers[index] ?? ''}
                                                            onChange={e => setGapAnswers(a => ({ ...a, [index]: e.target.value }))}
                                                            rows={2}
                                                            className="text-sm bg-white"
                                                        />
                                                        <Button size="sm" onClick={() => answerGap(index)} disabled={!gapAnswers[index]?.trim()} className="self-end">Save</Button>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Documents ── */}
                {activeTab === 'documents' && (
                    <div className="space-y-5">
                        {/* Generator */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-indigo-500" />Generate a Document</CardTitle>
                                <CardDescription>AI uses the tender requirements and your answers to gaps to write bid documents.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex gap-3 flex-wrap">
                                    <select
                                        value={docType}
                                        onChange={e => setDocType(e.target.value)}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-40"
                                    >
                                        {DOC_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                    </select>
                                    <Button onClick={generateDocument} disabled={docLoading} className="gap-2">
                                        {docLoading ? <><RefreshCw className="h-4 w-4 animate-spin" />Generating…</> : <><Sparkles className="h-4 w-4" />Generate</>}
                                    </Button>
                                </div>
                                <Textarea
                                    placeholder="Additional instructions for this document (optional)…"
                                    value={docContext}
                                    onChange={e => setDocContext(e.target.value)}
                                    rows={2}
                                    className="text-sm"
                                />
                            </CardContent>
                        </Card>

                        {/* Generated docs list */}
                        {generatedDocs.length === 0 && (
                            <p className="text-sm text-gray-400 text-center py-8">No documents generated yet. Use the form above to create your first bid document.</p>
                        )}
                        <div className="grid gap-3">
                            {generatedDocs.map(doc => (
                                <div
                                    key={doc.type}
                                    className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all"
                                    onClick={() => setViewingDoc(viewingDoc?.type === doc.type ? null : doc)}
                                >
                                    <FileText className="h-8 w-8 text-indigo-400 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-800">{doc.title}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">Generated {new Date(doc.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={e => {
                                            e.stopPropagation();
                                            navigator.clipboard.writeText(doc.content);
                                        }}>Copy</Button>
                                        {viewingDoc?.type === doc.type ? <ChevronUp className="h-4 w-4 text-gray-400 self-center" /> : <ChevronDown className="h-4 w-4 text-gray-400 self-center" />}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Document viewer */}
                        {viewingDoc && (
                            <Card>
                                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                    <CardTitle className="text-base">{viewingDoc.title}</CardTitle>
                                    <Button variant="ghost" size="sm" onClick={() => setViewingDoc(null)}>Close</Button>
                                </CardHeader>
                                <CardContent>
                                    <Textarea
                                        value={viewingDoc.content}
                                        onChange={e => setViewingDoc(d => d ? { ...d, content: e.target.value } : d)}
                                        rows={20}
                                        className="font-mono text-sm"
                                    />
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* ── AI Agent Chat ── */}
                {activeTab === 'chat' && (
                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-indigo-500" />Tender Agent
                                </CardTitle>
                                <CardDescription>Ask about requirements, get advice on your bid strategy, request document improvements, or ask what to do next.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {/* Chat history */}
                                <div className="space-y-3 max-h-[480px] overflow-y-auto mb-4 pr-1">
                                    {chatHistory.length === 0 && (
                                        <div className="text-center py-10">
                                            <Sparkles className="h-10 w-10 text-indigo-300 mx-auto mb-3" />
                                            <p className="text-sm text-gray-500 font-medium">Your AI Tender Agent is ready</p>
                                            <p className="text-xs text-gray-400 mt-1">Ask anything about this tender — requirements, strategy, next steps, or document feedback</p>
                                            <div className="flex flex-wrap gap-2 justify-center mt-4">
                                                {["What should I do next?", "What are the key evaluation criteria?", "What are our biggest risks?", "Help me improve the cover letter"].map(q => (
                                                    <button key={q} onClick={() => setChatInput(q)} className="text-xs border border-indigo-200 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-50 transition-colors">{q}</button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {chatHistory.map((msg, i) => (
                                        <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            {msg.role === 'assistant' && (
                                                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                                                </div>
                                            )}
                                            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                                                msg.role === 'user'
                                                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                                                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                                            }`}>{msg.content}</div>
                                        </div>
                                    ))}
                                    {chatLoading && (
                                        <div className="flex gap-3">
                                            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                                <Sparkles className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
                                            </div>
                                            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                                                <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Input */}
                                <div className="flex gap-2">
                                    <Input
                                        value={chatInput}
                                        onChange={e => setChatInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
                                        placeholder="Ask your tender agent anything…"
                                        disabled={chatLoading}
                                        className="flex-1"
                                    />
                                    <Button onClick={sendChat} disabled={!chatInput.trim() || chatLoading} size="icon">
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}