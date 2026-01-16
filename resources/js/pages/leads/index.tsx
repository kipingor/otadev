import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/ui/loading-state';
import { PageHeader } from '@/components/ui/page-header';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import LeadCard from '@/pages/leads/lead-card';
import { Lead, PaginatedData, Pipeline, User } from '@/types/models.types';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { useCallback, useState } from 'react';
import { route } from 'ziggy-js';

interface Props {
    leads: PaginatedData<Lead> & { loading: boolean };
    filters: {
        owner_id?: number;
        pipeline_stage_id?: number;
        status?: string;
        search?: string;
    };
    pipelineStages?: Pipeline[];
    users?: User[];
}

export default function LeadsIndex({
    leads,
    filters,
    pipelineStages = [],
    users = [],
}: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleFilterChange = useCallback(
        (key: string, value: string) => {
            router.get(
                route('leads.index'),
                { ...filters, [key]: value },
                {
                    preserveState: true,
                    preserveScroll: true,
                },
            );
        },
        [filters],
    );

    const handleSearch = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            handleFilterChange('search', search);
        },
        [search, handleFilterChange],
    );

    const handleClearFilters = useCallback(() => {
        setSearch('');
        router.get(
            route('leads.index'),
            {},
            {
                preserveState: false,
                preserveScroll: false,
            },
        );
    }, []);

    const hasActiveFilters =
        filters.owner_id ||
        filters.pipeline_stage_id ||
        filters.status ||
        filters.search;

    return (
        <>
            <Head title="Leads" />

            <AppLayout>
                <div className="flex h-full flex-1 flex-col gap-6 p-6">
                    {/* Page Header */}
                    <PageHeader
                        title="Leads"
                        description="Manage your leads and track potential customers."
                        actions={[
                            {
                                label: 'Create Lead',
                                href: route('leads.create'),
                                icon: Plus,
                                variant: 'default',
                            },
                        ]}
                    />

                    {/* Filters */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        <form onSubmit={handleSearch} className="flex-1">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search leads by title, description..."
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        className="pl-9"
                                    />
                                </div>
                                <Button type="submit" variant="secondary">
                                    Search
                                </Button>
                            </div>
                        </form>

                        <div className="flex flex-wrap gap-2">
                            <Select
                                value={
                                    filters.pipeline_stage_id?.toString() || ''
                                }
                                onValueChange={(value) =>
                                    handleFilterChange(
                                        'pipeline_stage_id',
                                        value === 'all' ? '' : value
                                    )
                                }
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Stages" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Stages
                                    </SelectItem>
                                    {pipelineStages.map((stage) => (
                                        <SelectItem
                                            key={stage.id}
                                            value={stage.id.toString()}
                                        >
                                            {stage.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={filters.owner_id?.toString() || ''}
                                onValueChange={(value) =>
                                    handleFilterChange('owner_id', value === 'all' ? '' : value)
                                }
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Owners" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Owners
                                    </SelectItem>
                                    {users.map((user) => (
                                        <SelectItem
                                            key={user.id}
                                            value={user.id.toString()}
                                        >
                                            {user.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClearFilters}
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Results Count */}
                    {leads?.meta?.total !== undefined && (
                        <div className="text-sm text-muted-foreground">
                            Showing {leads.data.length} of {leads.meta.total}{' '}
                            leads
                        </div>
                    )}

                    {/* Leads Grid */}
                    {leads.loading ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <LoadingState variant="card" />
                            <LoadingState variant="card" />
                            <LoadingState variant="card" />
                        </div>
                    ) : leads.data.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {leads.data.map((lead) => (
                                <LeadCard key={lead.id} lead={lead} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-lg border bg-muted/50 py-12 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                <Search className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="mt-4 text-lg font-semibold">
                                No leads found
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {hasActiveFilters
                                    ? 'Try adjusting your filters or search criteria'
                                    : 'Create your first lead to get started'}
                            </p>
                            <div className="mt-6 flex gap-2">
                                {hasActiveFilters ? (
                                    <Button
                                        variant="outline"
                                        onClick={handleClearFilters}
                                    >
                                        Clear Filters
                                    </Button>
                                ) : null}
                                <Button asChild>
                                    <Link href={route('leads.create')}>
                                        Create Lead
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Pagination */}
                    {leads?.meta?.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="text-sm text-muted-foreground">
                                Page {leads.meta.current_page} of{' '}
                                {leads.meta.last_page}
                            </div>

                            <div className="flex items-center gap-2">
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                isActive={
                                                    !!leads.links.find(
                                                        (link) =>
                                                            link.label ===
                                                            'Previous',
                                                    )?.url
                                                }
                                                onClick={() => {
                                                    const prevLink =
                                                        leads.links.find(
                                                            (link) =>
                                                                link.label ===
                                                                'Previous',
                                                        );
                                                    if (prevLink?.url) {
                                                        router.get(
                                                            prevLink.url,
                                                            {},
                                                            {
                                                                preserveScroll: true,
                                                                preserveState: true,
                                                                only: [
                                                                    'leads',
                                                                    'filters',
                                                                ],
                                                            },
                                                        );
                                                    }
                                                }}
                                            />
                                        </PaginationItem>

                                        {/* Page numbers - show first, last and current +/- 1 */}
                                        {Array.from(
                                            { length: leads.meta.last_page },
                                            (_, i) => i + 1,
                                        )
                                            .filter((page) => {
                                                return (
                                                    page === 1 ||
                                                    page ===
                                                        leads.meta.last_page ||
                                                    Math.abs(
                                                        page -
                                                            leads.meta
                                                                .current_page,
                                                    ) <= 1
                                                );
                                            })
                                            .map((page, idx, arr) => {
                                                // Show ellipsis
                                                if (
                                                    idx > 0 &&
                                                    page - arr[idx - 1] > 1
                                                ) {
                                                    return (
                                                        <PaginationItem
                                                            key={`ellipsis-${page}`}
                                                        >
                                                            <PaginationEllipsis />
                                                        </PaginationItem>
                                                    );
                                                }

                                                return (
                                                    <PaginationItem key={page}>
                                                        <PaginationLink
                                                            isActive={
                                                                page ===
                                                                leads.meta
                                                                    .current_page
                                                            }
                                                            onClick={() => {
                                                                const link =
                                                                    leads.links.find(
                                                                        (l) =>
                                                                            l.label ===
                                                                            page.toString(),
                                                                    );
                                                                if (link?.url) {
                                                                    router.get(
                                                                        link.url,
                                                                        {},
                                                                        {
                                                                            preserveScroll: true,
                                                                            preserveState: true,
                                                                            only: [
                                                                                'leads',
                                                                                'filters',
                                                                            ],
                                                                        },
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            {page}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                );
                                            })}

                                        <PaginationItem>
                                            <PaginationNext
                                                isActive={
                                                    !!leads.links.find(
                                                        (link) =>
                                                            link.label ===
                                                            'Next',
                                                    )?.url
                                                }
                                                onClick={() => {
                                                    const nextLink =
                                                        leads.links.find(
                                                            (link) =>
                                                                link.label ===
                                                                'Next',
                                                        );
                                                    if (nextLink?.url) {
                                                        router.get(
                                                            nextLink.url,
                                                            {},
                                                            {
                                                                preserveScroll: true,
                                                                preserveState: true,
                                                                only: [
                                                                    'leads',
                                                                    'filters',
                                                                ],
                                                            },
                                                        );
                                                    }
                                                }}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>

                                <Select
                                    value={
                                        leads.meta.per_page?.toString() || '10'
                                    }
                                    onValueChange={(value) => {
                                        const currentUrl = new URL(
                                            window.location.href,
                                        );
                                        currentUrl.searchParams.set(
                                            'per_page',
                                            value,
                                        );
                                        router.get(
                                            currentUrl.pathname +
                                                currentUrl.search,
                                            {},
                                            {
                                                preserveScroll: true,
                                                preserveState: true,
                                                only: ['leads', 'filters'],
                                            },
                                        );
                                    }}
                                >
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">
                                            10 per page
                                        </SelectItem>
                                        <SelectItem value="25">
                                            25 per page
                                        </SelectItem>
                                        <SelectItem value="50">
                                            50 per page
                                        </SelectItem>
                                        <SelectItem value="100">
                                            100 per page
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </div>
            </AppLayout>
        </>
    );
}
