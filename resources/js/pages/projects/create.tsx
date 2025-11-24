import AppLayout from '@/layouts/app-layout';
import InputError from '@/components/input-error';
import { Head, useForm, usePage } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';

type Option = { id: number; name?: string; title?: string };

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Projects', href: '/projects' },
    { title: 'Create', href: '/projects/create' },
];

export default function ProjectCreate() {
    const { opportunities = [], clients = [], owners = [], statusOptions = [], currencyOptions = [] } =
        usePage<{
            opportunities: Option[];
            clients: Option[];
            owners: Option[];
            statusOptions: string[];
            currencyOptions: string[];
        }>().props;

    const form = useForm({
        name: '',
        description: '',
        opportunity_id: '' as number | '' | null,
        client_id: '' as number | '' | null,
        owner_id: '' as number | '' | null,
        status: statusOptions[0] ?? 'planning',
        start_date: '',
        end_date: '',
        budget: '',
        currency: currencyOptions[0] ?? 'USD',
    });

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        form.post('/projects');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Project" />

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-2">
                    <label className="font-medium">Name</label>
                    <input
                        className="input"
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
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
                        onChange={(e) => form.setData('description', e.target.value)}
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
                                form.setData('opportunity_id', e.target.value ? Number(e.target.value) : null)
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
                            onChange={(e) => form.setData('client_id', e.target.value ? Number(e.target.value) : null)}
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
                            onChange={(e) => form.setData('owner_id', e.target.value ? Number(e.target.value) : null)}
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
                            onChange={(e) => form.setData('status', e.target.value)}
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
                            onChange={(e) => form.setData('start_date', e.target.value)}
                        />
                        <InputError message={form.errors.start_date} />
                    </div>

                    <div className="grid gap-2">
                        <label className="font-medium">End date</label>
                        <input
                            type="date"
                            className="input"
                            value={form.data.end_date ?? ''}
                            onChange={(e) => form.setData('end_date', e.target.value)}
                        />
                        <InputError message={form.errors.end_date} />
                    </div>

                    <div className="grid gap-2">
                        <label className="font-medium">Budget</label>
                        <div className="flex gap-2">
                            <select
                                className="input w-28"
                                value={form.data.currency}
                                onChange={(e) => form.setData('currency', e.target.value)}
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
                                onChange={(e) => form.setData('budget', e.target.value)}
                            />
                        </div>
                        <InputError message={form.errors.budget ?? form.errors.currency} />
                    </div>
                </div>

                <div>
                    <button type="submit" className="btn-primary" disabled={form.processing}>
                        {form.processing ? 'Saving...' : 'Create Project'}
                    </button>
                </div>
            </form>
        </AppLayout>
    );
}

