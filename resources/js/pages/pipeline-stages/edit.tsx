import AppLayout from '@/layouts/app-layout';
import { Head, usePage, useForm } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { type BreadcrumbItem } from '@/types';

export default function PipelineStageEdit() {
    const { props } = usePage<any>();
    const stage = props.stage;
    const form = useForm({
        name: stage?.name ?? '',
        description: stage?.description ?? '',
    });

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.put(`/pipeline-stages/${stage.id}`);
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Pipeline Stages', href: '/pipeline-stages' },
        { title: 'Edit', href: `/pipeline-stages/${stage.id}/edit` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Pipeline Stage" />
            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">Name</label>
                    <Input value={form.data.name as string} onChange={(e) => form.setData('name', e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm font-medium">Description</label>
                    <Textarea value={form.data.description as string} onChange={(e) => form.setData('description', e.target.value)} />
                </div>
                <Button type="submit">Save</Button>
            </form>
        </AppLayout>
    );
}
