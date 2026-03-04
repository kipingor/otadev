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
import { Head, router } from '@inertiajs/react';
import { Plus, Search, Filter, Inbox, SearchX } from 'lucide-react';
import { useCallback, useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { route } from 'ziggy-js';

interface Props {
    leads: PaginatedData<Lead>;
    filters: {
        owner_id?: number;
        pipeline_stage_id?: number;
        status?: string;
        search?: string;
        per_page?: number;
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
    const [isSearching, setIsSearching] = useState(false);
    const debouncedSearch = useDebounce(search, 500);

    // Auto-search with debouncing
    useEffect(() => {
        if (debouncedSearch !== filters.search) {
            setIsSearching(true);
            router.get(
                route('leads.index'),
                { 
                    ...filters, 
                    search: debouncedSearch || undefined,
                    page: undefined, // Reset to page 1 on search
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    onFinish: () => setIsSearching(false),
                },
            );
        }
    }, [debouncedSearch]);

    const handleFilterChange = useCallback(
        (key: string, value: string) => {
            router.get(
                route('leads.index'),
                { 
                    ...filters, 
                    [key]: value === 'all' ? undefined : value,
                    page: undefined, // Reset to page 1 on filter change
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                },
            );
        },
        [filters],
    );

    const handlePerPageChange = useCallback(
        (value: string) => {
            router.get(
                route('leads.index'),
                { 
                    ...filters, 
                    per_page: value,
                    page: undefined, // Reset to page 1
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                },
            );
        },
        [filters],
    );

    const handleClearFilters = useCallback(() => {
        setSearch('');
        router.visit(route('leads.index'), {
            replace: true,
            preserveState: false,
        });
    }, []);

    const hasActiveFilters =
        filters.owner_id ||
        filters.pipeline_stage_id ||
        filters.status ||
        filters.search;

    const activeFilterCount = [
        filters.owner_id,
        filters.pipeline_stage_id,
        filters.status,
        filters.search,
    ].filter(Boolean).length;

    // Helper to get page numbers for pagination
    const getPageNumbers = (current: number, total: number) => {
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
        
        const pages: (number | string)[] = [1];
        
        if (current > 3) pages.push('...');
        
        const start = Math.max(2, current - 1);
        const end = Math.min(total - 1, current + 1);
        
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        
        if (current < total - 2) pages.push('...');
        if (total > 1) pages.push(total);
        
        return pages;
    };

    const getEmptyStateConfig = () => {
        if (filters.search) {
            return {
                icon: SearchX,
                title: `No leads found for "${filters.search}"`,
                description: 'Try different keywords or check your spelling',
                showClear: true,
            };
        }
        if (hasActiveFilters) {
            return {
                icon: Filter,
                title: 'No leads match your filters',
                description: 'Try adjusting your filter criteria',
                showClear: true,
            };
        }
        return {
            icon: Inbox,
            title: 'No leads yet',
            description: 'Create your first lead to start tracking potential customers',
            showClear: false,
        };
    };

    const emptyState = getEmptyStateConfig();

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
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search leads by title, description..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                                {isSearching && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Filter Controls */}
                        <div className="flex flex-wrap gap-2">
                            {/* Pipeline Stage Filter */}
                            <Select
                                value={filters.pipeline_stage_id?.toString() || 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange('pipeline_stage_id', value)
                                }
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Stages" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Stages</SelectItem>
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

                            {/* Owner Filter */}
                            <Select
                                value={filters.owner_id?.toString() || 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange('owner_id', value)
                                }
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Owners" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Owners</SelectItem>
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

                            {/* Status Filter */}
                            <Select
                                value={filters.status || 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange('status', value)
                                }
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="new">New</SelectItem>
                                    <SelectItem value="contacted">Contacted</SelectItem>
                                    <SelectItem value="qualified">Qualified</SelectItem>
                                    <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                                    <SelectItem value="negotiation">Negotiation</SelectItem>
                                    <SelectItem value="won">Won</SelectItem>
                                    <SelectItem value="lost">Lost</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Clear Filters */}
                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClearFilters}
                                >
                                    Clear {activeFilterCount > 1 && `(${activeFilterCount})`}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Results Count & Per Page Selector */}
                    {leads?.meta?.total !== undefined && (
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div>
                                Showing {leads.data.length} of {leads.meta.total} leads
                            </div>
                            <Select
                                value={(filters.per_page || 15).toString()}
                                onValueChange={handlePerPageChange}
                            >
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="15">15 per page</SelectItem>
                                    <SelectItem value="25">25 per page</SelectItem>
                                    <SelectItem value="50">50 per page</SelectItem>
                                    <SelectItem value="100">100 per page</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Leads Grid */}
                    {leads.data.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {leads.data.map((lead) => (
                                <LeadCard key={lead.id} lead={lead} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-lg border bg-muted/50 py-16 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                <emptyState.icon className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="mt-4 text-lg font-semibold">
                                {emptyState.title}
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground max-w-md">
                                {emptyState.description}
                            </p>
                            <div className="mt-6 flex gap-3">
                                {emptyState.showClear && (
                                    <Button
                                        variant="outline"
                                        onClick={handleClearFilters}
                                    >
                                        Clear Filters
                                    </Button>
                                )}
                                <Button onClick={() => router.visit(route('leads.create'))}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Lead
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Pagination */}
                    {leads?.meta?.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-4">
                            <div className="text-sm text-muted-foreground">
                                Page {leads.meta.current_page} of {leads.meta.last_page}
                            </div>

                            <div className="flex items-center gap-2">
                                <Pagination>
                                    <PaginationContent>
                                        {/* Previous Button */}
                                        <PaginationItem>
                                            <PaginationPrevious
                                                className={
                                                    leads.meta.current_page === 1
                                                        ? 'pointer-events-none opacity-50'
                                                        : 'cursor-pointer'
                                                }
                                                onClick={() => {
                                                    if (leads.meta.current_page > 1) {
                                                        router.get(
                                                            route('leads.index'),
                                                            { 
                                                                ...filters, 
                                                                page: leads.meta.current_page - 1 
                                                            },
                                                            {
                                                                preserveScroll: true,
                                                                preserveState: true,
                                                            },
                                                        );
                                                    }
                                                }}
                                            />
                                        </PaginationItem>

                                        {/* Page Numbers */}
                                        {getPageNumbers(
                                            leads.meta.current_page,
                                            leads.meta.last_page
                                        ).map((page, idx) => (
                                            <PaginationItem key={idx}>
                                                {page === '...' ? (
                                                    <PaginationEllipsis />
                                                ) : (
                                                    <PaginationLink
                                                        isActive={page === leads.meta.current_page}
                                                        onClick={() => {
                                                            router.get(
                                                                route('leads.index'),
                                                                { ...filters, page },
                                                                {
                                                                    preserveScroll: true,
                                                                    preserveState: true,
                                                                },
                                                            );
                                                        }}
                                                    >
                                                        {page}
                                                    </PaginationLink>
                                                )}
                                            </PaginationItem>
                                        ))}

                                        {/* Next Button */}
                                        <PaginationItem>
                                            <PaginationNext
                                                className={
                                                    leads.meta.current_page === leads.meta.last_page
                                                        ? 'pointer-events-none opacity-50'
                                                        : 'cursor-pointer'
                                                }
                                                onClick={() => {
                                                    if (leads.meta.current_page < leads.meta.last_page) {
                                                        router.get(
                                                            route('leads.index'),
                                                            { 
                                                                ...filters, 
                                                                page: leads.meta.current_page + 1 
                                                            },
                                                            {
                                                                preserveScroll: true,
                                                                preserveState: true,
                                                            },
                                                        );
                                                    }
                                                }}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        </div>
                    )}
                </div>
            </AppLayout>
        </>
    );
}