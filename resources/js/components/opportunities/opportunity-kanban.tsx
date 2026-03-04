import React, { useState, useEffect } from 'react';
import {
    DndContext,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { OpportunityCard } from './opportunity-card';
import { OpportunityFormModal } from './opportunity-form-modal';
import { OpportunityKanbanColumn } from './opportunity-kanban-column';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Plus, Search, RefreshCw, Target } from 'lucide-react';
import { Opportunity, OpportunityStage, OpportunityKanbanColumn as KanbanColumnData } from '@/types/opportunity.types';
import axios from 'axios';
import { toast } from 'sonner';
import { router } from '@inertiajs/react';

interface OpportunityKanbanProps {
    className?: string;
}

export function OpportunityKanban({ className }: OpportunityKanbanProps) {
    const [kanbanData, setKanbanData] = useState<Record<string, KanbanColumnData>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | undefined>();
    const [newOpportunityStage, setNewOpportunityStage] = useState<OpportunityStage | undefined>();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const fetchKanbanData = async (showRefreshing = false) => {
        if (showRefreshing) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }
        setError(null);

        try {
            const params: any = {};
            if (searchQuery) params.search = searchQuery;

            const response = await axios.get('/api/v1/opportunities/kanban', { params });

            if (response.data.success) {
                setKanbanData(response.data.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load opportunities');
            toast.error('Failed to load opportunities');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchKanbanData();
    }, [searchQuery]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const opportunityId = active.id;
        const newStage = over.id as OpportunityStage;

        // Find the opportunity
        let opportunity: Opportunity | undefined;
        for (const column of Object.values(kanbanData)) {
            opportunity = column.opportunities.find((opp) => opp.id.toString() === opportunityId);
            if (opportunity) break;
        }

        if (!opportunity || opportunity.stage === newStage) return;

        // Optimistic update
        const updatedData = { ...kanbanData };
        
        // Remove from old column
        const oldColumn = updatedData[opportunity.stage];
        oldColumn.opportunities = oldColumn.opportunities.filter(
            (opp) => opp.id.toString() !== opportunityId
        );
        oldColumn.total_count--;
        oldColumn.total_value -= opportunity.amount;
        oldColumn.weighted_value -= opportunity.weighted_value || 0;

        // Add to new column
        const newColumn = updatedData[newStage];
        const updatedOpportunity = { ...opportunity, stage: newStage };
        newColumn.opportunities.push(updatedOpportunity);
        newColumn.total_count++;
        newColumn.total_value += opportunity.amount;
        newColumn.weighted_value += opportunity.weighted_value || 0;

        setKanbanData(updatedData);

        // Make API call
        router.post(
            `/api/v1/opportunities/${opportunityId}/move-stage`,
            { stage: newStage },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Opportunity moved successfully');
                    fetchKanbanData(true);
                },
                onError: (errors) => {
                    toast.error(errors.message || 'Failed to move opportunity');
                    // Revert optimistic update
                    fetchKanbanData(true);
                },
            }
        );
    };

    const handleAddOpportunity = (stage?: OpportunityStage) => {
        setNewOpportunityStage(stage);
        setEditingOpportunity(undefined);
        setIsFormOpen(true);
    };

    const handleEditOpportunity = (opportunity: Opportunity) => {
        setEditingOpportunity(opportunity);
        setNewOpportunityStage(undefined);
        setIsFormOpen(true);
    };

    const handleFormSuccess = () => {
        fetchKanbanData(true);
    };

    const handleRefresh = () => {
        fetchKanbanData(true);
    };

    // Get the active opportunity for drag overlay
    const activeOpportunity = activeId
        ? Object.values(kanbanData)
              .flatMap((col) => col.opportunities)
              .find((opp) => opp.id.toString() === activeId)
        : null;

    if (isLoading && Object.keys(kanbanData).length === 0) {
        return <LoadingState />;
    }

    if (error && Object.keys(kanbanData).length === 0) {
        return (
            <EmptyState
                icon={Target}
                title="Failed to load opportunities"
                description={error}
                action={
                    <Button onClick={() => fetchKanbanData()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                    </Button>
                }
            />
        );
    }

    const totalOpportunities = Object.values(kanbanData).reduce(
        (sum, col) => sum + col.total_count,
        0
    );
    const totalValue = Object.values(kanbanData).reduce(
        (sum, col) => sum + col.total_value,
        0
    );
    const totalWeightedValue = Object.values(kanbanData).reduce(
        (sum, col) => sum + col.weighted_value,
        0
    );

    return (
        <div className={className}>
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Opportunities Pipeline</h1>
                        <p className="text-gray-600 mt-1">
                            {totalOpportunities} opportunities • ${totalValue.toLocaleString()} total • $
                            {totalWeightedValue.toLocaleString()} weighted
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                        >
                            <RefreshCw
                                className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
                            />
                            Refresh
                        </Button>
                        <Button onClick={() => handleAddOpportunity()}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Opportunity
                        </Button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search opportunities..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Kanban Board */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {Object.values(OpportunityStage).map((stage) => {
                        const column = kanbanData[stage] || {
                            stage,
                            label: stage,
                            color: 'gray',
                            opportunities: [],
                            total_count: 0,
                            total_value: 0,
                            weighted_value: 0,
                        };

                        return (
                            <SortableContext
                                key={stage}
                                items={column.opportunities.map((opp) => opp.id.toString())}
                                strategy={verticalListSortingStrategy}
                            >
                                <OpportunityKanbanColumn
                                    column={column}
                                    onAddOpportunity={() => handleAddOpportunity(stage)}
                                    onEditOpportunity={handleEditOpportunity}
                                    onUpdate={handleFormSuccess}
                                />
                            </SortableContext>
                        );
                    })}
                </div>

                <DragOverlay>
                    {activeOpportunity ? (
                        <OpportunityCard opportunity={activeOpportunity} isDragging />
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Form Modal */}
            <OpportunityFormModal
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                opportunity={
                    editingOpportunity ||
                    (newOpportunityStage ? ({ stage: newOpportunityStage } as any) : undefined)
                }
                onSuccess={handleFormSuccess}
            />
        </div>
    );
}