import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';

export default function InvoiceShow() {
    const { props } = usePage<any>();
    const invoice = props.invoice;
    return (
        <AppLayout>
            <Head title={`Invoice ${invoice.number}`} />
            <div>
                <h1 className="text-2xl font-semibold">Invoice {invoice.number}</h1>
                <div>Client: {invoice.client?.name}</div>
                <div>Total: {invoice.total} {invoice.currency}</div>
                <div className="mt-4 prose" dangerouslySetInnerHTML={{ __html: invoice.notes ?? '' }} />
            </div>
        </AppLayout>
    );
}
