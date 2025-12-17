import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import EmailCard from '@/pages/emails/email-card';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Emails', href: '/emails' }];

export default function EmailsIndex() {
    const { props } = usePage<any>();
    const emails = props.emails?.data ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Emails" />
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Emails</h1>
                <Link href="/emails/compose"><Button>Compose</Button></Link>
            </div>

            <div className="space-y-3">
                {emails.map((e: any) => <EmailCard key={e.id} email={e} />)}
            </div>
        </AppLayout>
    );
}
