import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/ui/loading-state';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
  } from "@/components/ui/pagination";
import AppLayout from '@/layouts/app-layout';
import LeadCard from '@/pages/leads/lead-card';
import { Lead, PaginatedData, Pipeline, User } from '@/types/models.types';
import { Head, Link, router } from '@inertiajs/react';
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

    return (
        <>
            <Head title="Leads" />

            <AppLayout>
                <div className="flex h-full flex-1 flex-col gap-6 p-6">
                    {/* Page Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                Leads
                            </h1>
                            <p className="mt-1 text-muted-foreground">
                                Manage your leads and track potential customers.
                            </p>
                        </div>

                        <Button asChild>
                            <Link href={'leads/create'}>Create Lead</Link>
                        </Button>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <form onSubmit={handleSearch} className="flex-1">
                            <div className="flex gap-2">
                                <Input
                                    type="search"
                                    placeholder="Search leads..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="flex-1"
                                />
                                <Button type="submit" variant="secondary">
                                    Search
                                </Button>
                            </div>
                        </form>

                        <div className="flex gap-2">
                            <Select
                                value={
                                    filters.pipeline_stage_id?.toString() || ''
                                }
                                onValueChange={(value) =>
                                    handleFilterChange(
                                        'pipeline_stage_id',
                                        value,
                                    )
                                }
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Stages" />
                                </SelectTrigger>
                                <SelectContent>
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
                                    handleFilterChange('owner_id', value)
                                }
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Owners" />
                                </SelectTrigger>
                                <SelectContent>
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
                        </div>
                    </div>

                    {/* Leads Grid */}
                    {leads.data.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {leads.loading ? (
                                <LoadingState variant="card" count={6} />
                            ) : (
                                leads.data.map((lead) => (
                                    <LeadCard key={lead.id} lead={lead} />
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <p className="text-lg text-muted-foreground">
                                No leads found
                            </p>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Create your first lead to get started
                            </p>
                            <Button asChild className="mt-4">
                                <Link href={'leads/create'}>Create Lead</Link>
                            </Button>
                        </div>
                    )}

                    {/* Pagination */}
                    {leads?.meta?.last_page > 1 && (
                        <div className="mt-6 flex items-center justify-center gap-2">
                            <Pagination>
    <PaginationContent>
        <PaginationItem>
            <PaginationPrevious href={prevUrl} />
        </PaginationItem>
        {/* Page numbers */}
        <PaginationItem>
            <PaginationNext href={nextUrl} />
        </PaginationItem>
    </PaginationContent>
</Pagination>

// Add items per page selector
<Select value={perPage} onValueChange={setPerPage}>
    <SelectTrigger>
        <SelectValue />
    </SelectTrigger>
    <SelectContent>
        <SelectItem value="10">10 per page</SelectItem>
        <SelectItem value="25">25 per page</SelectItem>
        <SelectItem value="50">50 per page</SelectItem>
    </SelectContent>
</Select>
</Pagination>
                            {leads.links.map((link, index) => (
                                <Button
                                    key={index}
                                    variant={
                                        link.active ? 'default' : 'outline'
                                    }
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() =>
                                        link.url &&
                                        router.get(
                                            link.url,
                                            {},
                                            {
                                                preserveScroll: true,
                                                preserveState: true,
                                                only: ['leads', 'filters'],
                                            },
                                        )
                                    }
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </AppLayout>
        </>
    );
}
