import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import LeadCard from '@/components/leads/lead-card';
import { Lead, PaginatedData, PipelineStage, User } from '@/types/models';
import { useState, useCallback } from 'react';
import { route } from 'ziggy-js';

interface Props {
    leads: PaginatedData<Lead>;
    filters: {
        owner_id?: number;
        pipeline_stage_id?: number;
        status?: string;
        search?: string;
    };
    pipelineStages?: PipelineStage[];
    users?: User[];
}

export default function LeadsIndex({ 
    leads, 
    filters,
    pipelineStages = [],
    users = []
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    
    const handleFilterChange = useCallback((key: string, value: string) => {
        router.get(route('leads.index'), 
            { ...filters, [key]: value },
            { 
                preserveState: true,
                preserveScroll: true,
            }
        );
    }, [filters]);

    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        handleFilterChange('search', search);
    }, [search, handleFilterChange]);

    return (
        <>
            <Head title="Leads" />
            
            <AppLayout>
                <div className="flex h-full flex-1 flex-col gap-6 p-6">
                    {/* Page Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
                            <p className="text-muted-foreground mt-1">
                                Manage your leads and track potential customers.
                            </p>
                        </div>
                        
                        <Button asChild>
                            <Link href={route('leads.create')}>
                                Create Lead
                            </Link>
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
                                value={filters.pipeline_stage_id?.toString() || ''}
                                onValueChange={(value) => handleFilterChange('pipeline_stage_id', value)}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Stages" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Stages</SelectItem>
                                    {pipelineStages.map((stage) => (
                                        <SelectItem key={stage.id} value={stage.id.toString()}>
                                            {stage.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={filters.owner_id?.toString() || ''}
                                onValueChange={(value) => handleFilterChange('owner_id', value)}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Owners" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Owners</SelectItem>
                                    {users.map((user) => (
                                        <SelectItem key={user.id} value={user.id.toString()}>
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
                            {leads.data.map((lead) => (
                                <LeadCard key={lead.id} lead={lead} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <p className="text-muted-foreground text-lg">
                                No leads found
                            </p>
                            <p className="text-muted-foreground text-sm mt-2">
                                Create your first lead to get started
                            </p>
                            <Button asChild className="mt-4">
                                <Link href={route('leads.create')}>
                                    Create Lead
                                </Link>
                            </Button>
                        </div>
                    )}

                    {/* Pagination */}
                    {leads.meta.last_page > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                            {leads.links.map((link, index) => (
                                <Button
                                    key={index}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() => link.url && router.visit(link.url)}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </AppLayout>
        </>
    );
}