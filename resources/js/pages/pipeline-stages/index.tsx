import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Pipeline Stages', href: '/pipeline-stages' }];

export default function PipelineStagesIndex() {
    const { props } = usePage<any>();
    const stages = props.stages ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pipeline Stages" />
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Pipeline Stages</h1>
                <Link href="/pipeline-stages/create"><Button>New Stage</Button></Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stages.map((s: any) => (
                    <Card key={s.id}>
                        <CardHeader><CardTitle>{s.name}</CardTitle></CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground">{s.description}</div>
                            <div className="mt-3">
                                <Link href={`/pipeline-stages/${s.id}/edit`} className="underline text-sm">Edit</Link>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </AppLayout>
    );
}
