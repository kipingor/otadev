import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function TimeLogCreate() {
    const { register, handleSubmit } = useForm({ defaultValues: { task_id: '', hours: '', notes: '' } });

    const onSubmit = (values: any) => router.post('/time-logs', values);

    return (
        <AppLayout>
            <Head title="Log Time" />
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div><label>Task</label><Input {...register('task_id')} /></div>
                <div><label>Hours</label><Input type="number" {...register('hours')} /></div>
                <div><label>Notes</label><Input {...register('notes')} /></div>
                <Button type="submit">Save</Button>
            </form>
        </AppLayout>
    );
}
