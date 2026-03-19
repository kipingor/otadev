import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Mail, Phone, Building2, MapPin, Calendar, Sparkles,
    CheckCircle2, Clock, RotateCcw, ArrowRight, User,
    TrendingUp, ChevronDown, ChevronUp, Send, Tag
} from 'lucide-react';

interface FollowUp {
    id: number; sequence: number; subject: string; body: string;
    status: 'scheduled' | 'sent' | 'replied' | 'skipped';
    scheduled_at: string; sent_at?: string; reply_notes?: string;
}

interface Contact {
    id: number; name: string; email?: string; phone?: string;
    company?: string; role?: string; event_name?: string; event_location?: string;
    met_at?: string; source?: string; talking_points?: string; notes?: string;
    status: string; follow_up_count: number;
    last_contact_at?: string; next_follow_up_at?: string;
    key_topics?: string[];
    ai_email_draft?: string;
    ai_context_summary?: { summary?: string; pain_points?: string[]; opportunities?: string[]; next_step_suggestion?: string };
    follow_ups: FollowUp[];
    lead?: { id: number; title: string; status: string } | null;
}

const STATUS_CFG: Record<string, { label: string; color: string }> = {
    new:          { label: 'New',          color: 'bg-slate-100 text-slate-700' },
    email_sent:   { label: 'Email Sent',   color: 'bg-blue-100 text-blue-700' },
    following_up: { label: 'Following Up', color: 'bg-amber-100 text-amber-700' },
    responded:    { label: 'Responded',    color: 'bg-emerald-100 text-emerald-700' },
    converted:    { label: 'Converted',    color: 'bg-purple-100 text-purple-700' },
    dropped:      { label: 'Dropped',      color: 'bg-red-100 text-red-600' },
};

const FOLLOW_UP_STATUS_CFG: Record<string, { label: string; icon: any; color: string }> = {
    scheduled: { label: 'Scheduled', icon: Clock,        color: 'text-amber-600 bg-amber-50' },
    sent:      { label: 'Sent',      icon: Send,         color: 'text-blue-600 bg-blue-50' },
    replied:   { label: 'Replied',   icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
    skipped:   { label: 'Skipped',   icon: ChevronDown,  color: 'text-gray-400 bg-gray-50' },
};

function formatDate(d?: string) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ContactShow() {
    const { props } = usePage<{ contact: Contact }>();
    const [contact, setContact]   = useState(props.contact);
    const [emailDraft, setEmailDraft] = useState(contact.ai_email_draft ?? '');
    const [tone, setTone]         = useState('professional');
    const [regenLoading, setRegenLoading] = useState(false);
    const [sendingId, setSendingId] = useState<number | null>(null);
    const [sendingInitial, setSendingInitial] = useState(false);
    const [converting, setConverting] = useState(false);
    const [expandedFU, setExpandedFU] = useState<number | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Contacts', href: '/contacts' },
        { title: contact.name, href: `/contacts/${contact.id}` },
    ];

    const cfg = STATUS_CFG[contact.status] ?? STATUS_CFG.new;

    async function regenerateEmail() {
        setRegenLoading(true);
        try {
            const res = await fetch(`/contacts/${contact.id}/regenerate-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': (document.querySelector('meta[name=csrf-token]') as any)?.content },
                body: JSON.stringify({ tone }),
            });
            const data = await res.json();
            if (data.draft) setEmailDraft(data.draft);
        } finally {
            setRegenLoading(false);
        }
    }

    async function markInitialSent() {
        setSendingInitial(true);
        try {
            const res = await fetch(`/contacts/${contact.id}/mark-initial-sent`, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': (document.querySelector('meta[name=csrf-token]') as any)?.content },
            });
            const data = await res.json();
            if (data.success) setContact(c => ({ ...c, status: data.status }));
        } finally {
            setSendingInitial(false);
        }
    }

    async function sendFollowUp(followUp: FollowUp) {
        setSendingId(followUp.id);
        try {
            const res = await fetch(`/contacts/${contact.id}/follow-ups/${followUp.id}/send`, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': (document.querySelector('meta[name=csrf-token]') as any)?.content },
            });
            const data = await res.json();
            if (data.success) {
                setContact(c => ({
                    ...c,
                    status: data.status,
                    follow_ups: c.follow_ups.map(f => f.id === followUp.id ? { ...f, status: 'sent' as const } : f),
                }));
            }
        } finally {
            setSendingId(null);
        }
    }

    async function convertToLead() {
        setConverting(true);
        try {
            const res = await fetch(`/contacts/${contact.id}/convert-to-lead`, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': (document.querySelector('meta[name=csrf-token]') as any)?.content },
            });
            const data = await res.json();
            if (data.lead_url) router.visit(data.lead_url);
        } finally {
            setConverting(false);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={contact.name} />
            <div className="max-w-4xl mx-auto p-6 space-y-6">

                {/* Header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-700">
                            {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{contact.name}</h1>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {contact.role && <span className="text-sm text-gray-600">{contact.role}</span>}
                                {contact.company && <span className="text-sm text-gray-500">{contact.role ? `@ ${contact.company}` : contact.company}</span>}
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {!contact.lead && contact.status !== 'dropped' && (
                            <Button onClick={convertToLead} disabled={converting} variant="outline" size="sm" className="gap-1.5">
                                <TrendingUp className="h-3.5 w-3.5" />
                                {converting ? 'Converting…' : 'Convert to Lead'}
                            </Button>
                        )}
                        {contact.lead && (
                            <Button asChild variant="outline" size="sm" className="gap-1.5">
                                <Link href={`/leads/${contact.lead.id}`}><ArrowRight className="h-3.5 w-3.5" />View Lead</Link>
                            </Button>
                        )}
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/contacts/${contact.id}/edit`}>Edit</Link>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left: contact info + AI context */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Contact Info</CardTitle></CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                {contact.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-gray-400" /><a href={`mailto:${contact.email}`} className="text-indigo-600 hover:underline">{contact.email}</a></div>}
                                {contact.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-gray-400" />{contact.phone}</div>}
                                {contact.company && <div className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-gray-400" />{contact.company}</div>}
                                {contact.event_name && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-gray-400" />{contact.event_name}{contact.event_location ? `, ${contact.event_location}` : ''}</div>}
                                {contact.met_at && <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-gray-400" />Met {formatDate(contact.met_at)}</div>}
                                {contact.last_contact_at && <div className="text-xs text-gray-400 pt-1">Last contact: {formatDate(contact.last_contact_at)}</div>}
                                {contact.next_follow_up_at && contact.status !== 'converted' && (
                                    <div className="text-xs text-amber-600 font-medium">Next follow-up: {formatDate(contact.next_follow_up_at)}</div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Key topics */}
                        {contact.key_topics && contact.key_topics.length > 0 && (
                            <Card>
                                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" />Key Topics</CardTitle></CardHeader>
                                <CardContent className="flex gap-1.5 flex-wrap">
                                    {contact.key_topics.map(t => <span key={t} className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-1 rounded-full">{t}</span>)}
                                </CardContent>
                            </Card>
                        )}

                        {/* AI context summary */}
                        {contact.ai_context_summary && (
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Sparkles className="h-3.5 w-3.5 text-indigo-500" />AI Insights
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    {contact.ai_context_summary.summary && <p className="text-gray-700">{contact.ai_context_summary.summary}</p>}
                                    {(contact.ai_context_summary.pain_points ?? []).length > 0 && (
                                        <div>
                                            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Pain Points</p>
                                            <ul className="space-y-0.5">{(contact.ai_context_summary.pain_points ?? []).map((p, i) => <li key={i} className="text-gray-600 text-xs flex gap-1.5"><span className="text-red-400 mt-0.5">•</span>{p}</li>)}</ul>
                                        </div>
                                    )}
                                    {(contact.ai_context_summary.opportunities ?? []).length > 0 && (
                                        <div>
                                            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Opportunities</p>
                                            <ul className="space-y-0.5">{(contact.ai_context_summary.opportunities ?? []).map((o, i) => <li key={i} className="text-gray-600 text-xs flex gap-1.5"><span className="text-emerald-500 mt-0.5">•</span>{o}</li>)}</ul>
                                        </div>
                                    )}
                                    {contact.ai_context_summary.next_step_suggestion && (
                                        <div className="bg-indigo-50 rounded-lg p-2.5">
                                            <p className="text-xs font-semibold text-indigo-700 mb-0.5">Suggested Next Step</p>
                                            <p className="text-xs text-indigo-600">{contact.ai_context_summary.next_step_suggestion}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right: email draft + follow-up trail */}
                    <div className="lg:col-span-2 space-y-5">

                        {/* Initial email draft */}
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-indigo-500" />Initial Outreach Email
                                    </CardTitle>
                                    {contact.status === 'new' || contact.status === 'email_sent' ? (
                                        <Badge variant="outline" className="text-xs">
                                            {contact.status === 'email_sent' ? 'Sent ✓' : 'Ready to send'}
                                        </Badge>
                                    ) : null}
                                </div>
                                <CardDescription>AI-drafted based on your meeting notes. Edit freely before sending.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Textarea
                                    value={emailDraft}
                                    onChange={e => setEmailDraft(e.target.value)}
                                    rows={7}
                                    className="font-mono text-sm"
                                    placeholder="AI email draft will appear here…"
                                />
                                <div className="flex items-center gap-2 flex-wrap justify-between">
                                    <div className="flex items-center gap-2">
                                        <Select value={tone} onValueChange={setTone}>
                                            <SelectTrigger className="w-36 h-8 text-xs">
                                                <SelectValue placeholder="Tone" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="professional">Professional</SelectItem>
                                                <SelectItem value="warm">Warm & Friendly</SelectItem>
                                                <SelectItem value="concise">Brief & Direct</SelectItem>
                                                <SelectItem value="formal">Formal</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button variant="outline" size="sm" onClick={regenerateEmail} disabled={regenLoading} className="gap-1.5 h-8 text-xs">
                                            <RotateCcw className={`h-3 w-3 ${regenLoading ? 'animate-spin' : ''}`} />
                                            Regenerate
                                        </Button>
                                    </div>
                                    <div className="flex gap-2">
                                        {contact.email && (
                                            <Button asChild size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                                                <a href={`mailto:${contact.email}?body=${encodeURIComponent(emailDraft)}`} target="_blank">
                                                    <Mail className="h-3 w-3" />Open in Mail
                                                </a>
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            onClick={markInitialSent}
                                            disabled={sendingInitial || contact.status === 'email_sent'}
                                            className="gap-1.5 h-8 text-xs"
                                        >
                                            <Send className="h-3 w-3" />
                                            {contact.status === 'email_sent' ? 'Sent ✓' : sendingInitial ? 'Marking…' : 'Mark as Sent'}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Follow-up trail */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-amber-500" />Follow-up Trail
                                </CardTitle>
                                <CardDescription>
                                    {contact.follow_ups.length} follow-up emails scheduled by AI • {contact.follow_up_count} sent so far
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {contact.follow_ups.length === 0 && (
                                    <p className="text-sm text-gray-400 text-center py-4">No follow-ups scheduled yet.</p>
                                )}
                                {contact.follow_ups.map((fu, i) => {
                                    const fCfg      = FOLLOW_UP_STATUS_CFG[fu.status] ?? FOLLOW_UP_STATUS_CFG.scheduled;
                                    const Icon      = fCfg.icon;
                                    const isExpanded = expandedFU === fu.id;
                                    const overdue   = fu.status === 'scheduled' && new Date(fu.scheduled_at) < new Date();

                                    return (
                                        <div key={fu.id} className={`border rounded-xl overflow-hidden ${overdue ? 'border-amber-300' : 'border-gray-200'}`}>
                                            <button
                                                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
                                                onClick={() => setExpandedFU(isExpanded ? null : fu.id)}
                                            >
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 2 ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {fu.sequence}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{fu.subject}</p>
                                                    <p className="text-xs text-gray-500">{formatDate(fu.scheduled_at)}{overdue ? ' — overdue' : ''}</p>
                                                </div>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${fCfg.color}`}>
                                                    <Icon className="h-3 w-3" />{fCfg.label}
                                                </span>
                                                {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-gray-400" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-400" />}
                                            </button>

                                            {isExpanded && (
                                                <div className="border-t border-gray-100 p-3 bg-gray-50/50 space-y-3">
                                                    <Textarea
                                                        defaultValue={fu.body}
                                                        rows={5}
                                                        className="text-sm font-mono bg-white"
                                                    />
                                                    <div className="flex gap-2 justify-end flex-wrap">
                                                        {contact.email && (
                                                            <Button asChild size="sm" variant="outline" className="gap-1.5 h-7 text-xs">
                                                                <a href={`mailto:${contact.email}?subject=${encodeURIComponent(fu.subject)}&body=${encodeURIComponent(fu.body)}`} target="_blank">
                                                                    <Mail className="h-3 w-3" />Open in Mail
                                                                </a>
                                                            </Button>
                                                        )}
                                                        {fu.status === 'scheduled' && (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => sendFollowUp(fu)}
                                                                disabled={sendingId === fu.id}
                                                                className="gap-1.5 h-7 text-xs"
                                                            >
                                                                <Send className="h-3 w-3" />
                                                                {sendingId === fu.id ? 'Marking…' : 'Mark as Sent'}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>

                        {/* Talking points */}
                        {contact.talking_points && (
                            <Card>
                                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Meeting Notes</CardTitle></CardHeader>
                                <CardContent><p className="text-sm text-gray-700 whitespace-pre-wrap">{contact.talking_points}</p></CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}