import AppLayout from '@/layouts/app-layout';
import InputError from '@/components/input-error';
import { Head, useForm, usePage } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';

type Option = { id: number; name?: string; title?: string };

export default function ProjectEdit() {
    const { project, opportunities = [], clients = [], owners = [], statusOptions = [], currencyOptions = [] } =
        usePage<{
            project: any;
            opportunities: Option[];
            clients: Option[];
            owners: Option[];
            statusOptions: string[];
            currencyOptions: string[];
        }>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Projects', href: '/projects' },
        { title: project?.name ?? 'Project', href: `/projects/${project?.id}` },
        { title: 'Edit', href: `/projects/${project?.id}/edit` },
    ];

    const form: any = useForm({
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

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        form.put(`/projects/${project.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${project?.name ?? 'Project'}`} />

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-2">
                    <label className="font-medium">Name</label>
                    <input
                        className="input"
                        value={form.data.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => (form as any).setData('name', e.currentTarget.value)}
                        required
                    />
                    <InputError message={form.errors.name} />
                </div>

                <div className="grid gap-2">
                    <label className="font-medium">Description</label>
                    <textarea
                        className="textarea"
                        rows={4}
                        value={form.data.description ?? ''}
                        onChange={(e) => (form as any).setData('description', (e.target as HTMLTextAreaElement).value)}
                    />
                    <InputError message={form.errors.description} />
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                    <div className="grid gap-2">
                        <label className="font-medium">Opportunity</label>
                        <select
                            className="input"
                            value={form.data.opportunity_id ?? ''}
                            onChange={(e) =>
                                (form as any).setData('opportunity_id', (e.target as HTMLSelectElement).value ? Number((e.target as HTMLSelectElement).value) : null)
                            }
                        >
                            <option value="">No linked opportunity</option>
                            {opportunities.map((opportunity) => (
                                <option key={opportunity.id} value={opportunity.id}>
                                    {opportunity.title}
                                </option>
                            ))}
                        </select>
                        <InputError message={form.errors.opportunity_id} />
                    </div>

                    <div className="grid gap-2">
                        <label className="font-medium">Client</label>
                        <select
                            className="input"
                            value={form.data.client_id ?? ''}
                            onChange={(e) => (form as any).setData('client_id', (e.target as HTMLSelectElement).value ? Number((e.target as HTMLSelectElement).value) : null)}
                        >
                            <option value="">Unassigned</option>
                            {clients.map((client) => (
                                <option key={client.id} value={client.id}>
                                    {client.name}
                                </option>
                            ))}
                        </select>
                        <InputError message={form.errors.client_id} />
                    </div>
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                    <div className="grid gap-2">
                        <label className="font-medium">Owner</label>
                        <select
                            className="input"
                            value={form.data.owner_id ?? ''}
                            onChange={(e) => (form as any).setData('owner_id', (e.target as HTMLSelectElement).value ? Number((e.target as HTMLSelectElement).value) : null)}
                        >
                            <option value="">Unassigned</option>
                            {owners.map((owner) => (
                                <option key={owner.id} value={owner.id}>
                                    {owner.name}
                                </option>
                            ))}
                        </select>
                        <InputError message={form.errors.owner_id} />
                    </div>

                    <div className="grid gap-2">
                        <label className="font-medium">Status</label>
                        <select
                            className="input"
                            value={form.data.status}
                            onChange={(e) => (form as any).setData('status', (e.target as HTMLSelectElement).value)}
                        >
                            {statusOptions.map((status) => (
                                <option key={status} value={status}>
                                    {status.replace('_', ' ')}
                                </option>
                            ))}
                        </select>
                        <InputError message={form.errors.status} />
                    </div>
                </div>

                <div className="grid gap-2 md:grid-cols-3">
                    <div className="grid gap-2">
                        <label className="font-medium">Start date</label>
                        <input
                            type="date"
                            className="input"
                            value={form.data.start_date ?? ''}
                            onChange={(e) => (form as any).setData('start_date', (e.target as HTMLInputElement).value)}
                        />
                        <InputError message={form.errors.start_date} />
                    </div>

                    <div className="grid gap-2">
                        <label className="font-medium">End date</label>
                        <input
                            type="date"
                            className="input"
                            value={form.data.end_date ?? ''}
                            onChange={(e) => (form as any).setData('end_date', (e.target as HTMLInputElement).value)}
                        />
                        <InputError message={form.errors.end_date} />
                    </div>

                    <div className="grid gap-2">
                        <label className="font-medium">Budget</label>
                        <div className="flex gap-2">
                            <select
                                className="input w-28"
                                value={form.data.currency}
                                onChange={(e) => (form as any).setData('currency', (e.target as HTMLSelectElement).value)}
                            >
                                {currencyOptions.map((currency) => (
                                    <option key={currency} value={currency}>
                                        {currency}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                step="0.01"
                                className="input flex-1"
                                value={form.data.budget ?? ''}
                                onChange={(e) => (form as any).setData('budget', (e.target as HTMLInputElement).value)}
                            />
                        </div>
                        <InputError message={form.errors.budget ?? form.errors.currency} />
                    </div>
                </div>

                <div>
                    <button type="submit" className="btn-primary" disabled={form.processing}>
                        {form.processing ? 'Saving...' : 'Save changes'}
                    </button>
                </div>
            </form>
        </AppLayout>
    );
}

