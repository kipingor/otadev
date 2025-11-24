import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Opportunities', href: '/opportunities' },
];

export default function OpportunitiesIndex() {
    const { opportunities } = usePage<{ opportunities: { data: any[] } }>().props;
    const items = opportunities?.data ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Opportunities" />

            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Opportunities</h1>
                <Link href="/opportunities/create" className="btn">
                    New opportunity
                </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.map((opportunity) => (
                    <div key={opportunity.id} className="rounded-xl border p-4 space-y-3 shadow-sm bg-card">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg">{opportunity.title}</h3>
                            <span className="rounded-full bg-muted px-3 py-1 text-xs uppercase tracking-wide">
                                {opportunity.stage}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {opportunity.summary ?? 'No summary provided yet.'}
                        </p>
                        <div className="text-sm text-muted-foreground">
                            Lead: {opportunity.lead?.title ?? 'n/a'} • Owner: {opportunity.owner?.name ?? 'n/a'}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <div>
                                {opportunity.currency ?? 'USD'}{' '}
                                {Number(opportunity.estimated_value ?? 0).toLocaleString()}
                            </div>
                            <Link href={`/opportunities/${opportunity.id}`} className="text-primary underline text-sm">
                                View
                            </Link>
                        </div>
                    </div>
                ))}

                {!items.length && (
                    <div className="rounded-xl border p-6 text-center text-muted-foreground">
                        No opportunities yet. Create the first one to get started.
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

