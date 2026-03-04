import AppLayout from '@/layouts/app-layout';
import InputError from '@/components/input-error';
import { Head, useForm, usePage } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';

type Option = { id: number; title?: string; name?: string };

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Opportunities', href: '/opportunities' },
    { title: 'Create', href: '/opportunities/create' },
];

export default function OpportunityCreate() {
    const { leads = [], owners = [], stageOptions = [], currencyOptions = [] } = usePage<{
        leads: Option[];
        owners: Option[];
        stageOptions: string[];
        currencyOptions: string[];
    }>().props;

    const form = useForm({
        title: '',
        summary: '',
        lead_id: '' as number | '' | null,
        estimated_value: '',
        currency: currencyOptions[0] ?? 'USD',
        stage: stageOptions[0] ?? 'qualification',
        owner_id: '' as number | '' | null,
        expected_close_date: '',
    });

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        form.post('/opportunities');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create opportunity" />

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-2">
                    <label className="font-medium">Title</label>
                    <input
                        className="input"
                        value={form.data.title}
                        onChange={(e) => form.setData('title', e.target.value)}
                        required
                    />
                    <InputError message={form.errors.title} />
                </div>

                <div className="grid gap-2">
                    <label className="font-medium">Summary</label>
                    <textarea
                        className="textarea"
                        rows={4}
                        value={form.data.summary ?? ''}
                        onChange={(e) => form.setData('summary', e.target.value)}
                    />
                    <InputError message={form.errors.summary} />
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                    <div className="grid gap-2">
                        <label className="font-medium">Lead</label>
                        <select
                            className="input"
                            value={form.data.lead_id ?? ''}
                            onChange={(e) => form.setData('lead_id', e.target.value ? Number(e.target.value) : null)}
                        >
                            <option value="">No linked lead</option>
                            {leads.map((lead) => (
                                <option key={lead.id} value={lead.id}>
                                    {lead.title}
                                </option>
                            ))}
                        </select>
                        <InputError message={form.errors.lead_id} />
                    </div>

                    <div className="grid gap-2">
                        <label className="font-medium">Owner</label>
                        <select
                            className="input"
                            value={form.data.owner_id ?? ''}
                            onChange={(e) => form.setData('owner_id', e.target.value ? Number(e.target.value) : null)}
                        >
                            <option value="">Assign to me</option>
                            {owners.map((owner) => (
                                <option key={owner.id} value={owner.id}>
                                    {owner.name}
                                </option>
                            ))}
                        </select>
                        <InputError message={form.errors.owner_id} />
                    </div>
                </div>

                <div className="grid gap-2 md:grid-cols-3">
                    <div className="grid gap-2">
                        <label className="font-medium">Stage</label>
                        <select
                            className="input"
                            value={form.data.stage}
                            onChange={(e) => form.setData('stage', e.target.value)}
                        >
                            {stageOptions.map((stage) => (
                                <option key={stage} value={stage}>
                                    {stage}
                                </option>
                            ))}
                        </select>
                        <InputError message={form.errors.stage} />
                    </div>

                    <div className="grid gap-2">
                        <label className="font-medium">Expected close date</label>
                        <input
                            type="date"
                            className="input"
                            value={form.data.expected_close_date ?? ''}
                            onChange={(e) => form.setData('expected_close_date', e.target.value)}
                        />
                        <InputError message={form.errors.expected_close_date} />
                    </div>

                    <div className="grid gap-2">
                        <label className="font-medium">Estimated value</label>
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
                                value={form.data.estimated_value ?? ''}
                                onChange={(e) => form.setData('estimated_value', e.target.value)}
                            />
                        </div>
                        <InputError message={form.errors.estimated_value ?? form.errors.currency} />
                    </div>
                </div>

                <div>
                    <button type="submit" className="btn-primary" disabled={form.processing}>
                        {form.processing ? 'Saving...' : 'Create opportunity'}
                    </button>
                </div>
            </form>
        </AppLayout>
    );
}

