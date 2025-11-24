import AppLayout from '@/layouts/app-layout';
import InputError from '@/components/input-error';
import { Head, useForm, usePage } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';

type Option = { id: number; title?: string; name?: string };
type OpportunityFormData = {
    title: string;
    summary: string;
    lead_id: number | '' | null;
    estimated_value: string | number;
    currency: string;
    stage: string;
    owner_id: number | '' | null;
    expected_close_date: string;
};

export default function OpportunityEdit() {
    const { opportunity, leads = [], owners = [], stageOptions = [], currencyOptions = [] } = usePage<{
        opportunity: any;
        leads: Option[];
        owners: Option[];
        stageOptions: string[];
        currencyOptions: string[];
    }>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Opportunities', href: '/opportunities' },
        { title: opportunity?.title ?? 'Opportunity', href: `/opportunities/${opportunity?.id}` },
        { title: 'Edit', href: `/opportunities/${opportunity?.id}/edit` },
    ];

    const form = useForm<OpportunityFormData>({
        title: opportunity?.title ?? '',
        summary: opportunity?.summary ?? '',
        lead_id: (opportunity?.lead_id ?? '') as number | '' | null,
        estimated_value: opportunity?.estimated_value ?? '',
        currency: opportunity?.currency ?? currencyOptions[0] ?? 'USD',
        stage: opportunity?.stage ?? stageOptions[0] ?? 'prospect',
        owner_id: (opportunity?.owner_id ?? '') as number | '' | null,
        expected_close_date: opportunity?.expected_close_date ?? '',
    });

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        form.put(`/opportunities/${opportunity.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${opportunity?.title ?? 'Opportunity'}`} />

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
                            <option value="">Unassigned</option>
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
                        {form.processing ? 'Saving...' : 'Save changes'}
                    </button>
                </div>
            </form>
        </AppLayout>
    );
}

