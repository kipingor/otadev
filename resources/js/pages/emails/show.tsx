import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';

export default function EmailShow() {
    const { props } = usePage<any>();
    const email = props.email;

    return (
        <AppLayout>
            <Head title={email?.subject ?? 'Email'} />
            <div>
                <h1 className="text-2xl font-semibold">{email?.subject}</h1>
                <p className="text-sm text-muted-foreground">To: {email?.recipient}</p>
                <div className="prose mt-4" dangerouslySetInnerHTML={{ __html: email?.body ?? '' }} />
            </div>
        </AppLayout>
    );
}
