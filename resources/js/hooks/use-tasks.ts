// File: resources/js/hooks/useTasks.ts
import { useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { echo } from "@/lib/echo";
import { Task } from "@/types";


export function useTasks(projectId?: number) {
    const queryClient = useQueryClient();

    /** ──────── Fetch tasks ──────── **/
    const {
        data: tasks = [],
        isLoading,
        isError,
        refetch,
    } = useQuery<Task[]>({
        queryKey: ["tasks", projectId],
        queryFn: async () => {
            if (!projectId) return [];
            const response = await axios.get(`/api/v1/projects/${projectId}/tasks`);
            return response.data;
        },
        enabled: !!projectId,
    });

    /** ──────── Update status (Optimistic UI) ──────── **/
    const updateTaskStatus = useMutation({
        mutationFn: async ({ taskId, newStatus }: { taskId: number; newStatus: string }) => {
            await axios.put(`/api/v1/tasks/${taskId}`, { status: newStatus });
        },
        onMutate: async ({ taskId, newStatus }: { taskId: number; newStatus: string }) => {
            await queryClient.cancelQueries({ queryKey: ["tasks", projectId] });
            const previousTasks = queryClient.getQueryData<Task[]>(["tasks", projectId]);
            queryClient.setQueryData<Task[]>(["tasks", projectId], (old = []) =>
                (old as Task[]).map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
            );
            return { previousTasks };
        },
        onError: (_err: unknown, _variables: unknown, context: { previousTasks?: Task[] } | undefined) => {
            if (context?.previousTasks) {
                queryClient.setQueryData(["tasks", projectId], context.previousTasks);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
        },
    });

    /** ──────── Real-time Echo updates ──────── **/
    useEffect(() => {
        if (!projectId) return;
        // Use proper Echo API; echo.private returns channel with listen()
        const channel = (echo as any).channel(`projects.${projectId}.tasks`);

        channel.listen(".task.created", (task: Task) => {
            queryClient.setQueryData<Task[]>(["tasks", projectId], (old = []) => [task, ...old]);
        });

        channel.listen(".task.updated", (updated: Task) => {
            queryClient.setQueryData<Task[]>(["tasks", projectId], (old = []) =>
                (old as Task[]).map((t) => (t.id === updated.id ? updated : t))
            );
        });

        channel.listen(".task.deleted", (deleted: Task) => {
            queryClient.setQueryData<Task[]>(["tasks", projectId], (old = []) =>
                (old as Task[]).filter((t) => t.id !== deleted.id)
            );
        });

        return () => {
            channel.stopListening(".task.created");
            channel.stopListening(".task.updated");
            channel.stopListening(".task.deleted");
        };
    }, [projectId, queryClient]);

    return {
        tasks,
        loading: isLoading,
        error: isError,
        updateTaskStatus: updateTaskStatus.mutateAsync,
        refetch,
    };
}
