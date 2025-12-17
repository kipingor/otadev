import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import PaymentCard from '@/pages/payments/payment-card';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Payments', href: '/payments' }];

export default function PaymentsIndex() {
    const { props } = usePage<any>();
    const payments = props.payments?.data ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payments" />
            <div className="space-y-4">
                {payments.map((p: any) => <PaymentCard key={p.id} payment={p} />)}
            </div>
        </AppLayout>
    );
}
