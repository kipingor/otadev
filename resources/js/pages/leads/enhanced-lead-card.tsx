import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InlineEditableField } from '@/components/ui/inline-editable-field';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, DollarSign, User, Calendar } from 'lucide-react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Lead } from '@/types';

interface EnhancedLeadCardProps {
    lead: Lead;
    stageKey?: string;
    onEdit?: (lead: Lead) => void;
    onUpdate?: () => void;
    isDragging?: boolean;
}

export function EnhancedLeadCard({
    lead,
    stageKey,
    onEdit,
    onUpdate,
    isDragging: isDraggingProp,
}: EnhancedLeadCardProps) {
    const containerKey = stageKey ?? lead.pipeline_stage_key ?? 'unknown-stage';
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: lead.id,
        data: { containerId: containerKey },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleFieldUpdate = async (field: string, value: string | number) => {
        return new Promise<void>((resolve, reject) => {
            router.put(
                `/api/v1/leads/${lead.id}`,
                { [field]: value },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Lead updated');
                        onUpdate?.();
                        resolve();
                    },
                    onError: (errors) => {
                        toast.error(errors.message || 'Failed to update lead');
                        reject(new Error('Update failed'));
                    },
                }
            );
        });
    };

    const handleDelete = () => {
        if (confirm(`Delete lead "${lead.title || lead.name}"?`)) {
            router.delete(`/api/v1/leads/${lead.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Lead deleted');
                    onUpdate?.();
                },
                onError: (errors) => {
                    toast.error(errors.message || 'Failed to delete lead');
                },
            });
        }
    };

    return (
        <div ref={setNodeRef} style={style}>
            <Card
                className={cn(
                    'p-3 cursor-move hover:shadow-md transition-shadow',
                    isDragging && 'opacity-50'
                )}
            >
                {/* Header with drag handle */}
                <div {...attributes} {...listeners} className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                        <InlineEditableField
                            value={lead.title || lead.name || 'Untitled'}
                            onSave={(value) => handleFieldUpdate('title', value)}
                            placeholder="Lead title"
                            displayClassName="font-semibold text-sm truncate"
                        />
                        {lead.client_name && (
                            <p className="text-xs text-gray-600 truncate mt-1">{lead.client_name}</p>
                        )}
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MoreVertical className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit?.(lead)}>
                                <Edit className="mr-2 h-3 w-3" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                                <Trash2 className="mr-2 h-3 w-3" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Value */}
                {lead.estimated_value && (
                    <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                        <DollarSign className="h-3 w-3" />
                        <InlineEditableField
                            value={lead.estimated_value}
                            onSave={(value) => handleFieldUpdate('estimated_value', value)}
                            type="number"
                            prefix="$"
                            formatDisplay={(val) => `$${Number(val).toLocaleString()}`}
                            displayClassName="font-medium"
                        />
                    </div>
                )}

                {/* Owner */}
                {lead.owner && (
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                        <User className="h-3 w-3" />
                        <span className="truncate">{lead.owner.name}</span>
                    </div>
                )}
            </Card>
        </div>
    );
}

// Export both enhanced and original for backward compatibility
export default EnhancedLeadCard;