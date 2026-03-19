import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import { Plus, Check, Trash2, Bell, AlertTriangle, Clock, Calendar } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Accounting', href: '/accounting' },
    { title: 'Follow-ups', href: '/follow-ups' },
];
const TYPE_COLORS: Record<string, string> = {
    call: 'bg-blue-100 text-blue-700', email: 'bg-purple-100 text-purple-700',
    meeting: 'bg-green-100 text-green-700', check_in: 'bg-gray-100 text-gray-700',
    invoice_reminder: 'bg-amber-100 text-amber-700', report: 'bg-teal-100 text-teal-700',
};
const PRIORITY_COLORS: Record<string, string> = { low: 'text-gray-500', normal: 'text-blue-500', high: 'text-red-500' };
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const isOverdue = (f: any) => !f.completed_at && f.scheduled_at && new Date(f.scheduled_at) < new Date();

interface Props {
    followUps: { data: any[]; current_page: number; last_page: number; total: number };
    counts: { pending: number; overdue: number; today: number; completed: number };
    clients: { id: number; name: string; email: string }[];
    projects: { id: number; name: string }[];
}

export default function FollowUps({ followUps, counts, clients, projects }: Props) {
    const [newOpen, setNewOpen] = useState(false);
    const [form, setForm] = useState({ client_id: '', project_id: '', type: 'call', subject: '', notes: '', scheduled_at: '', priority: 'normal' });
    const [completeModal, setCompleteModal] = useState<{ id: number; outcome: string; notes: string } | null>(null);
    const [filterStatus, setFilterStatus] = useState('pending');

    function createFollowUp() {
        router.post('/follow-ups', form, {
            onSuccess: () => { setNewOpen(false); setForm({ client_id: '', project_id: '', type: 'call', subject: '', notes: '', scheduled_at: '', priority: 'normal' }); },
            preserveScroll: true,
        });
    }

    function completeFollowUp() {
        if (!completeModal) return;
        router.post(`/follow-ups/${completeModal.id}/complete`, { outcome: completeModal.outcome, notes: completeModal.notes }, {
            onSuccess: () => setCompleteModal(null),
            preserveScroll: true,
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Client Follow-ups" />
            <div className="p-6 space-y-6 max-w-5xl mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Client Follow-ups</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Track calls, emails, meetings &amp; reminders</p>
                    </div>
                    <Button onClick={() => setNewOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Schedule Follow-up</Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        { label: 'Pending', value: counts.pending, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Overdue', value: counts.overdue, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
                        { label: 'Today', value: counts.today, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Completed', value: counts.completed, icon: Check, color: 'text-green-600', bg: 'bg-green-50' },
                    ].map(c => (
                        <Card key={c.label} className="p-4 flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${c.bg}`}><c.icon className={`h-4 w-4 ${c.color}`} /></div>
                            <div><p className="text-xs text-muted-foreground">{c.label}</p><p className="text-xl font-bold">{c.value}</p></div>
                        </Card>
                    ))}
                </div>

                {/* New Follow-up Form */}
                {newOpen && (
                    <Card className="p-5 border-blue-200 bg-blue-50/20">
                        <h3 className="font-semibold mb-4">New Follow-up</h3>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                            <div>
                                <label className="text-xs font-medium mb-1 block">Client *</label>
                                <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                                    value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
                                    <option value="">Select client…</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium mb-1 block">Type *</label>
                                <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                                    value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                                    {[['call', 'Phone Call'], ['email', 'Email'], ['meeting', 'Meeting'], ['check_in', 'Check-in'], ['invoice_reminder', 'Invoice Reminder'], ['report', 'Send Report']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium mb-1 block">Priority</label>
                                <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                                    value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                                    {['low', 'normal', 'high'].map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
                                </select>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="text-xs font-medium mb-1 block">Subject *</label>
                                <Input placeholder="e.g. Follow up on invoice INV-2025-0012" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                            </div>
                            <div>
                                <label className="text-xs font-medium mb-1 block">Scheduled Date</label>
                                <Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} />
                            </div>
                            <div className="sm:col-span-3">
                                <label className="text-xs font-medium mb-1 block">Notes</label>
                                <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={2}
                                    value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={createFollowUp} disabled={!form.client_id || !form.subject}>Save</Button>
                            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
                        </div>
                    </Card>
                )}

                {/* Complete Modal */}
                {completeModal && (
                    <Card className="p-5 border-green-200 bg-green-50/20">
                        <h3 className="font-semibold mb-3">Mark as Complete</h3>
                        <div className="grid sm:grid-cols-2 gap-3 mb-3">
                            <div>
                                <label className="text-xs font-medium mb-1 block">Outcome</label>
                                <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                                    value={completeModal.outcome} onChange={e => setCompleteModal(m => m ? { ...m, outcome: e.target.value } : null)}>
                                    <option value="">Select outcome…</option>
                                    {[['interested', 'Interested'], ['no_response', 'No Response'], ['callback', 'Callback Requested'], ['resolved', 'Resolved'], ['paid', 'Invoice Paid'], ['other', 'Other']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium mb-1 block">Notes</label>
                                <Input placeholder="What happened?" value={completeModal.notes} onChange={e => setCompleteModal(m => m ? { ...m, notes: e.target.value } : null)} />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={completeFollowUp}><Check className="h-4 w-4 mr-1.5" />Mark Complete</Button>
                            <Button variant="outline" onClick={() => setCompleteModal(null)}>Cancel</Button>
                        </div>
                    </Card>
                )}

                {/* Filter Tabs */}
                <div className="flex gap-1 border-b">
                    {[['pending', 'Pending'], ['overdue', 'Overdue'], ['completed', 'Completed'], ['', 'All']].map(([v, l]) => (
                        <button key={v} onClick={() => { setFilterStatus(v); router.get('/follow-ups', v ? { status: v } : {}, { preserveScroll: true }); }}
                            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${filterStatus === v ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                            {l}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="space-y-2">
                    {followUps.data.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                            <p>No follow-ups found.</p>
                            <Button variant="outline" size="sm" className="mt-3" onClick={() => setNewOpen(true)}>Schedule one</Button>
                        </div>
                    ) : followUps.data.map((f: any) => (
                        <Card key={f.id} className={`p-4 ${isOverdue(f) ? 'border-red-200 bg-red-50/20' : ''} ${f.completed_at ? 'opacity-60' : ''}`}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <div className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${f.completed_at ? 'bg-green-500' : isOverdue(f) ? 'bg-red-500' : 'bg-amber-400'}`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-medium text-sm">{f.subject}</p>
                                            <Badge className={`text-xs capitalize ${TYPE_COLORS[f.type] ?? 'bg-gray-100 text-gray-700'}`}>{f.type.replace('_', ' ')}</Badge>
                                            <span className={`text-xs font-medium ${PRIORITY_COLORS[f.priority]}`}>{f.priority !== 'normal' ? f.priority : ''}</span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                                            <span>{f.client?.name}</span>
                                            {f.project && <span>· {f.project.name}</span>}
                                            {f.scheduled_at && <span>· {fmtDate(f.scheduled_at)}</span>}
                                            {f.completed_at && <span className="text-green-600">· Completed {fmtDate(f.completed_at)}</span>}
                                            {f.outcome && <span className="italic">· {f.outcome.replace('_', ' ')}</span>}
                                        </div>
                                        {f.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{f.notes}</p>}
                                    </div>
                                </div>
                                {!f.completed_at && (
                                    <div className="flex gap-1 flex-shrink-0">
                                        <Button variant="ghost" size="sm" className="h-7 px-2 text-green-600 hover:text-green-700 text-xs"
                                            onClick={() => setCompleteModal({ id: f.id, outcome: '', notes: '' })}>
                                            <Check className="h-3.5 w-3.5 mr-1" />Done
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                                            onClick={() => { if (confirm('Delete follow-up?')) router.delete(`/follow-ups/${f.id}`, { preserveScroll: true }); }}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}