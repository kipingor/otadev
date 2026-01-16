import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { 
    ChevronDown, 
    ChevronUp, 
    ChevronsUpDown,
    Search,
    ArrowLeft,
    ArrowRight,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';

interface Column<T> {
    key: string;
    label: string;
    sortable?: boolean;
    render?: (item: T) => React.ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    searchable?: boolean;
    searchPlaceholder?: string;
    isLoading?: boolean;
    emptyState?: {
        title: string;
        description?: string;
        action?: {
            label: string;
            href: string;
        };
    };
    pagination?: {
        currentPage: number;
        totalPages: number;
        perPage: number;
        total: number;
        onPageChange: (page: number) => void;
        onPerPageChange: (perPage: number) => void;
    };
    onRowClick?: (item: T) => void;
}

export function DataTable<T extends Record<string, any>>({
    data,
    columns,
    searchable = false,
    searchPlaceholder = 'Search...',
    isLoading = false,
    emptyState,
    pagination,
    onRowClick,
}: DataTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Filter data based on search
    const filteredData = searchable
        ? data.filter((item) =>
              Object.values(item).some((value) =>
                  String(value).toLowerCase().includes(searchTerm.toLowerCase())
              )
          )
        : data;

    // Sort data
    const sortedData = sortColumn
        ? [...filteredData].sort((a, b) => {
              const aValue = a[sortColumn];
              const bValue = b[sortColumn];

              if (aValue === bValue) return 0;

              const comparison = aValue > bValue ? 1 : -1;
              return sortDirection === 'asc' ? comparison : -comparison;
          })
        : filteredData;

    // Handle sort
    const handleSort = (columnKey: string) => {
        if (sortColumn === columnKey) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(columnKey);
            setSortDirection('asc');
        }
    };

    // Loading state
    if (isLoading) {
        return <LoadingState variant="table" />;
    }

    // Empty state
    if (!isLoading && sortedData.length === 0 && !searchTerm) {
        if (emptyState) {
            return (
                <EmptyState
                    title={emptyState.title}
                    description={emptyState.description}
                    action={emptyState.action}
                />
            );
        }
        return (
            <EmptyState
                title="No data available"
                description="There are no items to display"
            />
        );
    }

    return (
        <div className="space-y-4">
            {/* Search */}
            {searchable && (
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((column) => (
                                <TableHead
                                    key={column.key}
                                    className={column.className}
                                >
                                    {column.sortable ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="-ml-3 h-8"
                                            onClick={() => handleSort(column.key)}
                                        >
                                            {column.label}
                                            {sortColumn === column.key ? (
                                                sortDirection === 'asc' ? (
                                                    <ChevronUp className="ml-2 h-4 w-4" />
                                                ) : (
                                                    <ChevronDown className="ml-2 h-4 w-4" />
                                                )
                                            ) : (
                                                <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground/50" />
                                            )}
                                        </Button>
                                    ) : (
                                        column.label
                                    )}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedData.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results found for "{searchTerm}"
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedData.map((item, index) => (
                                <TableRow
                                    key={index}
                                    className={onRowClick ? 'cursor-pointer' : ''}
                                    onClick={() => onRowClick?.(item)}
                                >
                                    {columns.map((column) => (
                                        <TableCell
                                            key={column.key}
                                            className={column.className}
                                        >
                                            {column.render
                                                ? column.render(item)
                                                : item[column.key]}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {pagination && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Showing{' '}
                        <span className="font-medium">
                            {(pagination.currentPage - 1) * pagination.perPage + 1}
                        </span>{' '}
                        to{' '}
                        <span className="font-medium">
                            {Math.min(
                                pagination.currentPage * pagination.perPage,
                                pagination.total
                            )}
                        </span>{' '}
                        of <span className="font-medium">{pagination.total}</span> results
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Per page selector */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Rows per page:</span>
                            <Select
                                value={pagination.perPage.toString()}
                                onValueChange={(value) =>
                                    pagination.onPerPageChange(parseInt(value))
                                }
                            >
                                <SelectTrigger className="w-16">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Page navigation */}
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                                disabled={pagination.currentPage === 1}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm text-muted-foreground px-2">
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                                disabled={pagination.currentPage === pagination.totalPages}
                            >
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}