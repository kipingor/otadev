import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Lead } from '@/types/models.types';
import { router } from '@inertiajs/react';
import { MoreVertical, Eye, Edit, Archive, Trash, Calendar, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { formatDistanceToNow } from 'date-fns';

interface LeadCardProps {
    lead: Lead;
}

export default function LeadCard({ lead }: LeadCardProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

    const handleView = () => {
        router.visit(route('leads.show', lead.id));
    };

    const handleEdit = () => {
        router.visit(route('leads.edit', lead.id));
    };

    const handleArchive = () => {
        router.post(
            route('api.leads.transition', lead.id),
            { status: 'archived' },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Lead archived successfully');
                    setArchiveDialogOpen(false);
                },
                onError: () => {
                    toast.error('Failed to archive lead');
                },
            }
        );
    };

    const handleDelete = () => {
        router.delete(route('leads.destroy', lead.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Lead deleted successfully');
                setDeleteDialogOpen(false);
            },
            onError: () => {
                toast.error('Failed to delete lead');
            },
        });
    };

    const getStatusVariant = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            new: 'default',
            contacted: 'secondary',
            qualified: 'secondary',
            proposal_sent: 'secondary',
            negotiation: 'secondary',
            won: 'default',
            lost: 'destructive',
            archived: 'outline',
        };
        return variants[status] || 'outline';
    };

    const getTypeLabel = (type: string) => {
        return type === 'document' ? 'Document' : 'Conversation';
    };

    return (
        <>
            <Card 
                className="group hover:shadow-md transition-shadow cursor-pointer"
                onClick={handleView}
            >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                    <div className="flex-1 space-y-1 min-w-0">
                        <CardTitle className="text-base line-clamp-1">
                            {lead.title}
                        </CardTitle>
                        <CardDescription className="text-xs">
                            {getTypeLabel(lead.type)}
                        </CardDescription>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleView();
                            }}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleEdit();
                            }}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Lead
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setArchiveDialogOpen(true);
                                }}
                            >
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteDialogOpen(true);
                                }}
                            >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
                
                <CardContent className="space-y-3">
                    {/* Description */}
                    {lead.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {lead.description}
                        </p>
                    )}

                    {/* Status and Pipeline Stage */}
                    <div className="flex flex-wrap gap-2">
                        <Badge variant={getStatusVariant(lead.status)}>
                            {lead.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                        {lead.pipeline_stage && (
                            <Badge variant="outline">
                                {lead.pipeline_stage.name}
                            </Badge>
                        )}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                        <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="truncate max-w-[120px]">
                                {lead.owner?.name || 'Unassigned'}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                                {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Archive Confirmation Dialog */}
            <ConfirmDialog
                open={archiveDialogOpen}
                onOpenChange={setArchiveDialogOpen}
                title="Archive Lead"
                description={`Are you sure you want to archive "${lead.title}"? You can restore it later.`}
                confirmLabel="Archive"
                cancelLabel="Cancel"
                onConfirm={handleArchive}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Lead"
                description={`Are you sure you want to delete "${lead.title}"? This action cannot be undone.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                variant="danger"
                onConfirm={handleDelete}
            />
        </>
    );
}