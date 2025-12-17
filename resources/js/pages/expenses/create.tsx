import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export default function ExpenseCreate() {
    const { register, handleSubmit } = useForm({ defaultValues: { description: '', amount: '' } });

    const onSubmit = (values: any) => router.post('/expenses', values);

    return (
        <AppLayout>
            <Head title="New Expense" />
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div><label className="block">Description</label><Textarea {...register('description')} /></div>
                <div><label className="block">Amount</label><Input type="number" {...register('amount')} /></div>
                <Button type="submit">Save Expense</Button>
            </form>
        </AppLayout>
    );
}
