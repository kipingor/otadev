import React, { useState } from 'react';
import { Opportunity, OPPORTUNITY_STAGE_CONFIGS } from '@/types/opportunity.types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
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
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { useDeleteConfirmation } from '@/components/ui/confirm-dialog';

interface OpportunityCardProps {
    opportunity: Opportunity;
    onEdit?: (opportunity: Opportunity) => void;
    onUpdate?: () => void;
    isDragging?: boolean;
}

export function OpportunityCard({ opportunity, onEdit, onUpdate, isDragging }: OpportunityCardProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const { confirmDelete, ConfirmDialog } = useDeleteConfirmation();
    
    const config = OPPORTUNITY_STAGE_CONFIGS[opportunity.stage];
    const isOverdue = opportunity.expected_close_date && 
                      !config.isClosed && 
                      isPast(parseISO(opportunity.expected_close_date));

    const handleDelete = async () => {
        await confirmDelete({
            itemName: opportunity.title,
            onConfirm: async () => {
                return new Promise<void>((resolve, reject) => {
                    setIsDeleting(true);
                    router.delete(`/api/v1/opportunities/${opportunity.id}`, {
                        preserveScroll: true,
                        onSuccess: () => {
                            toast.success('Opportunity deleted');
                            onUpdate?.();
                            resolve();
                        },
                        onError: (errors) => {
                            toast.error(errors.message || 'Failed to delete opportunity');
                            reject(new Error('Delete failed'));
                        },
                        onFinish: () => {
                            setIsDeleting(false);
                        },
                    });
                });
            },
        });
    };

    const handleMarkAsWon = () => {
        router.post(
            `/api/v1/opportunities/${opportunity.id}/mark-won`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Opportunity marked as won! 🎉');
                    onUpdate?.();
                },
                onError: (errors) => {
                    toast.error(errors.message || 'Failed to mark as won');
                },
            }
        );
    };

    const handleMarkAsLost = () => {
        router.post(
            `/api/v1/opportunities/${opportunity.id}/mark-lost`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.info('Opportunity marked as lost');
                    onUpdate?.();
                },
                onError: (errors) => {
                    toast.error(errors.message || 'Failed to mark as lost');
                },
            }
        );
    };

    return (
        <>
            <Card
                className={cn(
                    'p-4 cursor-move hover:shadow-lg transition-all',
                    isDragging && 'opacity-50',
                    isOverdue && 'border-red-300 bg-red-50',
                    config.isClosed && 'opacity-75'
                )}
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <div
                                className={cn(
                                    'w-2 h-2 rounded-full flex-shrink-0',
                                    config.color === 'gray' && 'bg-gray-400',
                                    config.color === 'blue' && 'bg-blue-500',
                                    config.color === 'orange' && 'bg-orange-500',
                                    config.color === 'green' && 'bg-green-500',
                                    config.color === 'red' && 'bg-red-500'
                                )}
                            />
                            <h4 className="font-semibold text-gray-900 truncate">
                                {opportunity.title}
                            </h4>
                        </div>
                        {opportunity.lead && (
                            <p className="text-xs text-gray-600 truncate">
                                {opportunity.lead.title}
                            </p>
                        )}
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit?.(opportunity)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
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
                                className="text-red-600"
                                disabled={isDeleting}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Amount & Probability */}
                <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-gray-700">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-semibold">
                                ${opportunity.amount?.toLocaleString() || 0}
                            </span>
                        </div>
                        <Badge variant="outline" className="font-mono">
                            {opportunity.probability}%
                        </Badge>
                    </div>

                    {/* Probability Progress Bar */}
                    <Progress value={opportunity.probability} className="h-2" />

                    {/* Weighted Value */}
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                        <TrendingUp className="h-3 w-3" />
                        <span>
                            Weighted: ${opportunity.weighted_value?.toLocaleString() || 0}
                        </span>
                    </div>
                </div>

                {/* Expected Close Date */}
                {opportunity.expected_close_date && (
                    <div className={cn(
                        'flex items-center gap-1 text-xs mb-2',
                        isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'
                    )}>
                        <Calendar className="h-3 w-3" />
                        <span>
                            {format(parseISO(opportunity.expected_close_date), 'MMM d, yyyy')}
                            {isOverdue && ' (Overdue)'}
                        </span>
                    </div>
                )}

                {/* Contact */}
                {opportunity.contact_name && (
                    <div className="flex items-center gap-1 text-xs text-gray-600 mb-3">
                        <User className="h-3 w-3" />
                        <span className="truncate">{opportunity.contact_name}</span>
                    </div>
                )}

                {/* Owner */}
                {opportunity.owner && (
                    <div className="flex items-center gap-2 pt-3 border-t">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={opportunity.owner.avatar} />
                            <AvatarFallback className="text-xs">
                                {opportunity.owner.name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-600 truncate">
                            {opportunity.owner.name}
                        </span>
                    </div>
                )}
            </Card>
            <ConfirmDialog />
        </>
    );
}