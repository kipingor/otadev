import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    FileText, Search, Upload, AlertTriangle, Clock, CheckCircle2,
    Trophy, XCircle, ArrowRight, Sparkles, Calendar
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Tenders', href: '/tenders' }];

const STATUS_CFG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
    reviewing: { label: 'Reviewing',  bg: 'bg-blue-100',    text: 'text-blue-700',    icon: FileText },
    drafting:  { label: 'Drafting',   bg: 'bg-amber-100',   text: 'text-amber-700',   icon: FileText },
    submitted: { label: 'Submitted',  bg: 'bg-purple-100',  text: 'text-purple-700',  icon: CheckCircle2 },
    won:       { label: 'Won',        bg: 'bg-emerald-100', text: 'text-emerald-700', icon: Trophy },
    lost:      { label: 'Lost',       bg: 'bg-red-100',     text: 'text-red-600',     icon: XCircle },
    withdrawn: { label: 'Withdrawn',  bg: 'bg-gray-100',    text: 'text-gray-500',    icon: XCircle },
};

interface Tender {
    id: number; title: string; issuer?: string; reference_number?: string;
    status: string; submission_deadline?: string; estimated_value?: number; currency: string;
    checklist?: any[]; information_gaps?: any[];
    ai_analysis?: { opportunity_score?: number };
    created_at: string;
}

interface Props {
    tenders: { data: Tender[]; meta: any };
    counts: Record<string, number>;
    urgentCount: number;
}

function daysUntil(d?: string) {
    if (!d) return null;
    return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000));
}

function fmtMoney(v?: number, c?: string) {
    if (!v) return null;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: c ?? 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(v);
}

export default function TendersIndex({ tenders, counts, urgentCount }: Props) {
    const [search, setSearch] = useState('');
    const [activeStatus, setActiveStatus] = useState('');

    function filterStatus(s: string) {
        const next = activeStatus === s ? '' : s;
        setActiveStatus(next);
        router.get('/tenders', { status: next, search }, { preserveState: true, replace: true });
    }

    function onSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get('/tenders', { status: activeStatus, search }, { preserveState: true, replace: true });
    }

    const statItems = [
        { key: 'reviewing', label: 'Reviewing',  icon: FileText,     urgent: false },
        { key: 'drafting',  label: 'Drafting',   icon: FileText,     urgent: false },
        { key: 'submitted', label: 'Submitted',  icon: CheckCircle2, urgent: false },
        { key: 'won',       label: 'Won',        icon: Trophy,       urgent: false },
        { key: 'lost',      label: 'Lost',       icon: XCircle,      urgent: false },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tenders & RFPs" />
            <div className="space-y-6 p-6">

                {/* Header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Tenders &amp; RFPs</h1>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                            AI agent guides you through the entire bid process
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {urgentCount > 0 && (
                            <div className="flex items-center gap-1.5 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                {urgentCount} deadline{urgentCount !== 1 ? 's' : ''} within 7 days
                            </div>
                        )}
                        <Button asChild>
                            <Link href="/tenders/create"><Upload className="h-4 w-4 mr-2" />Upload Tender</Link>
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {statItems.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => filterStatus(key)}
                            className={`text-left p-3 rounded-xl border transition-all ${
                                activeStatus === key ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                        >
                            <Icon className="h-4 w-4 mb-1 text-gray-400" />
                            <div className="text-xl font-bold text-gray-900">{counts[key] ?? 0}</div>
                            <div className="text-xs text-gray-500">{label}</div>
                        </button>
                    ))}
                </div>

                {/* Search + filter */}
                <div className="flex gap-3 flex-wrap items-center">
                    <form onSubmit={onSearch} className="flex gap-2">
                        <Input placeholder="Search title, issuer, reference…" value={search} onChange={e => setSearch(e.target.value)} className="w-64" />
                        <Button type="submit" variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
                    </form>
                    <div className="flex gap-1.5 flex-wrap">
                        {Object.entries(STATUS_CFG).filter(([k]) => k !== 'withdrawn').map(([key, { label }]) => (
                            <button
                                key={key}
                                onClick={() => filterStatus(key)}
                                className={`px-3 py-1 text-xs rounded-full border transition-all ${
                                    activeStatus === key ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:border-gray-400'
                                }`}
                            >{label}</button>
                        ))}
                    </div>
                </div>

                {/* List */}
                {tenders.data.length === 0 ? (
                    <div className="text-center py-20 border border-dashed rounded-xl">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="font-medium text-gray-500">No tenders yet</p>
                        <p className="text-sm text-gray-400 mt-1">Upload a tender or RFP document and let AI analyse it and guide your bid</p>
                        <Button asChild className="mt-5"><Link href="/tenders/create"><Upload className="h-4 w-4 mr-2" />Upload Tender</Link></Button>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {tenders.data.map(tender => {
                            const cfg      = STATUS_CFG[tender.status] ?? STATUS_CFG.reviewing;
                            const StatusIcon = cfg.icon;
                            const days     = daysUntil(tender.submission_deadline);
                            const urgent   = days !== null && days <= 7 && ['reviewing', 'drafting'].includes(tender.status);
                            const total    = tender.checklist?.length ?? 0;
                            const done     = tender.checklist?.filter((i: any) => i.done).length ?? 0;
                            const gaps     = tender.information_gaps?.filter((g: any) => !g.resolved).length ?? 0;
                            const score    = tender.ai_analysis?.opportunity_score;

                            return (
                                <Link key={tender.id} href={`/tenders/${tender.id}`}>
                                    <div className={`bg-white border rounded-xl p-4 hover:shadow-md transition-all flex items-center gap-4 ${urgent ? 'border-l-4 border-l-amber-400 border-r border-t border-b border-gray-200' : 'border-gray-200'}`}>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-gray-900">{tender.title}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${cfg.bg} ${cfg.text}`}>
                                                    <StatusIcon className="h-3 w-3" />{cfg.label}
                                                </span>
                                                {urgent && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium flex items-center gap-1">
                                                        <AlertTriangle className="h-3 w-3" />{days === 0 ? 'Due today' : `${days}d left`}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                                                {tender.issuer && <span>{tender.issuer}</span>}
                                                {tender.reference_number && <span className="font-mono">{tender.reference_number}</span>}
                                                {tender.submission_deadline && !urgent && (
                                                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{tender.submission_deadline}</span>
                                                )}
                                                {fmtMoney(tender.estimated_value, tender.currency) && (
                                                    <span className="font-medium text-gray-700">{fmtMoney(tender.estimated_value, tender.currency)}</span>
                                                )}
                                            </div>
                                            {total > 0 && (
                                                <div className="flex items-center gap-3 mt-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.round(done / total * 100)}%` }} />
                                                        </div>
                                                        <span className="text-xs text-gray-500">{done}/{total} tasks</span>
                                                    </div>
                                                    {gaps > 0 && <span className="text-xs text-amber-600">{gaps} gap{gaps !== 1 ? 's' : ''} unresolved</span>}
                                                    {score && <span className="text-xs text-emerald-600 font-medium">Score: {score}/100</span>}
                                                </div>
                                            )}
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}