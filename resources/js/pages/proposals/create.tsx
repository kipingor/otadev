import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Proposals', href: '/proposals' },
    { title: 'Create', href: '/proposals/create' },
];

export default function ProposalCreate() {
    const { register, handleSubmit } = useForm({
        defaultValues: { title: '', content: '', opportunity_id: '' }
    });

    const onSubmit = (values: any) => {
        router.post('/proposals', values);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Proposal" />
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">Title</label>
                    <Input {...register('title', { required: true })} />
                </div>
                <div>
                    <label className="block text-sm font-medium">Content</label>
                    <Textarea {...register('content', { required: true })} />
                </div>
                <Button type="submit">Create Proposal</Button>
            </form>
        </AppLayout>
    );
}
