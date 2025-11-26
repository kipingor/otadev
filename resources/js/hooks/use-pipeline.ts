// File: resources/js/hooks/usePipeline.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { echo } from "@/lib/echo";
import { Lead } from "@/types";

type EchoChannel = {
  listen: (event: string, callback: (payload: any) => void) => void;
  stopListening: (event: string, callback: (payload: any) => void) => void;
};

type EchoClient = {
  private: (channel: string) => EchoChannel;
};

/**
 * Pipeline hook
 * Provides:
 * - Real-time updates (Echo)
 * - Optimistic local move with rollback
 * - Refresh support
 */
type Stage = { key: string; name: string };

export function usePipeline(initialData?: {
  stages: Stage[];
  leadsByStage: Record<string, Lead[]>;
}) {
  const [stages, setStages] = useState<Stage[]>(initialData?.stages ?? []);
  const [itemsByStage, setItemsByStage] = useState<Record<string, Lead[]>>(
    initialData?.leadsByStage ?? {}
  );
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  const stableRef = useRef({
    stages: initialData?.stages ?? [],
    itemsByStage: structuredClone(initialData?.leadsByStage ?? {}),
  });

  const cloneItems = (src: Record<string, Lead[]>) =>
    Object.fromEntries(
      Object.entries(src).map(([k, leads]) => [k, leads.map((l) => ({ ...l }))])
    );

  /** Fetch pipeline data */
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get("/api/v1/pipelines");
      setStages(data.stages);
      setItemsByStage(data.leadsByStage || {});
      stableRef.current = {
        stages: data.stages,
        itemsByStage: cloneItems(data.leadsByStage || {}),
      };
    } catch (err: any) {
      setError(err.message ?? "Failed to load pipeline");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData) void refresh();
    else {
      stableRef.current = {
        stages: initialData.stages,
        itemsByStage: cloneItems(initialData.leadsByStage || {}),
      };
    }
  }, []);

  /** Real-time pipeline event listener */
  useEffect(() => {
    if (!echo) {
      console.warn('Echo is not configured, skipping real-time updates');
      return;
    }
    
    const channel = (echo as unknown as EchoClient).private("pipeline");

    const onPipelineMoved = (payload: { lead: Lead }) => {
      const updated = payload.lead;
      setItemsByStage((current) => {
        const copy = cloneItems(current);
        for (const k of Object.keys(copy)) {
          copy[k] = copy[k].filter((l) => String(l.id) !== String(updated.id));
        }
        (copy[updated.pipeline_stage_key] ||= []).unshift(updated);
        // Keep stableRef in sync with the state change we just applied.
        stableRef.current.itemsByStage = cloneItems(copy);
        return copy;
      });
    };

    channel.listen(".PipelineMoved", onPipelineMoved);

    return () => {
      channel.stopListening(".PipelineMoved", onPipelineMoved);
    };
  }, []);


  /** Move lead with optimistic update + rollback */
  const moveLead = useCallback(
    async ({ leadId, toStageKey }: { leadId: string | number; toStageKey: string }) => {
      setError(null);

      // Capture current state BEFORE optimistic update
      const prevItems = cloneItems(itemsByStage);

      // Find lead + current stage
      let found: Lead | undefined;
      let fromKey: string | undefined;

      for (const [key, leads] of Object.entries(prevItems)) {
        const idx = leads.findIndex((l) => String(l.id) === String(leadId));
        if (idx !== -1) {
          found = { ...leads[idx] };
          fromKey = key;
          break;
        }
      }

      if (!found) return;

      // Optimistic update - just use setItemsByStage directly, don't use stableRef
      const optimisticItems = cloneItems(prevItems);
      optimisticItems[fromKey!] = optimisticItems[fromKey!].filter((l) => String(l.id) !== String(leadId));
      (optimisticItems[toStageKey] ||= []).unshift({
        ...found!,
        pipeline_stage_key: toStageKey,
      });
      setItemsByStage(optimisticItems);

      try {
        const { data } = await axios.post("/api/v1/pipelines/move", {
          lead_id: leadId,
          to_stage_key: toStageKey,
        });

        // Apply server response only if it has updated_lead
        if (data?.updated_lead) {
          const updated = data.updated_lead;
          setItemsByStage((current) => {
            const copy = cloneItems(current);
            for (const k of Object.keys(copy)) {
              copy[k] = copy[k].filter((l) => String(l.id) !== String(updated.id));
            }
            (copy[updated.pipeline_stage_key] ||= []).unshift(updated);
            return copy;
          });
        }
      } catch (err: any) {
        console.error("Failed to move lead:", err);
        setError(err.message ?? "Move failed");
        // Rollback to previous state
        setItemsByStage(prevItems);
      }
    },
    [itemsByStage]
  );

  return { stages, itemsByStage, loading, error, refresh, moveLead };
}

/** Optional React Query helper */
export function useMoveLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, stageId }: { leadId: number; stageId: number }) => {
      const { data } = await axios.put(`/api/leads/${leadId}/move`, { stage_id: stageId });
      return data;
    },
    onMutate: async ({ leadId, stageId }: { leadId: number; stageId: number }) => {
      await queryClient.cancelQueries({ queryKey: ["leads"] });
      const prev = queryClient.getQueryData<Lead[]>(["leads"]);
      queryClient.setQueryData<Lead[]>(["leads"], (old = []) =>
        (old as Lead[]).map((l) =>
          l.id === leadId ? { ...l, stage_id: stageId } : l
        )
      );
      return { prev };
    },
    onError: (_e: unknown, _v: unknown, ctx?: { prev?: Lead[] }) => {
      if (ctx?.prev) queryClient.setQueryData(["leads"], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}
