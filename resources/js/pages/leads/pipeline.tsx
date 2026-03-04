import { Head, router } from '@inertiajs/react';
import api from '@/lib/axios';
import { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Plus,
  MoreVertical,
  Calendar,
  DollarSign,
  TrendingUp,
  Filter,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { PipelineColumnSkeleton, LoadingOverlay } from '@/components/ui/loading-state';

// ✅ FIXED: Proper interfaces matching backend response
interface Lead {
  id: number;
  title: string;
  status: string;
  pipeline_stage_id: number;
  created_at: string;
  owner: {
    id?: number;
    name: string;
    email?: string;
    avatar?: string;
  };
}

interface PipelineStage {
  id: number;
  name: string;
  key: string;
  color: string;
  order: number;
  leads: Lead[];
}

interface PipelineProps {
  stages: PipelineStage[];
  metrics: {
    totalLeads: number;
    totalValue: number;
    conversionRate: number;
  };
  leads: number; // Total count for reference
}

function SortableLeadCard({ lead }: { lead: Lead }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group"
    >
      <Card
        className="p-4 hover:shadow-lg transition-all cursor-grab active:cursor-grabbing border-l-4"
        style={{ borderLeftColor: getStatusColor(lead.status) }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-medium text-sm text-gray-900 flex-1 line-clamp-2">
            {lead.title}
          </h3>
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              // Handle more options
            }}
          >
            <MoreVertical className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <Avatar className="h-6 w-6">
            <AvatarImage src={lead.owner?.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
              {lead.owner?.name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>

          {lead.created_at && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              {new Date(lead.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function PipelineColumn({ stage }: { stage: PipelineStage }) {
  // ✅ FIXED: Proper null checks and calculations
  const totalValue = (stage.leads?.length ?? 0) * 5000; // Example: $5k per lead
  const leadCount = stage.leads?.length ?? 0;

  return (
    <div className="flex-shrink-0 w-60">
      <div className="bg-white rounded-xl border border-gray-200 h-full flex flex-col shadow-sm">
        {/* Column Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: stage.color }}
              />
              <h2 className="font-semibold text-gray-900">{stage.name}</h2>
              {/* ✅ FIXED: Use leadCount instead of leads.length */}
              <Badge variant="secondary" className="ml-1">
                {leadCount}
              </Badge>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => {
                router.visit(`/leads/create?stage=${stage.id}`);
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Stage Metrics */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-gray-600">
              <DollarSign className="h-3.5 w-3.5" />
              <span className="font-medium">
                ${(totalValue / 1000).toFixed(0)}K
              </span>
            </div>
            {leadCount > 0 && (
              <div className="flex items-center gap-1 text-gray-600">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="text-xs">
                  ${(totalValue / leadCount / 1000).toFixed(1)}K avg
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Column Content */}
        <div className="flex-1 p-3 overflow-y-auto">
          <SortableContext
            items={(stage.leads ?? []).map((l) => l.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {(stage.leads ?? []).map((lead) => (
                <SortableLeadCard key={lead.id} lead={lead} />
              ))}

              {leadCount === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Plus className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">No leads yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Drag leads here or create new
                  </p>
                </div>
              )}
            </div>
          </SortableContext>
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    new: '#3b82f6',
    contacted: '#06b6d4',
    qualified: '#10b981',
    proposal_sent: '#8b5cf6',
    negotiation: '#f59e0b',
    won: '#059669',
    lost: '#ef4444',
    archived: '#6b7280',
  };
  return colors[status] || '#6b7280';
}

export default function PipelineView({ stages, metrics }: PipelineProps) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [columns, setColumns] = useState(stages);
  const [isMoving, setIsMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    })
  );

  // Handle errors from Inertia
  useEffect(() => {
    const handleInertiaError = (event: any) => {
      setError(event.detail?.errors?.message || 'Failed to move lead');
      setIsMoving(false);
    };

    window.addEventListener('inertia:error', handleInertiaError);
    return () => window.removeEventListener('inertia:error', handleInertiaError);
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeStageIndex = columns.findIndex((col) =>
      (col.leads ?? []).some((lead) => lead.id === active.id)
    );

    const overStageIndex = columns.findIndex((col) => col.id === over.id);

    if (activeStageIndex === -1 || overStageIndex === -1) return;
    if (activeStageIndex === overStageIndex) return;

    // Store original state for rollback
    const originalColumns = [...columns];

    // Update optimistically
    const newColumns = [...columns];
    const lead = (newColumns[activeStageIndex].leads ?? []).find(
      (l) => l.id === active.id
    );

    if (lead) {
      // Remove from old stage
      newColumns[activeStageIndex].leads = (
        newColumns[activeStageIndex].leads ?? []
      ).filter((l) => l.id !== active.id);

      // Add to new stage
      newColumns[overStageIndex].leads = [
        ...(newColumns[overStageIndex].leads ?? []),
        lead,
      ];
      setColumns(newColumns);
      setIsMoving(true);
      setError(null);

      // Fix: use axios (api) not Inertia router — Inertia routes through the web
      // router which only has GET/POST on 'pipelines', causing 405 errors.
      api.put(`/leads/${active.id}/move`, {
        stage_id: newColumns[overStageIndex].id,  // backend expects 'stage_id'
      })
        .then(() => {
          toast.success('Lead moved successfully');
        })
        .catch((err) => {
          const msg = err?.response?.data?.message || err?.message || 'Failed to move lead';
          setColumns(originalColumns);
          setError(msg);
          toast.error(msg);
        })
        .finally(() => {
          setIsMoving(false);
        });
    }
  };

  const activeLead = activeId
    ? columns.flatMap((col) => col.leads ?? []).find((lead) => lead.id === activeId)
    : null;

  return (
    <>
      <Head title="Pipeline" />

      <AppLayout>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b border-gray-200">
            <div className="px-6 py-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Pipeline</h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Manage your leads through the sales pipeline
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button onClick={() => router.visit('/leads/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lead
                  </Button>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900">Total Leads</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {metrics.totalLeads}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-900">Pipeline Value</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    ${(metrics.totalValue / 1000).toFixed(0)}K
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                  <p className="text-sm font-medium text-purple-900">
                    Conversion Rate
                  </p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">
                    {metrics.conversionRate}%
                  </p>
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
                    <h3 className="text-sm font-medium text-red-900">Error Moving Lead</h3>
                    <p className="text-sm text-red-800 mt-1">{error}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setError(null)}
                    className="flex-shrink-0"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Pipeline Board */}
          <LoadingOverlay isLoading={isMoving} message="Moving lead...">
            <div className="p-6">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="flex gap-6 overflow-x-auto pb-6">
                  {columns.map((stage) => (
                    <PipelineColumn key={stage.id} stage={stage} />
                  ))}
                </div>

              <DragOverlay>
                {activeLead ? (
                  <Card
                    className="p-4 w-60 shadow-2xl rotate-3 border-l-4"
                    style={{
                      borderLeftColor: getStatusColor(activeLead.status),
                    }}
                  >
                    <h3 className="font-medium text-sm text-gray-900">
                      {activeLead.title}
                    </h3>
                  </Card>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
          </LoadingOverlay>
        </div>
      </AppLayout>
    </>
  );
}