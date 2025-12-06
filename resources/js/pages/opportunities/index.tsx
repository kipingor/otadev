import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import OpportunityCard from '@/pages/opportunities/opportunity-card';
import { Button } from '@/components/ui/button';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Opportunities',
        href: '/opportunities',
    },
];

export default function OpportunitiesIndex() {
    const { opportunities } = usePage<{ opportunities: { data: any[] } }>()
        .props;
    const items = opportunities?.data ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Opportunities" />

            <div className="flex h-full flex-1 flex-col gap-8 p-6">
                {/* Header with title and "New Opportunity" button */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Opportunities
                        </h1>
                        <p className="text-muted-foreground">
                            Manage your sales opportunities and track potential
                            deals.
                        </p>
                    </div>
                    <div>
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="h-8 px-3 text-xs"
                        >
                            <Link
                                href="/opportunities/create"
                                className="p-1"
                            >
                                New Opportunity +
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 grid-col-1 lg:grid-cols-2 mt-4">
                    {items.map((opportunity: any) => (
                        <OpportunityCard
                            key={opportunity.id}
                            opportunity={opportunity}
                        />
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
