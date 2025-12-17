import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import TimeLogCard from '@/pages/time-logs/time-log-card';
import { Button } from '@/components/ui/button';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Time Logs', href: '/time-logs' }];

export default function TimeLogsIndex() {
    const { props } = usePage<any>();
    const logs = props.timeLogs?.data ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Time Logs" />
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Time Logs</h1>
                <Link href="/time-logs/create"><Button>Log Time</Button></Link>
            </div>
            <div className="space-y-3">{logs.map((l: any) => <TimeLogCard key={l.id} log={l} />)}</div>
        </AppLayout>
    );
}
