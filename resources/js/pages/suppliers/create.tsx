import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { route } from 'ziggy-js';

export default function SupplierForm({ supplier }: any) {
    const { data, setData, post, put, processing, errors } = useForm({
        name: supplier?.name || "",
        email: supplier?.email || "",
        phone: supplier?.phone || "",
    });

    function submit(e: any) {
        e.preventDefault();

        supplier
            ? put(route("suppliers.update", supplier.id))
            : post(route("suppliers.store"));
    }

    return (
        <AppLayout>
            <Head title="Supplier" />

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
        </AppLayout>
    );
}
