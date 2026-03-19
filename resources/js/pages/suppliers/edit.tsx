import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SupplierForm({ supplier }: { supplier?: any }) {
    // FIX: breadcrumb was '/supplier' (missing s)
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Suppliers', href: '/suppliers' },
        { title: supplier ? `Edit ${supplier.name}` : 'New Supplier', href: '#' },
    ];

    const { data, setData, post, put, processing, errors } = useForm({
        name:  supplier?.name  ?? '',
        email: supplier?.email ?? '',
        phone: supplier?.phone ?? '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();

        if (supplier?.id) {
            // FIX: was post(`/suppliers/${supplier.id}`) — wrong method for update
            put(`/suppliers/${supplier.id}`);
        } else {
            post('/suppliers');
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={supplier ? `Edit ${data.name}` : 'New Supplier'} />

            <div className="flex h-full flex-col gap-8 p-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {supplier ? `Edit ${data.name}` : 'New Supplier'}
                    </h1>
                </div>

                <form onSubmit={submit} className="max-w-lg space-y-5 bg-card p-6 rounded-lg border shadow-sm">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            placeholder="Supplier name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="contact@supplier.com"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                            id="phone"
                            placeholder="+1 (555) 000-0000"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                        />
                        {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving…' : supplier ? 'Update Supplier' : 'Create Supplier'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => window.history.back()}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}