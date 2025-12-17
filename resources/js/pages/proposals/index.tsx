import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import ProposalCard from '@/pages/proposals/proposal-card';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Proposals', href: '/proposals' }];

export default function ProposalsIndex() {
    const { props } = usePage<any>();
    const proposals = props.proposals?.data ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Proposals" />
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Proposals</h1>
                <Link href="/proposals/create"><Button>New Proposal</Button></Link>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {proposals.map((p: any) => <ProposalCard key={p.id} proposal={p} />)}
            </div>
        </AppLayout>
    );
}
