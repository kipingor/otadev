import React, { useState } from 'react';
import { Opportunity, OPPORTUNITY_STAGE_CONFIGS, OpportunityStage } from '@/types/opportunity.types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { InlineEditableField } from '@/components/ui/inline-editable-field';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    MoreVertical,
    Edit,
    Trash2,
    DollarSign,
    Calendar,
    User,
    TrendingUp,
    Award,
    XCircle,
} from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useDeleteConfirmation } from '@/components/ui/confirm-dialog';
// FIX 5 & 9: Use axios (api) instead of Inertia router for REST API calls.
// Inertia's router.put/delete/post triggers a full page transition, not a JSON request.
import api from '@/lib/axios';

interface OpportunityCardEnhancedProps {
    opportunity: Opportunity;
    onEdit?: (opportunity: Opportunity) => void;
    onUpdate?: () => void;
    isDragging?: boolean;
}

export function OpportunityCardEnhanced({
    opportunity,
    onEdit,
    onUpdate,
    isDragging,
}: OpportunityCardEnhancedProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const { confirmDelete, ConfirmDialog } = useDeleteConfirmation();

    const config = OPPORTUNITY_STAGE_CONFIGS[opportunity.stage];

    // FIX 8: `closed_at` is now part of the Opportunity interface.
    const isOverdue =
        opportunity.expected_close_date &&
        !opportunity.closed_at &&
        isPast(parseISO(opportunity.expected_close_date));

    // FIX 5: Use axios for all API mutations instead of Inertia router.
    const handleFieldUpdate = async (field: string, value: string | number): Promise<void> => {
        await api.put(`/opportunities/${opportunity.id}`, { [field]: value });
        toast.success('Updated successfully');
        onUpdate?.();
    };

    const handleDelete = async () => {
        await confirmDelete({
            itemName: opportunity.title,
            onConfirm: async () => {
                setIsDeleting(true);
                try {
                    await api.delete(`/opportunities/${opportunity.id}`);
                    toast.success('Opportunity deleted');
                    onUpdate?.();
                } finally {
                    setIsDeleting(false);
                }
            },
        });
    };

    // FIX 9: Mark-as-won/lost also converted to axios calls.
    const handleMarkAsWon = async () => {
        try {
            await api.post(`/opportunities/${opportunity.id}/mark-won`);
            toast.success('Opportunity marked as won! 🎉');
            onUpdate?.();
        } catch {
            toast.error('Failed to mark as won');
        }
    };

    const handleMarkAsLost = async () => {
        try {
            await api.post(`/opportunities/${opportunity.id}/mark-lost`);
            toast.info('Opportunity marked as lost');
            onUpdate?.();
        } catch {
            toast.error('Failed to mark as lost');
        }
    };

    const stageOptions = Object.values(OpportunityStage).map((stage) => ({
        value: stage,
        label: OPPORTUNITY_STAGE_CONFIGS[stage].label,
    }));

    // FIX 8: Use `estimated_value` (model column) with `amount` as fallback.
    const displayAmount = opportunity.estimated_value ?? opportunity.amount ?? 0;

    return (
        <>
            <Card
                className={cn(
                    'p-4 cursor-move hover:shadow-lg transition-all',
                    isDragging && 'opacity-50',
                    isOverdue && 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30',
                    // FIX 6: `config.isClosed` now exists in the type — this works correctly.
                    config.isClosed && 'opacity-75'
                )}
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            {/* FIX 7: Replaced broken conditional-class block with direct bgClass lookup. */}
                            <span
                                className={cn(
                                    'w-2 h-2 rounded-full flex-shrink-0',
                                    config.color === 'gray'   && 'bg-gray-400',
                                    config.color === 'blue'   && 'bg-blue-500',
                                    config.color === 'orange' && 'bg-orange-500',
                                    config.color === 'green'  && 'bg-green-500',
                                    config.color === 'red'    && 'bg-red-500',
                                )}
                            />
                            {/* FIX 10: Tooltip updated — field opens on single click, not double-click. */}
                            <InlineEditableField
                                value={opportunity.title}
                                onSave={(value) => handleFieldUpdate('title', value)}
                                placeholder="Opportunity title"
                                displayClassName="font-semibold text-sm truncate"
                            />
                        </div>
                        {/* FIX 8: `opportunity.lead` is now typed; optional-chain guards the access. */}
                        {opportunity.lead && (
                            <p className="text-xs text-muted-foreground truncate">
                                {opportunity.lead.title}
                            </p>
                        )}
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit?.(opportunity)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Full Details
                            </DropdownMenuItem>
                            {/* FIX 6: `config.isClosed` now correctly hides these items on closed stages. */}
                            {!config.isClosed && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleMarkAsWon}>
                                        <Award className="mr-2 h-4 w-4 text-green-600" />
                                        Mark as Won
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleMarkAsLost}>
                                        <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                        Mark as Lost
                                    </DropdownMenuItem>
                                </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={handleDelete}
                                className="text-red-600 focus:text-red-600"
                                disabled={isDeleting}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {isDeleting ? 'Deleting…' : 'Delete'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Amount & Stage — Inline Editable */}
                <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-sm gap-2">
                        <div className="flex items-center gap-1 text-foreground flex-1 min-w-0">
                            <DollarSign className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            {/* FIX 8: Use `estimated_value` with `amount` fallback. */}
                            <InlineEditableField
                                value={displayAmount}
                                onSave={(value) => handleFieldUpdate('estimated_value', value)}
                                type="number"
                                formatDisplay={(val) => `$${Number(val).toLocaleString()}`}
                                displayClassName="font-semibold"
                            />
                        </div>
                        <InlineEditableField
                            value={opportunity.stage}
                            onSave={(value) => handleFieldUpdate('stage', value)}
                            type="select"
                            options={stageOptions}
                        />
                    </div>

                    {/* Probability */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Probability</span>
                            <span className="font-medium">{opportunity.probability ?? 0}%</span>
                        </div>
                        <Progress value={opportunity.probability ?? 0} className="h-1.5" />
                    </div>

                    {/* Weighted Value — FIX 8: `weighted_value` now typed; optional-chain used. */}
                    {opportunity.weighted_value != null && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <TrendingUp className="h-3 w-3" />
                            <span>
                                Weighted: ${opportunity.weighted_value.toLocaleString()}
                            </span>
                        </div>
                    )}
                </div>

                {/* Expected Close Date — Inline Editable */}
                {opportunity.expected_close_date && (
                    <div
                        className={cn(
                            'flex items-center gap-1 text-xs mb-2',
                            isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'
                        )}
                    >
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <InlineEditableField
                            value={opportunity.expected_close_date}
                            onSave={(value) => handleFieldUpdate('expected_close_date', value)}
                            type="date"
                            formatDisplay={(val) =>
                                format(parseISO(String(val)), 'MMM d, yyyy') +
                                (isOverdue ? ' (Overdue)' : '')
                            }
                        />
                    </div>
                )}

                {/* Contact — Inline Editable */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                    <User className="h-3 w-3 flex-shrink-0" />
                    <InlineEditableField
                        value={opportunity.contact_name || ''}
                        onSave={(value) => handleFieldUpdate('contact_name', value)}
                        placeholder="Add contact name"
                        displayClassName="truncate"
                    />
                </div>

                {/* Owner — FIX 8: `opportunity.owner` now typed; optional-chain on avatar. */}
                {opportunity.owner && (
                    <div className="flex items-center gap-2 pt-3 border-t">
                        <Avatar className="h-6 w-6">
                            {opportunity.owner.avatar && (
                                <AvatarImage src={opportunity.owner.avatar} />
                            )}
                            <AvatarFallback className="text-xs">
                                {opportunity.owner.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground truncate">
                            {opportunity.owner.name}
                        </span>
                    </div>
                )}
            </Card>

            <ConfirmDialog />
        </>
    );
}