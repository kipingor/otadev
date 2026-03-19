import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { PageHeader } from '@/components/ui/page-header';
import { Edit, Trash2, ExternalLink, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OpportunityStatusBadge } from '@/components/ui/status-badge';
import { useDeleteConfirmation } from '@/components/ui/confirm-dialog';
import { route } from 'ziggy-js';

interface Opportunity {
    id: number;
    title: string;
    summary?: string;
    stage: string;
    estimated_value?: number;
    currency?: string;
    expected_close_date: string;
    created_at: string;
    client_id?: number | null;
    owner?: {
        id: number;
        name: string;
    };
    lead?: {
        id: number;
        title: string;
    };
    project?: {
        id: number;
        name: string;
    };
}

interface Props {
    opportunity: Opportunity;
}

export default function OpportunityShow({
    opportunity,
}: Props) {
    const { confirmDelete, ConfirmDialog } = useDeleteConfirmation();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Opportunities', href: route('web.opportunities.index') },
        {
            title: opportunity?.title ?? 'Opportunity',
            href: route('web.opportunities.show', opportunity?.id),
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

    const formatCurrency = (value: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(value);
    };

    const handleDelete = async () => {
        await confirmDelete({
            itemName: opportunity.title,
            onConfirm: async () => {
                router.delete(route('web.opportunities.destroy', opportunity.id), {
                    onSuccess: () => {
                        router.visit(route('web.opportunities.index'));
                    },
                });
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={opportunity?.title ?? 'Opportunity'} />
            <ConfirmDialog />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <PageHeader
                    title={opportunity?.title}
                    backButton={{
                        label: 'Back to Opportunities',
                        href: route('web.opportunities.index'),
                    }}
                    actions={[
                        {
                            label: opportunity?.client_id ? 'View Client' : 'Convert to Client',
                            href: opportunity?.client_id
                                ? `/clients/${opportunity.client_id}`
                                : `/opportunities/${opportunity?.id}/convert-to-client`,
                            icon: UserPlus,
                            variant: 'outline',
                        },
                        {
                            label: 'Edit',
                            href: route('web.opportunities.edit', opportunity?.id),
                            icon: Edit,
                            variant: 'outline',
                        },
                        {
                            label: 'Delete',
                            onClick: handleDelete,
                            icon: Trash2,
                            variant: 'destructive',
                        },
                    ]}
                />

                {/* Status Badge */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <OpportunityStatusBadge status={opportunity?.stage?.toLowerCase().replace(/ /g, '_')} />
                </div>

                {/* Content Grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content - 2 columns */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Summary Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-line text-muted-foreground">
                                    {opportunity?.summary || 'No summary available.'}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Timeline Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Timeline</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground">
                                            Expected Close Date
                                        </div>
                                        <div className="mt-1 text-lg font-semibold">
                                            {formatDate(opportunity?.expected_close_date)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground">
                                            Created On
                                        </div>
                                        <div className="mt-1 text-lg font-semibold">
                                            {formatDate(opportunity?.created_at)}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar - 1 column */}
                    <aside className="space-y-6">
                        {/* Financials Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Estimated Value</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">
                                    {formatCurrency(
                                        opportunity?.estimated_value ?? 0,
                                        opportunity?.currency ?? 'USD'
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Linked Records Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Linked Records</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Owner */}
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">
                                        Owner
                                    </div>
                                    <div className="mt-1">
                                        {opportunity?.owner?.name ?? 'Unassigned'}
                                    </div>
                                </div>

                                {/* Lead */}
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">
                                        Lead
                                    </div>
                                    <div className="mt-1">
                                        {opportunity?.lead ? (
                                            <Button
                                                variant="link"
                                                className="h-auto p-0 text-primary"
                                                asChild
                                            >
                                                <Link href={route('leads.show', opportunity.lead.id)}>
                                                    {opportunity.lead.title}
                                                    <ExternalLink className="ml-1 h-3 w-3" />
                                                </Link>
                                            </Button>
                                        ) : (
                                            <span className="text-muted-foreground">No lead attached</span>
                                        )}
                                    </div>
                                </div>

                                {/* Project */}
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">
                                        Project
                                    </div>
                                    <div className="mt-1">
                                        {opportunity?.project ? (
                                            <Button
                                                variant="link"
                                                className="h-auto p-0 text-primary"
                                                asChild
                                            >
                                                <Link href={route('projects.show', opportunity.project.id)}>
                                                    {opportunity.project.name}
                                                    <ExternalLink className="ml-1 h-3 w-3" />
                                                </Link>
                                            </Button>
                                        ) : (
                                            <span className="text-muted-foreground">No project attached</span>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </div>
        </AppLayout>
    );
}