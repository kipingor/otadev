import { Head, router } from '@inertiajs/react';
import api from '@/lib/axios';
import { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, closestCorners,
  useSensor, useSensors, useDroppable,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus, DollarSign, Filter, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingOverlay } from '@/components/ui/loading-state';

interface Lead {
  id: number; title: string; status: string;
  pipeline_stage_id: number; created_at: string;
  owner: { id?: number; name: string; avatar?: string };
}
interface PipelineStage {
  id: number; name: string; key: string; color: string; order: number; leads: Lead[];
}
interface PipelineProps {
  stages: PipelineStage[];
  metrics: { totalLeads: number; totalValue: number; conversionRate: number };
}

function SortableLeadCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: lead.id, data: { type: 'lead' } });
  return (
    <div ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      {...attributes} {...listeners}>
      <Card className="p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
        <h3 className="font-medium text-sm truncate mb-2">{lead.title}</h3>
        <div className="flex items-center gap-1.5">
          <Avatar className="h-5 w-5">
            <AvatarImage src={lead.owner?.avatar} />
            <AvatarFallback className="text-xs">{lead.owner?.name?.charAt(0) ?? '?'}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground truncate">{lead.owner?.name ?? 'Unassigned'}</span>
        </div>
      </Card>
    </div>
  );
}

function PipelineColumn({ stage }: { stage: PipelineStage }) {
  // BUG FIX: use stage.key (string) as droppable id — numeric stage.id collides with lead ids
  const { setNodeRef, isOver } = useDroppable({ id: stage.key });
  const leadCount = stage.leads?.length ?? 0;

  return (
    <div className="flex-shrink-0 w-64">
      <div className={`rounded-xl border h-full flex flex-col shadow-sm transition-colors
        ${isOver ? 'border-blue-400 bg-blue-50/40' : 'border-border bg-card'}`}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: stage.color }} />
              <h2 className="font-semibold text-sm">{stage.name}</h2>
              <Badge variant="secondary">{leadCount}</Badge>
            </div>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
              onClick={() => router.visit(`/leads/create?stage=${stage.id}`)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {/* BUG FIX: SortableContext id matches useDroppable id so containerId propagates */}
        <div ref={setNodeRef} className="flex-1 p-3 overflow-y-auto min-h-[120px]">
          <SortableContext id={stage.key} items={(stage.leads ?? []).map((l) => l.id)}
            strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {(stage.leads ?? []).map((lead) => <SortableLeadCard key={lead.id} lead={lead} />)}
              {leadCount === 0 && (
                <div className="py-10 text-center text-xs text-muted-foreground">Drop leads here</div>
              )}
            </div>
          </SortableContext>
        </div>
      </div>
    </div>
  );
}

export default function PipelineView({ stages, metrics }: PipelineProps) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [columns, setColumns] = useState(stages);
  const [isMoving, setIsMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setColumns(stages); }, [stages]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const handleDragStart = ({ active }: DragStartEvent) => setActiveId(active.id as number);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over) return;

    // BUG FIX: over.id is the droppable KEY (string) when dropped on empty column zone,
    // or the lead's numeric id when dropped on a card — in which case
    // over.data.current?.sortable?.containerId gives us the stage key.
    const targetKey: string =
      (over.data.current?.sortable?.containerId as string | undefined) ??
      (typeof over.id === 'string' ? over.id : null) ??
      columns.find((c) => c.id === over.id)?.key ?? '';

    const sourceCol = columns.find((c) => (c.leads ?? []).some((l) => l.id === active.id));
    const targetCol = columns.find((c) => c.key === targetKey);

    if (!sourceCol || !targetCol || sourceCol.key === targetCol.key) return;

    const snapshot = columns.map((c) => ({ ...c, leads: [...(c.leads ?? [])] }));
    const lead = (sourceCol.leads ?? []).find((l) => l.id === active.id)!;

    setColumns((prev) => prev.map((col) => {
      if (col.key === sourceCol.key) return { ...col, leads: col.leads.filter((l) => l.id !== active.id) };
      if (col.key === targetCol.key) return { ...col, leads: [...col.leads, { ...lead, pipeline_stage_id: targetCol.id }] };
      return col;
    }));

    setIsMoving(true);
    api.put(`/leads/${active.id}/move`, { stage_id: targetCol.id })
      .then(() => toast.success('Lead moved'))
      .catch((err) => {
        setColumns(snapshot);
        const msg = err?.response?.data?.message || 'Failed to move lead';
        setError(msg); toast.error(msg);
      })
      .finally(() => setIsMoving(false));
  };

  const activeLead = activeId ? columns.flatMap((c) => c.leads ?? []).find((l) => l.id === activeId) : null;

  return (
    <>
      <Head title="Pipeline" />
      <AppLayout>
        <div className="min-h-screen bg-muted/30">
          <div className="bg-background border-b px-6 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold">Pipeline</h1>
                <p className="mt-1 text-sm text-muted-foreground">Manage leads through your sales pipeline</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline"><Filter className="h-4 w-4 mr-2" />Filter</Button>
                <Button onClick={() => router.visit('/leads/create')}><Plus className="h-4 w-4 mr-2" />Add Lead</Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-blue-50 p-4"><p className="text-sm font-medium text-blue-800">Total Leads</p><p className="text-2xl font-bold text-blue-900">{metrics.totalLeads}</p></div>
              <div className="rounded-lg bg-green-50 p-4"><p className="text-sm font-medium text-green-800">Pipeline Value</p><p className="text-2xl font-bold text-green-900">${(metrics.totalValue / 1000).toFixed(0)}K</p></div>
              <div className="rounded-lg bg-purple-50 p-4"><p className="text-sm font-medium text-purple-800">Conversion Rate</p><p className="text-2xl font-bold text-purple-900">{metrics.conversionRate}%</p></div>
            </div>
          </div>

          {error && (
            <div className="mx-6 mt-4 rounded-lg bg-destructive/10 border border-destructive/20 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1"><p className="text-sm font-medium">Move failed</p><p className="text-sm text-muted-foreground mt-1">{error}</p></div>
              <Button size="sm" variant="outline" onClick={() => setError(null)}>Dismiss</Button>
            </div>
          )}

          <LoadingOverlay isLoading={isMoving} message="Moving lead...">
            <div className="p-6">
              <DndContext sensors={sensors} collisionDetection={closestCorners}
                onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="flex gap-6 overflow-x-auto pb-6">
                  {columns.map((stage) => <PipelineColumn key={stage.id} stage={stage} />)}
                </div>
                <DragOverlay>
                  {activeLead && (
                    <Card className="p-3 w-64 shadow-2xl rotate-2">
                      <h3 className="font-medium text-sm">{activeLead.title}</h3>
                    </Card>
                  )}
                </DragOverlay>
              </DndContext>
            </div>
          </LoadingOverlay>
        </div>
      </AppLayout>
    </>
  );
}