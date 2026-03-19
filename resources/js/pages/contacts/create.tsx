import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, User, Building2, MapPin, MessageSquare } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Contacts', href: '/contacts' },
    { title: 'Add Contact', href: '/contacts/create' },
];

const SOURCES = [
    { value: 'networking_event', label: 'Networking Event' },
    { value: 'conference',       label: 'Conference / Summit' },
    { value: 'referral',         label: 'Referral' },
    { value: 'cold_outreach',    label: 'Cold Outreach' },
    { value: 'social_media',     label: 'Social Media' },
    { value: 'other',            label: 'Other' },
];

export default function ContactCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '', email: '', phone: '', company: '', role: '',
        event_name: '', event_location: '', met_at: '',
        source: 'networking_event',
        talking_points: '', notes: '',
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add Networking Contact" />
            <div className="max-w-2xl mx-auto p-6 space-y-6">

                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Add Networking Contact</h1>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-indigo-500" />
                        AI will draft a personalised outreach email and plan your 3-touch follow-up trail
                    </p>
                </div>

                <form onSubmit={e => { e.preventDefault(); post('/contacts'); }} className="space-y-5">

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" />Contact Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 sm:col-span-1">
                                <Label>Full Name *</Label>
                                <Input value={data.name} onChange={e => setData('name', e.target.value)} placeholder="Jane Smith" className={errors.name ? 'border-red-400' : ''} />
                                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <Label>Email</Label>
                                <Input type="email" value={data.email} onChange={e => setData('email', e.target.value)} placeholder="jane@company.com" />
                            </div>
                            <div>
                                <Label>Phone</Label>
                                <Input value={data.phone} onChange={e => setData('phone', e.target.value)} placeholder="+254 700 000 000" />
                            </div>
                            <div>
                                <Label>Role / Title</Label>
                                <Input value={data.role} onChange={e => setData('role', e.target.value)} placeholder="Head of Procurement" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" />Company</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Input value={data.company} onChange={e => setData('company', e.target.value)} placeholder="Acme Corporation" />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" />Where We Met</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Source</Label>
                                <Select value={data.source} onValueChange={v => setData('source', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{SOURCES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Date Met</Label>
                                <Input type="date" value={data.met_at} onChange={e => setData('met_at', e.target.value)} />
                            </div>
                            <div>
                                <Label>Event Name</Label>
                                <Input value={data.event_name} onChange={e => setData('event_name', e.target.value)} placeholder="Tech Summit 2026" />
                            </div>
                            <div>
                                <Label>Location</Label>
                                <Input value={data.event_location} onChange={e => setData('event_location', e.target.value)} placeholder="Nairobi, Kenya" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-indigo-200 bg-indigo-50/30">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-indigo-600" />Talking Points
                            </CardTitle>
                            <CardDescription>
                                The AI uses these notes to personalise your emails. The more detail, the better.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Key Discussion Points</Label>
                                <Textarea
                                    value={data.talking_points}
                                    onChange={e => setData('talking_points', e.target.value)}
                                    placeholder="e.g. They mentioned struggling with manual reporting processes. Currently evaluating software solutions for Q2. Budget is approved. Interested in our analytics module. Frustrated with their current vendor's slow support response times."
                                    rows={5}
                                    className="bg-white mt-1"
                                />
                                <p className="text-xs text-gray-400 mt-1">Include pain points, interests, goals, specific things they mentioned</p>
                            </div>
                            <div>
                                <Label>Private Notes <span className="text-gray-400 font-normal">(not used in emails)</span></Label>
                                <Textarea value={data.notes} onChange={e => setData('notes', e.target.value)} placeholder="Internal notes…" rows={2} className="bg-white mt-1" />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3 pt-1">
                        <Button type="button" variant="outline" onClick={() => history.back()}>Cancel</Button>
                        <Button type="submit" disabled={processing} className="gap-2 min-w-[220px]">
                            {processing
                                ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Generating follow-up plan…</>
                                : <><Sparkles className="h-4 w-4" />Save &amp; Generate Follow-up Plan</>
                            }
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}