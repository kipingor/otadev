import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Emails', href: '/emails' },
    { title: 'Compose', href: '/emails/compose' }
];

export default function EmailCompose() {
    const { register, handleSubmit } = useForm({ defaultValues: { recipient: '', subject: '', body: '' } });

    const onSubmit = (values: any) => {
        router.post('/emails', values);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Compose Email" />
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div><label className="block">To</label><Input {...register('recipient', { required: true })} /></div>
                <div><label className="block">Subject</label><Input {...register('subject')} /></div>
                <div><label className="block">Body</label><Textarea {...register('body', { required: true })} /></div>
                <Button type="submit">Send</Button>
            </form>
        </AppLayout>
    );
}
