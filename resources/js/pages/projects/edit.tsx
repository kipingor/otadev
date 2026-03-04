import AppLayout from '@/layouts/app-layout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/input-error';
import { FolderOpen, Briefcase, Calendar, DollarSign, ArrowLeft, Save, Link2, Users, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Option = { id: number; name?: string; title?: string; email?: string };

const STATUS_META: Record<string, { label: string; dot: string }> = {
    planning:  { label: 'Planning',  dot: 'bg-slate-400' },
    active:    { label: 'Active',    dot: 'bg-green-500' },
    on_hold:   { label: 'On Hold',   dot: 'bg-amber-400' },
    completed: { label: 'Completed', dot: 'bg-blue-500'  },
    cancelled: { label: 'Cancelled', dot: 'bg-red-500'   },
};

export default function ProjectEdit() {
    const { project, opportunities = [], clients = [], owners = [], statusOptions = [], currencyOptions = [] } =
        usePage<{ project: any; opportunities: Option[]; clients: Option[]; owners: Option[]; statusOptions: string[]; currencyOptions: string[] }>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Projects', href: '/projects' },
        { title: project?.name ?? 'Project', href: `/projects/${project?.id}` },
        { title: 'Edit', href: `/projects/${project?.id}/edit` },
    ];

    const form = useForm({
        name: project?.name ?? '',
        description: project?.description ?? '',
        opportunity_id: (project?.opportunity_id ?? '') as number | '' | null,
        client_id: (project?.client_id ?? '') as number | '' | null,
        owner_id: (project?.owner_id ?? '') as number | '' | null,
        status: project?.status ?? statusOptions[0] ?? 'planning',
        start_date: project?.start_date ?? '',
        end_date: project?.end_date ?? '',
        budget: project?.budget ?? '',
        currency: project?.currency ?? currencyOptions[0] ?? 'USD',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.put(`/projects/${project.id}`);
    };

    const isDirty = form.isDirty;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${project?.name ?? 'Project'}`} />
            <div className="mx-auto max-w-3xl px-4 py-8">
                {/* Page header */}
                <div className="mb-8 flex items-center gap-4">
                    <Button variant="ghost" size="icon" type="button" onClick={() => history.back()}>
                        <ArrowLeft className="size-4" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <FolderOpen className="size-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                Edit Project
                            </h1>
                            <p className="text-sm text-muted-foreground">{project?.name}</p>
                        </div>
                    </div>
                </div>

                {/* Unsaved changes warning */}
                {isDirty && (
                    <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-800">
                        <AlertCircle className="size-4" />
                        <AlertDescription>You have unsaved changes.</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Briefcase className="size-4 text-muted-foreground" /> Basic Information
                            </CardTitle>
                            <CardDescription>Update project name, description and status</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Project Name <span className="text-destructive">*</span></Label>
                                <Input id="name" value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)} required autoFocus />
                                <InputError message={form.errors.name} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" rows={4} value={form.data.description ?? ''}
                                    onChange={(e) => form.setData('description', e.target.value)} className="resize-none" />
                                <InputError message={form.errors.description} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={form.data.status} onValueChange={(v) => form.setData('status', v)}>
                                    <SelectTrigger id="status"><SelectValue placeholder="Select status" /></SelectTrigger>
                                    <SelectContent>
                                        {statusOptions.map((s) => {
                                            const meta = STATUS_META[s] ?? { label: s.replace(/_/g, ' '), dot: 'bg-gray-400' };
                                            return (
                                                <SelectItem key={s} value={s}>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`size-2 rounded-full ${meta.dot}`} />
                                                        {meta.label}
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.status} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Linked Records */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Link2 className="size-4 text-muted-foreground" /> Linked Records
                            </CardTitle>
                            <CardDescription>Opportunity, client and project owner assignments</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Opportunity</Label>
                                <Select value={String(form.data.opportunity_id ?? '')}
                                    onValueChange={(v) => form.setData('opportunity_id', v ? Number(v) : null)}>
                                    <SelectTrigger><SelectValue placeholder="No linked opportunity" /></SelectTrigger>
                                    <SelectContent>
                                        {opportunities.map((o) => (
                                            <SelectItem key={o.id} value={String(o.id)}>{o.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.opportunity_id} />
                            </div>
                            <div className="space-y-2">
                                <Label>Client</Label>
                                <Select value={String(form.data.client_id ?? '')}
                                    onValueChange={(v) => form.setData('client_id', v ? Number(v) : null)}>
                                    <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                                    <SelectContent>
                                        {clients.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.client_id} />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label><Users className="mr-1 inline size-3.5" /> Project Owner</Label>
                                <Select value={String(form.data.owner_id ?? '')}
                                    onValueChange={(v) => form.setData('owner_id', v ? Number(v) : null)}>
                                    <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                                    <SelectContent>
                                        {owners.map((o) => (
                                            <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.owner_id} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timeline & Budget */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Calendar className="size-4 text-muted-foreground" /> Timeline &amp; Budget
                            </CardTitle>
                            <CardDescription>Project dates and financial targets</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="start_date">Start Date</Label>
                                <Input id="start_date" type="date" value={form.data.start_date ?? ''}
                                    onChange={(e) => form.setData('start_date', e.target.value)} />
                                <InputError message={form.errors.start_date} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_date">End Date</Label>
                                <Input id="end_date" type="date" value={form.data.end_date ?? ''}
                                    min={form.data.start_date || undefined}
                                    onChange={(e) => form.setData('end_date', e.target.value)} />
                                <InputError message={form.errors.end_date} />
                            </div>
                            <div className="space-y-2">
                                <Label><DollarSign className="mr-1 inline size-3.5" /> Budget</Label>
                                <div className="flex gap-2">
                                    <Select value={form.data.currency} onValueChange={(v) => form.setData('currency', v)}>
                                        <SelectTrigger className="w-24 shrink-0"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {currencyOptions.map((c) => (
                                                <SelectItem key={c} value={c}>{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Input type="number" step="0.01" min="0" placeholder="0.00"
                                        value={form.data.budget ?? ''}
                                        onChange={(e) => form.setData('budget', e.target.value)} />
                                </div>
                                <InputError message={form.errors.budget ?? form.errors.currency} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-6 py-4">
                        <Button type="button" variant="ghost" onClick={() => history.back()}>Discard Changes</Button>
                        <Button type="submit" disabled={form.processing} className="gap-2">
                            <Save className="size-4" />
                            {form.processing ? 'Saving…' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}