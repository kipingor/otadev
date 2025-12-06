import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function OpportunityShow() {
    const { opportunity } = usePage<{ opportunity: any }>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Opportunities', href: '/opportunities' },
        {
            title: opportunity?.title ?? 'Opportunity',
            href: `/opportunities/${opportunity?.id}`,
        },
    ];

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={opportunity?.title ?? 'Opportunity'} />

            <div className="flex h-full flex-1 flex-col gap-4 p-6">
                <div className="flex md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold">
                            {opportunity?.title}
                        </h1>
                        <p className="text-muted-foreground">
                            Stage: <strong>{opportunity?.stage}</strong>
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="h-8 px-3 text-xs"
                        >
                            <Link
                                href={`/opportunities/${opportunity?.id}/edit`}
                                className="p-1"
                            >
                                Edit
                            </Link>
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            asChild
                            className="h-8 px-3 text-xs"
                        >
                            <Link
                                as="button"
                                method="delete"
                                href={`/opportunities/${opportunity?.id}`}
                                className="p-1"
                                preserveScroll
                            >
                                Delete
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-3">
                    <div className="space-y-4 md:col-span-2">
                        <section className="space-y-2 rounded-xl border bg-card p-5 shadow-sm">
                            <h2 className="text-lg font-semibold">Summary</h2>
                            <p className="whitespace-pre-line text-muted-foreground">
                                {opportunity?.summary ?? 'No summary yet.'}
                            </p>
                        </section>

                        <section className="space-y-3 rounded-xl border bg-card p-5 shadow-sm">
                            <h2 className="text-lg font-semibold">Timeline</h2>
                            <div className="grid gap-3 md:grid-cols-2">
                                <div>
                                    <div className="text-xs text-muted-foreground uppercase">
                                        Expected close
                                    </div>
                                    <div>
                                        {formatDate(opportunity?.expected_close_date) ??
                                            'n/a'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground uppercase">
                                        Created on
                                    </div>
                                    <div>{formatDate(opportunity?.created_at)}</div>
                                </div>
                            </div>
                        </section>
                    </div>

                    <aside className="space-y-4">
                        <section className="space-y-2 rounded-xl border bg-card p-4 shadow-sm">
                            <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                Financials
                            </h3>
                            <div className="text-2xl font-semibold">
                                {opportunity?.currency ?? 'USD'}{' '}
                                {Number(
                                    opportunity?.estimated_value ?? 0,
                                ).toLocaleString()}
                            </div>
                        </section>

                        <section className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
                            <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                Linked records
                            </h3>
                            <div className="text-sm">
                                <div className="text-muted-foreground">
                                    Lead
                                </div>
                                {opportunity?.lead ? (
                                    <Link
                                        href={`/leads/${opportunity.lead.id}`}
                                        className="underline"
                                    >
                                        {opportunity.lead.title}
                                    </Link>
                                ) : (
                                    <span>n/a</span>
                                )}
                            </div>
                            <div className="text-sm">
                                <div className="text-muted-foreground">
                                    Owner
                                </div>
                                <span>{opportunity?.owner?.name ?? 'n/a'}</span>
                            </div>
                            <div className="text-sm">
                                <div className="text-muted-foreground">
                                    Project
                                </div>
                                {opportunity?.project ? (
                                    <Link
                                        href={`/projects/${opportunity.project.id}`}
                                        className="underline"
                                    >
                                        {opportunity.project.name}
                                    </Link>
                                ) : (
                                    <span>No project attached</span>
                                )}
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </AppLayout>
    );
}
