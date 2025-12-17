import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';

export default function ProposalShow() {
    const { props } = usePage<any>();
    const proposal = props.proposal;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Proposals', href: '/proposals' },
        { title: proposal?.title ?? 'Proposal', href: `/proposals/${proposal?.id}` }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={proposal?.title ?? 'Proposal'} />
            <div className="space-y-4">
                <h1 className="text-2xl font-semibold">{proposal?.title}</h1>
                <div className="prose" dangerouslySetInnerHTML={{ __html: proposal?.content ?? '' }} />
                <div className="mt-4">
                    <Button asChild><Link href={`/proposals/${proposal.id}/edit`}>Edit</Link></Button>
                </div>
            </div>
        </AppLayout>
    );
}
