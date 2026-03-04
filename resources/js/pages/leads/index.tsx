import { Head, router } from '@inertiajs/react';
import { useCallback, useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import {
  Plus,
  Search,
  Filter,
  LayoutGrid,
  LayoutList,
  Download,
  MoreVertical,
  Eye,
  Edit,
  Archive,
  Trash2,
  Star,
  StarOff,
  Inbox,
  SearchX,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingOverlay, LeadCardSkeleton } from '@/components/ui/loading-state';
import { useDeleteConfirmation, useConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatDistanceToNow } from 'date-fns';
import { Lead, PaginatedData, Pipeline, User } from '@/types/models.types';
import { useDebounce } from '@/hooks/use-debounce';
import { route } from 'ziggy-js';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';


interface LeadsIndexProps {
  leads: PaginatedData<Lead>;
  filters: {
    search?: string;
    status?: string;
    owner_id?: number;
    stage_id?: number;
    pipeline_stage_id?: number;
  };
  users?: User[];
  pipelineStages?: Pipeline[];
}

export default function LeadsIndex({
  leads,
  filters,
  users,
  pipelineStages = [],
}: LeadsIndexProps) {
  const [search, setSearch] = useState(filters.search || '');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 500);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  
  // Delete confirmation hook
  const { confirmDelete, ConfirmDialog: DeleteConfirmDialog } = useDeleteConfirmation();
  const { confirm: confirmAction, ConfirmDialog: ActionConfirmDialog } = useConfirmDialog();

  // Handle errors from Inertia
  useEffect(() => {
    const handleInertiaError = (event: any) => {
      setError(event.detail?.errors?.message || 'An error occurred while loading data');
      setIsLoading(false);
      setIsSearching(false);
    };

    window.addEventListener('inertia:error', handleInertiaError);
    return () => window.removeEventListener('inertia:error', handleInertiaError);
  }, []);

  // Auto-search with debouncing
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setIsSearching(true);
      setError(null);
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
          onError: (errors) => {
            setError(errors.message || 'Failed to search leads');
            setIsSearching(false);
          },
        },
      );
    }
  }, [debouncedSearch]);

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      setIsLoading(true);
      setError(null);
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
          onFinish: () => setIsLoading(false),
          onError: (errors) => {
            setError(errors.message || 'Failed to apply filters');
            setIsLoading(false);
          },
        },
      );
    },
    [filters],
  );

  const handlePerPageChange = useCallback(
    (value: string) => {
      setIsLoading(true);
      setError(null);
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
          onFinish: () => setIsLoading(false),
          onError: (errors) => {
            setError(errors.message || 'Failed to change page size');
            setIsLoading(false);
          },
        },
      );
    },
    [filters],
  );

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setIsLoading(true);
    setError(null);
    router.visit(route('leads.index'), {
      replace: true,
      preserveState: false,
      onFinish: () => setIsLoading(false),
      onError: (errors) => {
        setError(errors.message || 'Failed to clear filters');
        setIsLoading(false);
      },
    });
  }, []);

  // Delete lead handler with confirmation
  const handleDeleteLead = useCallback(async (lead: Lead) => {
    const confirmed = await confirmDelete({
      itemName: lead.title,
      onConfirm: async () => {
        return new Promise<void>((resolve, reject) => {
          router.delete(`/api/v1/leads/${lead.id}`, {
            preserveScroll: true,
            onSuccess: () => {
              toast.success('Lead deleted successfully');
              resolve();
            },
            onError: (errors) => {
              toast.error(errors.message || 'Failed to delete lead');
              reject(new Error('Delete failed'));
            },
          });
        });
      },
    });
  }, [confirmDelete]);

  // Bulk delete with confirmation
  const handleBulkDelete = useCallback(async () => {
    const confirmed = await confirmDelete({
      itemName: `${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''}`,
      customDescription: `Are you sure you want to delete ${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''}? This action cannot be undone.`,
      onConfirm: async () => {
        return new Promise<void>((resolve, reject) => {
          setIsLoading(true);
          router.post(
            '/api/v1/leads/bulk-delete',
            { lead_ids: selectedLeads },
            {
              preserveScroll: true,
              onSuccess: () => {
                toast.success(`${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''} deleted successfully`);
                setSelectedLeads([]);
                resolve();
              },
              onError: (errors) => {
                toast.error(errors.message || 'Failed to delete leads');
                reject(new Error('Delete failed'));
              },
              onFinish: () => {
                setIsLoading(false);
              },
            }
          );
        });
      },
    });
  }, [selectedLeads, confirmDelete]);

  // Bulk archive with confirmation
  const handleBulkArchive = useCallback(async () => {
    const confirmed = await confirmAction({
      title: 'Archive Leads',
      description: `Archive ${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''}? You can restore them later.`,
      confirmLabel: 'Archive',
      variant: 'warning',
      onConfirm: async () => {
        return new Promise<void>((resolve, reject) => {
          setIsLoading(true);
          router.post(
            '/api/v1/leads/bulk-archive',
            { lead_ids: selectedLeads },
            {
              preserveScroll: true,
              onSuccess: () => {
                toast.success(`${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''} archived successfully`);
                setSelectedLeads([]);
                resolve();
              },
              onError: (errors) => {
                toast.error(errors.message || 'Failed to archive leads');
                reject(new Error('Archive failed'));
              },
              onFinish: () => {
                setIsLoading(false);
              },
            }
          );
        });
      },
    });
  }, [selectedLeads, confirmAction]);

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

  // Bulk selection handlers
  const handleSelectLead = useCallback((leadId: number) => {
    setSelectedLeads(prev =>
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedLeads(leads.data.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  }, [leads.data]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string; dot: string }> = {
      new: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
      contacted: { bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500' },
      qualified: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
      proposal_sent: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
      negotiation: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
      won: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
      lost: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
      archived: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' },
    };
    return colors[status] || colors.new;
  };

  const LeadCardView = ({ lead }: { lead: Lead }) => {
    const statusColors = getStatusColor(lead.status);
    const isSelected = selectedLeads.includes(lead.id);

    return (
      <Card
        className={`group relative overflow-hidden transition-all hover:shadow-lg ${isSelected ? 'ring-2 ring-primary-500 ring-offset-2' : ''
          }`}
      >
        {/* Selection Checkbox */}
        <div className="absolute top-4 left-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => handleSelectLead(lead.id)}
            className="bg-white shadow-sm"
          />
        </div>

        {/* Star Button */}
        <button
          className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            router.post(
              `/api/v1/leads/${lead.id}/toggle-star`,
              {},
              {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                  toast.success(
                    lead.is_starred ? 'Removed from starred' : 'Added to starred'
                  );
                },
                onError: () => {
                  toast.error('Failed to update starred status');
                },
              }
            );
          }}
          aria-label={lead.is_starred ? 'Remove from starred' : 'Add to starred'}
        >
          {lead.is_starred ? (
            <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
          ) : (
            <StarOff className="h-5 w-5 text-gray-400 hover:text-amber-500" />
          )}
        </button>

        <div
          className="p-6 cursor-pointer"
          onClick={() => router.visit(`/leads/${lead.id}`)}
        >
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm">
              <AvatarImage src={lead.owner.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                {lead.owner.name.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-gray-900 truncate group-hover:text-primary-700 transition-colors">
                {lead.title}
              </h3>
              <p className="text-sm text-gray-600">
                {lead.owner.name}
              </p>
            </div>
          </div>

          {/* Description */}
          {lead.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-4">
              {lead.description}
            </p>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className={`${statusColors.bg} ${statusColors.text} border-0`}>
              <span className={`h-1.5 w-1.5 rounded-full ${statusColors.dot} mr-1.5`} />
              {lead.status.replace('_', ' ')}
            </Badge>
            <Badge variant="outline" className="border-gray-300">
              {lead.pipeline_stage.name}
            </Badge>
            {lead.metadata?.source && (
              <Badge variant="outline" className="border-gray-300">
                {lead.metadata.source}
              </Badge>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
            </p>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.visit(`/leads/${lead.id}`)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.visit(`/leads/${lead.id}/edit`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit lead
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteLead(lead);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <>
      <Head title="Leads" />

      <AppLayout>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b border-gray-200">
            <div className="px-6 py-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Manage and track all your leads in one place
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {/* Handle export */ }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button onClick={() => router.visit('/leads/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Lead
                  </Button>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search leads by title, description..."
                    className="pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  )}
                </div>

                <Select value={filters.pipeline_stage_id?.toString() || 'all'}
                  onValueChange={(value) =>
                    handleFilterChange('pipeline_stage_id', value)
                  }
                >
                  <SelectTrigger className="w-40">
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
                  <SelectTrigger className="w-40">
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
                  <SelectTrigger className="w-40">
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

                <div className="flex items-center border border-gray-200 rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <LayoutList className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mx-6 mt-6">
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-900">Error Loading Leads</h3>
                    <p className="text-sm text-red-800 mt-1">{error}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setError(null);
                      router.reload();
                    }}
                    className="flex-shrink-0"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          )}

          <LoadingOverlay isLoading={isLoading} message="Loading leads...">
            <div className="px-6 py-6">
            {/* Bulk Actions Bar */}
            {selectedLeads.length > 0 && (
              <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={selectedLeads.length === leads.data.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium text-primary-900">
                    {selectedLeads.length} lead{selectedLeads.length !== 1 ? 's' : ''} selected
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    Change Status
                  </Button>
                  <Button variant="outline" size="sm">
                    Assign Owner
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleBulkArchive}
                    disabled={isLoading}
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={handleBulkDelete}
                    disabled={isLoading}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            )}

            {/* Results Count */}
            {leads?.meta?.total !== undefined && (
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-medium text-gray-900">{leads.data.length}</span> of{' '}
                  <span className="font-medium text-gray-900">{leads.meta.total}</span> leads
                </p>

                <Select defaultValue="created_at">
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Recently added</SelectItem>
                    <SelectItem value="updated_at">Recently updated</SelectItem>
                    <SelectItem value="title">Name (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Leads Grid/List */}
            {leads.data.length > 0 ? (
              <div className={viewMode === 'grid'
                ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3'
                : 'space-y-4'
              }>
                {leads.data.map((lead) => (
                  <LeadCardView key={lead.id} lead={lead} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Search}
                title="No leads found"
                description="Try adjusting your filters or create a new lead to get started"
                action={{
                  label: 'Create Lead',
                  href: '/leads/create',
                }}
              />
            )}

            {/* Pagination */}
            {leads?.meta?.last_page > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={leads.meta.current_page === 1}
                  onClick={() => router.visit(`/leads?page=${leads.meta.current_page - 1}`)}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, leads.meta.last_page) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={page === leads.meta.current_page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => router.visit(`/leads?page=${page}`)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  disabled={leads.meta.current_page === leads.meta.last_page}
                  onClick={() => router.visit(`/leads?page=${leads.meta.current_page + 1}`)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
          </LoadingOverlay>
        </div>
        
        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog />
        
        {/* Archive Confirmation Dialog */}
        <ActionConfirmDialog />
      </AppLayout>
    </>
  );
}