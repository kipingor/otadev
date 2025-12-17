import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Audit Log', href: '/audit-logs' }];

export default function AuditLogsIndex() {
    const { props } = usePage<any>();
    const logs = props.auditLogs?.data ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Audit Logs" />
            <div className="space-y-3">
                {logs.map((l: any) => (
                    <Card key={l.id}>
                        <CardHeader>
                            <div className="flex justify-between">
                                <div className="text-sm font-medium">{l.event}</div>
                                <div className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <pre className="text-xs">{JSON.stringify({ old: l.old_values, new: l.new_values }, null, 2)}</pre>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </AppLayout>
    );
}
