import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { OpportunityCardEnhanced } from './opportunity-card-enhanced';
import { QuickAddCard } from '@/components/ui/quick-add-card';
import { Badge } from '@/components/ui/badge';
import type { Opportunity } from '@/types/opportunity.types';
import { OpportunityKanbanColumn as KanbanColumnData, OPPORTUNITY_STAGE_CONFIGS } from '@/types/opportunity.types';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

interface OpportunityKanbanColumnProps {
    column: KanbanColumnData;
    onEditOpportunity: (opportunity: Opportunity) => void;
    onUpdate: () => void;
}

function SortableOpportunityCard({
    opportunity,
    onEdit,
    onUpdate,
}: {
    opportunity: Opportunity;
    onEdit: (opp: Opportunity) => void;
    onUpdate: () => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: opportunity.id.toString() });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
        >
            <OpportunityCardEnhanced
                opportunity={opportunity}
                onEdit={onEdit}
                onUpdate={onUpdate}
                isDragging={isDragging}
            />
        </div>
    );
}

export function OpportunityKanbanColumn({
    column,
    onEditOpportunity,
    onUpdate,
}: OpportunityKanbanColumnProps) {
    const { setNodeRef } = useDroppable({
        id: column.stage,
    });

    const config = OPPORTUNITY_STAGE_CONFIGS[column.stage];

    const handleQuickAdd = async (title: string) => {
        return new Promise<void>((resolve, reject) => {
            router.post(
                '/api/v1/opportunities',
                {
                    title,
                    stage: column.stage,
                    amount: 0,
                    probability: config.defaultProbability,
                    lead_id: 1, // TODO: Make this configurable or prompt
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Opportunity added');
                        onUpdate();
                        resolve();
                    },
                    onError: (errors) => {
                        toast.error(errors.message || 'Failed to add opportunity');
                        reject(new Error('Failed to add'));
                    },
                }
            );
        });
    };

    return (
        <div
            ref={setNodeRef}
            className="flex-shrink-0 w-80 bg-gray-50 rounded-lg p-4"
        >
            {/* Column Header */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div
                            className={cn(
                                'w-3 h-3 rounded-full',
                                config.color === 'gray' && 'bg-gray-400',
                                config.color === 'blue' && 'bg-blue-500',
                                config.color === 'orange' && 'bg-orange-500',
                                config.color === 'green' && 'bg-green-500',
                                config.color === 'red' && 'bg-red-500'
                            )}
                        />
                        <h3 className="font-semibold text-gray-900">{config.label}</h3>
                        <Badge variant="outline">{column.total_count}</Badge>
                    </div>
                </div>

                {/* Column Stats */}
                <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                        <span>Total Value:</span>
                        <span className="font-medium">
                            ${column.total_value.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Weighted:</span>
                        <span className="font-medium">
                            ${column.weighted_value.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Opportunities List */}
            <div className="space-y-3 mb-3 max-h-[calc(100vh-320px)] overflow-y-auto">
                {column.opportunities.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        No opportunities in this stage
                    </div>
                ) : (
                    column.opportunities.map((opportunity) => (
                        <SortableOpportunityCard
                            key={opportunity.id}
                            opportunity={opportunity}
                            onEdit={onEditOpportunity}
                            onUpdate={onUpdate}
                        />
                    ))
                )}
            </div>

            {/* Quick Add Card */}
            <QuickAddCard
                onAdd={handleQuickAdd}
                placeholder={`Add ${config.label.toLowerCase()} opportunity...`}
                buttonText="Add Opportunity"
            />
        </div>
    );
}