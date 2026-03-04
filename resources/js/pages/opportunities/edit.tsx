import AppLayout from '@/layouts/app-layout';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head, usePage, router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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

const formSchema = z.object({
    title: z.string().min(2, {
        message: 'title must be at least 2 characters.',
    }),
    summary: z.string().optional(),
    lead_id: z.union([z.number(), z.string().length(0), z.null()]).optional(),
    estimated_value: z.string().optional(),
    currency: z.string().min(1, {
        message: 'currency is required.',
    }),
    stage: z.string().min(1, {
        message: 'stage is required.',
    }),
    owner_id: z.union([z.number(), z.string().length(0), z.null()]).optional(),
    expected_close_date: z.string().optional(),
});

export default function OpportunityEdit() {
    const {
        opportunity,
        leads = [],
        owners = [],
        stageOptions = [],
        currencyOptions = [],
    } = usePage<{
        opportunity: any;
        leads: Option[];
        owners: Option[];
        stageOptions: string[];
        currencyOptions: string[];
    }>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Opportunities', href: '/opportunities' },
        {
            title: opportunity?.title ?? 'Opportunity',
            href: `/opportunities/${opportunity?.id}`,
        },
        { title: 'Edit', href: `/opportunities/${opportunity?.id}/edit` },
    ];

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: opportunity?.title ?? '',
            summary: opportunity?.summary ?? '',
            lead_id: (opportunity?.lead_id ?? '') as number | '' | null,
            estimated_value: opportunity?.estimated_value ?? '',
            currency: opportunity?.currency ?? currencyOptions[0] ?? 'USD',
            stage: opportunity?.stage ?? stageOptions[0] ?? 'qualification',
            owner_id: (opportunity?.owner_id ?? '') as number | '' | null,
            expected_close_date: opportunity?.expected_close_date ?? '',
        },
    });

    // const form = useForm<OpportunityFormData>({
    //     title: opportunity?.title ?? '',
    //     summary: opportunity?.summary ?? '',
    //     lead_id: (opportunity?.lead_id ?? '') as number | '' | null,
    //     estimated_value: opportunity?.estimated_value ?? '',
    //     currency: opportunity?.currency ?? currencyOptions[0] ?? 'USD',
    //     stage: opportunity?.stage ?? stageOptions[0] ?? 'qualification',
    //     owner_id: (opportunity?.owner_id ?? '') as number | '' | null,
    //     expected_close_date: opportunity?.expected_close_date ?? '',
    // });

    // const handleSubmit = (event: React.FormEvent) => {
    //     event.preventDefault();
    //     form.put(`/opportunities/${opportunity.id}`);
    // };

    function onSubmit(data: z.infer<typeof formSchema>) {
        // Handle form submission
        router.put(`/opportunities/${opportunity.id}`, data);        
        
        // Reset the form with the submitted data
        form.reset(data);
        console.log(data);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${opportunity?.title ?? 'Opportunity'}`} />

            <div className="flex h-full flex-1 flex-col gap-8 p-6">
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
                    >
                        <div className="grid gap-2">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Title"
                                                {...field}
                                                required
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            This is where you place the title
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid gap-2">
                            <FormField
                                control={form.control}
                                name="summary"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Summary</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Summary"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            This is where you place the summary
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid gap-2 md:grid-cols-2">
                            <div className="grid gap-2">
                                <FormField
                                    control={form.control}
                                    name="lead_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Lead</FormLabel>
                                            <FormControl>
                                                <Select
                                                    onValueChange={(value) =>
                                                        field.onChange(
                                                            value
                                                                ? Number(value)
                                                                : null,
                                                        )
                                                    }
                                                    defaultValue={
                                                        field.value
                                                            ? String(
                                                                  field.value,
                                                              )
                                                            : ''
                                                    }
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="No linked lead" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {/* <SelectLabel>Leads</SelectLabel> */}
                                                        {leads.map((lead) => (
                                                            <SelectItem
                                                                key={lead.id}
                                                                value={String(
                                                                    lead.id,
                                                                )}
                                                            >
                                                                {lead.title}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormDescription>
                                                This is where you place the lead
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid gap-2">
                                <FormField
                                    control={form.control}
                                    name="owner_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Owner</FormLabel>
                                            <FormControl>
                                                <Select
                                                    onValueChange={(value) =>
                                                        field.onChange(
                                                            value
                                                                ? Number(value)
                                                                : null,
                                                        )
                                                    }
                                                    defaultValue={
                                                        field.value
                                                            ? String(
                                                                  field.value,
                                                              )
                                                            : ''
                                                    }
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Unassigned" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {/* <SelectLabel>Owner</SelectLabel> */}
                                                        {owners.map((owner) => (
                                                            <SelectItem
                                                                key={owner.id}
                                                                value={String(
                                                                    owner.id,
                                                                )}
                                                            >
                                                                {owner.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormDescription>
                                                This is where you place the
                                                owner
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2 md:grid-cols-2">
                            <div className="grid gap-2">
                                <FormField
                                    control={form.control}
                                    name="stage"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Stage</FormLabel>
                                            <FormControl>
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    defaultValue={field.value}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select stage" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {stageOptions.map(
                                                            (stage) => (
                                                                <SelectItem
                                                                    key={stage}
                                                                    value={
                                                                        stage
                                                                    }
                                                                >
                                                                    {stage}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormDescription>
                                                This is where you place the
                                                stage
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid gap-2">
                                <FormField
                                    control={form.control}
                                    name="expected_close_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Expected close date
                                            </FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="date"
                                                    value={field.value ?? ''}
                                                    onChange={field.onChange} 
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                This is where you place the
                                                expected close date
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <FormField
                                control={form.control}
                                name="estimated_value"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estimated value</FormLabel>
                                        <FormControl>
                                            <div className="flex gap-2">
                                                <Select
                                                    onValueChange={(value) => {
                                                        form.setValue(
                                                            'currency',
                                                            value,
                                                        );
                                                    }}
                                                    defaultValue={form.getValues(
                                                        'currency',
                                                    )}
                                                >
                                                    <SelectTrigger className="w-28">
                                                        <SelectValue placeholder="Currency" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {currencyOptions.map(
                                                            (currency) => (
                                                                <SelectItem
                                                                    key={
                                                                        currency
                                                                    }
                                                                    value={
                                                                        currency
                                                                    }
                                                                >
                                                                    {currency}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    className="flex-1"
                                                    value={field.value ?? ''}
                                                    onChange={field.onChange}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormDescription>
                                            This is where you place the
                                            estimated value
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div>
                            <Button type="submit">Submit</Button>
                            {/* <button
                                type="submit"
                                className="btn-primary"
                                disabled={form.processing}
                            >
                                {form.processing ? 'Saving...' : 'Save changes'}
                            </button> */}
                        </div>
                    </form>
                </Form>

                {/* <form onSubmit={handleSubmit} className="space-y-6">
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
                </form> */}
            </div>
        </AppLayout>
    );
}
