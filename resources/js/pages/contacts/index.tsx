import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    UserPlus, Search, Building2, Mail, Calendar,
    ArrowRight, CheckCircle2, Clock, Users, Bell,
    TrendingUp, Sparkles
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Contacts', href: '/contacts' }];

const STATUS: Record<string, { label: string; bg: string; text: string }> = {
    new:          { label: 'New',          bg: 'bg-slate-100',   text: 'text-slate-700' },
    email_sent:   { label: 'Email Sent',   bg: 'bg-blue-100',    text: 'text-blue-700' },
    following_up: { label: 'Following Up', bg: 'bg-amber-100',   text: 'text-amber-700' },
    responded:    { label: 'Responded',    bg: 'bg-emerald-100', text: 'text-emerald-700' },
    converted:    { label: 'Converted',    bg: 'bg-purple-100',  text: 'text-purple-700' },
    dropped:      { label: 'Dropped',      bg: 'bg-red-100',     text: 'text-red-600' },
};

interface Contact {
    id: number; name: string; email?: string; phone?: string;
    company?: string; role?: string; event_name?: string; met_at?: string;
    status: string; follow_up_count: number; next_follow_up_at?: string;
    key_topics?: string[];
    lead?: { id: number; title: string } | null;
}

interface Props {
    contacts: { data: Contact[]; meta: any };
    counts: { total: number; new: number; in_progress: number; responded: number; converted: number; due_today: number };
}

export default function ContactsIndex({ contacts, counts }: Props) {
    const [search, setSearch] = useState('');
    const [activeStatus, setActiveStatus] = useState('');

    function filterByStatus(status: string) {
        const next = activeStatus === status ? '' : status;
        setActiveStatus(next);
        router.get('/contacts', { status: next, search }, { preserveState: true, replace: true });
    }

    function onSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get('/contacts', { status: activeStatus, search }, { preserveState: true, replace: true });
    }

    function isOverdue(c: Contact) {
        if (!c.next_follow_up_at) return false;
        return new Date(c.next_follow_up_at) < new Date() && !['converted', 'dropped'].includes(c.status);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Networking Contacts" />
            <div className="space-y-6 p-6">

                {/* Header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Networking Contacts</h1>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                            AI drafts personalised emails and schedules your follow-up trail
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/contacts/create"><UserPlus className="h-4 w-4 mr-2" />Add Contact</Link>
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {[
                        { label: 'Total',       value: counts.total,       icon: Users,       status: '',           urgent: false },
                        { label: 'New',         value: counts.new,         icon: UserPlus,    status: 'new',        urgent: false },
                        { label: 'In Progress', value: counts.in_progress, icon: Clock,       status: 'email_sent', urgent: false },
                        { label: 'Responded',   value: counts.responded,   icon: CheckCircle2,status: 'responded',  urgent: false },
                        { label: 'Converted',   value: counts.converted,   icon: TrendingUp,  status: 'converted',  urgent: false },
                        { label: 'Due Today',   value: counts.due_today,   icon: Bell,        status: '',           urgent: true },
                    ].map(({ label, value, icon: Icon, status, urgent }) => (
                        <button
                            key={label}
                            onClick={() => status && filterByStatus(status)}
                            className={`text-left p-3 rounded-xl border transition-all ${
                                activeStatus === status && status
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : urgent && value > 0
                                        ? 'border-amber-400 bg-amber-50'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                        >
                            <Icon className={`h-4 w-4 mb-1 ${urgent && value > 0 ? 'text-amber-600' : 'text-gray-400'}`} />
                            <div className={`text-xl font-bold ${urgent && value > 0 ? 'text-amber-700' : 'text-gray-900'}`}>{value}</div>
                            <div className="text-xs text-gray-500 leading-tight">{label}</div>
                        </button>
                    ))}
                </div>

                {/* Search + status filter */}
                <div className="flex gap-3 flex-wrap items-center">
                    <form onSubmit={onSearch} className="flex gap-2">
                        <Input placeholder="Search name, company, email…" value={search} onChange={e => setSearch(e.target.value)} className="w-60" />
                        <Button type="submit" variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
                    </form>
                    <div className="flex gap-1.5 flex-wrap">
                        {Object.entries(STATUS).map(([key, { label }]) => (
                            <button
                                key={key}
                                onClick={() => filterByStatus(key)}
                                className={`px-3 py-1 text-xs rounded-full border transition-all ${
                                    activeStatus === key
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'border-gray-300 text-gray-600 hover:border-gray-400'
                                }`}
                            >{label}</button>
                        ))}
                    </div>
                </div>

                {/* List */}
                {contacts.data.length === 0 ? (
                    <div className="text-center py-20 border border-dashed rounded-xl">
                        <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="font-medium text-gray-500">No contacts yet</p>
                        <p className="text-sm text-gray-400 mt-1">Add your first networking contact and let AI handle the follow-up</p>
                        <Button asChild className="mt-5"><Link href="/contacts/create"><UserPlus className="h-4 w-4 mr-2" />Add Contact</Link></Button>
                    </div>
                ) : (
                    <div className="grid gap-2">
                        {contacts.data.map(contact => {
                            const cfg     = STATUS[contact.status] ?? STATUS.new;
                            const overdue = isOverdue(contact);
                            return (
                                <Link key={contact.id} href={`/contacts/${contact.id}`}>
                                    <div className={`bg-white border rounded-xl px-4 py-3 hover:shadow-md transition-all flex items-center gap-4 ${overdue ? 'border-l-4 border-l-amber-400 border-r border-t border-b border-gray-200' : 'border-gray-200'}`}>
                                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-indigo-700">
                                            {contact.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-gray-900">{contact.name}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                                                {overdue && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Follow-up overdue</span>}
                                                {contact.lead && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">→ Lead</span>}
                                            </div>
                                            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 flex-wrap">
                                                {contact.company && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{contact.company}{contact.role ? ` · ${contact.role}` : ''}</span>}
                                                {contact.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{contact.email}</span>}
                                            </div>
                                            {contact.key_topics && contact.key_topics.length > 0 && (
                                                <div className="flex gap-1 mt-1 flex-wrap">
                                                    {contact.key_topics.slice(0, 3).map(t => (
                                                        <span key={t} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{t}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right text-xs text-gray-400 hidden sm:block flex-shrink-0 space-y-0.5">
                                            {contact.event_name && <div>{contact.event_name}</div>}
                                            {contact.met_at && <div className="flex items-center gap-1 justify-end"><Calendar className="h-3 w-3" />{contact.met_at}</div>}
                                            {contact.follow_up_count > 0 && <div>{contact.follow_up_count} email{contact.follow_up_count !== 1 ? 's' : ''} sent</div>}
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