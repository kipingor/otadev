import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';

export default function OpportunityShow() {
    const { opportunity } = usePage<{ opportunity: any }>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Opportunities', href: '/opportunities' },
        { title: opportunity?.title ?? 'Opportunity', href: `/opportunities/${opportunity?.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={opportunity?.title ?? 'Opportunity'} />

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold">{opportunity?.title}</h1>
                    <p className="text-muted-foreground">
                        Stage: <strong>{opportunity?.stage}</strong>
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link href={`/opportunities/${opportunity?.id}/edit`} className="btn">
                        Edit
                    </Link>
                    <Link
                        as="button"
                        method="delete"
                        href={`/opportunities/${opportunity?.id}`}
                        className="inline-flex items-center rounded-md border border-red-600 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                        preserveScroll
                    >
                        Delete
                    </Link>
                </div>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-4">
                    <section className="rounded-xl border p-5 space-y-2 bg-card shadow-sm">
                        <h2 className="text-lg font-semibold">Summary</h2>
                        <p className="text-muted-foreground whitespace-pre-line">
                            {opportunity?.summary ?? 'No summary yet.'}
                        </p>
                    </section>

                    <section className="rounded-xl border p-5 space-y-3 bg-card shadow-sm">
                        <h2 className="text-lg font-semibold">Timeline</h2>
                        <div className="grid gap-3 md:grid-cols-2">
                            <div>
                                <div className="text-xs uppercase text-muted-foreground">Expected close</div>
                                <div>{opportunity?.expected_close_date ?? 'n/a'}</div>
                            </div>
                            <div>
                                <div className="text-xs uppercase text-muted-foreground">Created on</div>
                                <div>{opportunity?.created_at}</div>
                            </div>
                        </div>
                    </section>
                </div>

                <aside className="space-y-4">
                    <section className="rounded-xl border p-4 bg-card shadow-sm space-y-2">
                        <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wide">
                            Financials
                        </h3>
                        <div className="text-2xl font-semibold">
                            {opportunity?.currency ?? 'USD'}{' '}
                            {Number(opportunity?.estimated_value ?? 0).toLocaleString()}
                        </div>
                    </section>

                    <section className="rounded-xl border p-4 bg-card shadow-sm space-y-3">
                        <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wide">
                            Linked records
                        </h3>
                        <div className="text-sm">
                            <div className="text-muted-foreground">Lead</div>
                            {opportunity?.lead ? (
                                <Link href={`/leads/${opportunity.lead.id}`} className="underline">
                                    {opportunity.lead.title}
                                </Link>
                            ) : (
                                <span>n/a</span>
                            )}
                        </div>
                        <div className="text-sm">
                            <div className="text-muted-foreground">Owner</div>
                            <span>{opportunity?.owner?.name ?? 'n/a'}</span>
                        </div>
                        <div className="text-sm">
                            <div className="text-muted-foreground">Project</div>
                            {opportunity?.project ? (
                                <Link href={`/projects/${opportunity.project.id}`} className="underline">
                                    {opportunity.project.name}
                                </Link>
                            ) : (
                                <span>No project attached</span>
                            )}
                        </div>
                    </section>
                </aside>
            </div>
        </AppLayout>
    );
}

