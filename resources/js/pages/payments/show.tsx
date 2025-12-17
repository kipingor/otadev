import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';

export default function PaymentShow() {
    const { props } = usePage<any>();
    const payment = props.payment;

    return (
        <AppLayout>
            <Head title={`Payment ${payment.id}`} />
            <div>
                <h1 className="text-2xl font-semibold">Payment #{payment.id}</h1>
                <div>Amount: {payment.amount} {payment.currency}</div>
                <div>Method: {payment.method}</div>
                <div>Reference: {payment.reference}</div>
            </div>
        </AppLayout>
    );
}
