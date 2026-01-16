import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import OpportunityCard from '@/pages/opportunities/opportunity-card';
import { PageHeader } from '@/components/ui/page-header';
import { Plus } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { route } from 'ziggy-js';

interface Opportunity {
    id: number;
    title: string;
    [key: string]: any;
}

interface Props {
    opportunities: {
        data: Opportunity[];
    };
}

export default function OpportunitiesIndex({
    opportunities,
}: Props) {
    const items = opportunities?.data ?? [];

    return (
        <AppLayout>
            <Head title="Opportunities" />
            
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <PageHeader
                    title="Opportunities"
                    description="Manage your sales opportunities and track potential deals."
                    actions={[
                        {
                            label: 'New Opportunity',
                            href: route('web.opportunities.create'),
                            icon: Plus,
                            variant: 'default',
                        },
                    ]}
                />

                {/* Opportunities Grid */}
                {items.length > 0 ? (
                    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                        {items.map((opportunity: Opportunity) => (
                            <OpportunityCard
                                key={opportunity.id}
                                opportunity={opportunity}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        title="No opportunities yet"
                        description="Get started by creating your first sales opportunity."
                        action={{
                            label: 'Create Opportunity',
                            href: route('web.opportunities.create'),
                        }}
                    />
                )}
            </div>
        </AppLayout>
    );
}