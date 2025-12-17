import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from "@inertiajs/react";
import { type BreadcrumbItem } from '@/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { route } from 'ziggy-js';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Supplier', href: '/supplier' },
];

export default function SupplierForm({ supplier }: any) {
    const { data, setData, post, put, processing, errors } = useForm({
        name: supplier?.name || "",
        email: supplier?.email || "",
        phone: supplier?.phone || "",
    });

    function submit(e: any) {
        e.preventDefault();

        supplier
            ? put(`/suppliers/${supplier.id}`)
            : post(`/suppliers/${supplier.id}`);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Supplier" />

            <div className='flex h-full flex-col gap-8 p-6'>
                {/** Header with title */}
                <div>
                    <h1 className='text-3xl font-bold tacking-tight'>
                        Edit {data.name}
                    </h1>
                </div>

                <form
                    onSubmit={submit}
                    className="max-w-lg space-y-4 bg-white p-6 rounded-lg shadow"
                >
                    <Input
                        placeholder="Name"
                        value={data.name}
                        onChange={(e) => setData("name", e.target.value)}
                    />
                    <Input
                        placeholder="Email"
                        value={data.email}
                        onChange={(e) => setData("email", e.target.value)}
                    />
                    <Input
                        placeholder="Phone"
                        value={data.phone}
                        onChange={(e) => setData("phone", e.target.value)}
                    />

                    <Button disabled={processing}>
                        {supplier ? "Update" : "Create"}
                    </Button>
                </form>
            </div>

        </AppLayout>
    );
}
