import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import leads from '@/routes/leads';
import opportunities from '@/routes/opportunities';
import pipelines from '@/routes/pipelines';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

function StatCard({ title, value, href }: { title: string; value: string | number; href?: any }) {
    return (
        <Card className="p-4">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-semibold">{value}</div>
            </CardContent>
            <CardFooter>
                {href ? (
                    <Link href={href} className="text-sm text-primary-600 hover:underline">
                        View all
                    </Link>
                ) : null}
            </CardFooter>
        </Card>
    );
}

export default function Dashboard() {
    const { props } = usePage();
    // optional server-provided data: props.data?.counts
    const counts = (props as any)?.data?.counts ?? {};

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <StatCard title="Leads" value={counts.leads ?? '—'} href={leads.index()} />
                    <StatCard title="Opportunities" value={counts.opportunities ?? '—'} href={opportunities.index()} />
                    <StatCard title="Open Pipeline" value={counts.open_pipeline ?? '—'} href={pipelines.index()} />
                    <StatCard title="Documents Processed" value={counts.documents ?? '—'} href={leads.index()} />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Card className="p-0">
                        <CardHeader>
                            <CardTitle>Recent Leads</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="divide-y">
                                <li className="px-4 py-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium">Acme Corp</div>
                                            <div className="text-sm text-muted-foreground">joe@example.com · New</div>
                                        </div>
                                        <div className="text-sm text-muted-foreground">2 days</div>
                                    </div>
                                </li>
                                <li className="px-4 py-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium">Beta LLC</div>
                                            <div className="text-sm text-muted-foreground">kate@example.com · Contacted</div>
                                        </div>
                                        <div className="text-sm text-muted-foreground">5 days</div>
                                    </div>
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter />
                    </Card>

                    <Card className="p-0">
                        <CardHeader>
                            <CardTitle>Pipeline Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm">Qualification</div>
                                    <div className="font-semibold">12</div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="text-sm">Proposal</div>
                                    <div className="font-semibold">8</div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="text-sm">Negotiation</div>
                                    <div className="font-semibold">3</div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter />
                    </Card>

                    <Card className="p-0">
                        <CardHeader>
                            <CardTitle>Recent Documents</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="divide-y">
                                <li className="px-4 py-3">
                                    <div className="text-sm">proposal_acme.pdf</div>
                                    <div className="text-xs text-muted-foreground">Processed • AI summary ready</div>
                                </li>
                                <li className="px-4 py-3">
                                    <div className="text-sm">nda_beta.docx</div>
                                    <div className="text-xs text-muted-foreground">Processing</div>
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter />
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
