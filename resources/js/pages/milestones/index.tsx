import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import MilestoneCard from '@/pages/milestones/milestone-card';
import { Button } from '@/components/ui/button';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Milestones', href: '/milestones' }];

export default function MilestonesIndex() {
    const { props } = usePage<any>();
    const milestones = props.milestones?.data ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Milestones" />
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Milestones</h1>
                <Link href="/milestones/create"><Button>New Milestone</Button></Link>
            </div>
            <div className="space-y-4">{milestones.map((m: any) => <MilestoneCard key={m.id} milestone={m} />)}</div>
        </AppLayout>
    );
}
