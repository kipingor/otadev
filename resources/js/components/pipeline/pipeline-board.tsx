import { useCallback } from "react";
import {
    DndContext,
    PointerSensor,
    closestCenter,
    type DragEndEvent,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { type Lead, type PipelineStage } from "@/types";
import { usePipeline } from "@/hooks/use-pipeline";
import SortableLeadCard from "./sortable-lead-card";

type PipelineBoardProps = {
    stages?: PipelineStage[];
    leadsByStage?: Record<string, Lead[]>;
};

export default function PipelineBoard({
    stages: initialStages = [],
    leadsByStage = {},
}: PipelineBoardProps) {
    const { stages, itemsByStage, loading, error, moveLead } = usePipeline({
        stages: initialStages,
        leadsByStage,
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 6 },
        })
    );

    const handleDragEnd = useCallback(
        async (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over) return;

            const destination =
                over.data.current?.sortable?.containerId ??
                over.data.current?.containerId;
            const origin =
                active.data.current?.sortable?.containerId ??
                active.data.current?.containerId;

            if (!destination || destination === origin) return;

            await moveLead({
                leadId: active.id as string | number,
                toStageKey: destination,
            });
        },
        [moveLead]
    );

    if (loading) {
        return <div className="p-4 text-muted-foreground">Loading pipeline…</div>;
    }

    if (error) {
        return (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
            </div>
        );
    }

    if (!stages.length) {
        return (
            <div className="p-6 text-center text-sm text-muted-foreground">
                No pipeline stages available.
            </div>
        );
    }

    return (
        <div className="flex gap-4 overflow-x-auto p-4">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                {stages.map((stage) => {
                    const leads = itemsByStage[stage.key] ?? [];
                    const sortableItems = leads.map((lead) => lead.id);

                    return (
                        <SortableContext
                            key={stage.key}
                            id={stage.key}
                            items={sortableItems}
                            strategy={verticalListSortingStrategy}
                        >
                            <PipelineColumn stage={stage} leads={leads} />
                        </SortableContext>
                    );
                })}
            </DndContext>
        </div>
    );
}

type PipelineColumnProps = {
    stage: PipelineStage;
    leads: Lead[];
};

function PipelineColumn({ stage, leads }: PipelineColumnProps) {
    return (
        <div className="flex w-48 shrink-0 flex-col rounded-xl border bg-background/60 p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm font-medium">
                <span>{stage.name}</span>
                <span className="text-muted-foreground">{leads.length}</span>
            </div>

            <div className="mt-4 flex flex-1 flex-col gap-2">
                {leads.length ? (
                    leads.map((lead) => (
                        <SortableLeadCard
                            key={lead.id}
                            lead={lead}
                            stageKey={stage.key}
                        />
                    ))
                ) : (
                    <div className="rounded-lg border border-dashed border-muted p-4 text-center text-xs text-muted-foreground">
                        No leads yet
                    </div>
                )}
            </div>
        </div>
    );
}

