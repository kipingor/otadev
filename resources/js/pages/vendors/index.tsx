import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import VendorCard from '@/pages/vendors/vendor-card';

export default function VendorsIndex() {
    const { props } = usePage<any>();
    const vendors = props.vendors?.data ?? [];

    return (
        <AppLayout>
            <Head title="Vendors" />

            <div className="flex h-full flex-1 flex-col gap-8 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-semibold">Vendors</h1>
                    <Link href="/vendors/create"><Button>New Vendor</Button></Link>
                </div>

                <div className="space-y-3">{vendors.map((v: any) => <VendorCard key={v.id} vendor={v} />)}</div>
            </div>
        </AppLayout>
    );
}
