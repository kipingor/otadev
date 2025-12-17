import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import InvoiceCard from '@/pages/invoices/invoice-card';
import { Button } from '@/components/ui/button';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Invoices', href: '/invoices' }];

export default function InvoicesIndex() {
    const { props } = usePage<any>();
    const invoices = props.invoices?.data ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Invoices" />
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Invoices</h1>
                <Link href="/invoices/create"><Button>New Invoice</Button></Link>
            </div>
            <div className="space-y-4">{invoices.map((i: any) => <InvoiceCard key={i.id} invoice={i} />)}</div>
        </AppLayout>
    );
}
