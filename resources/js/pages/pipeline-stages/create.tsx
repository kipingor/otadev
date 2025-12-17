import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pipeline Stages', href: '/pipeline-stages' },
    { title: 'Create', href: '/pipeline-stages/create' },
];

export default function PipelineStageCreate() {
    const form = useForm({ name: '', description: '' });

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/pipeline-stages');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Pipeline Stage" />
            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">Name</label>
                    <Input value={form.data.name as string} onChange={(e) => form.setData('name', e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm font-medium">Description</label>
                    <Textarea value={form.data.description as string} onChange={(e) => form.setData('description', e.target.value)} />
                </div>
                <Button type="submit">Create</Button>
            </form>
        </AppLayout>
    );
}
