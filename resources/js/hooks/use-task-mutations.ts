import type { Task } from '@/types/task';
import { useState } from 'react';

/**
 * useTaskMutations
 *
 * Provides create/update/delete task functions with optimistic updates.
 * Consumer should pass current tasksByStatus and setter to perform local updates.
 *
 * Example usage:
 * const { createTask, updateTask, deleteTask } = useTaskMutations(tasksByStatus, setTasksByStatus);
 */
export default function useTaskMutations(
    tasksByStatus: Record<string, Task[]>,
    setTasksByStatus: React.Dispatch<React.SetStateAction<Record<string, Task[]>>>
) {
    const [error, setError] = useState<string | null>(null);

    const cloneTasks = (src: Record<string, Task[]>) => {
        const out: Record<string, Task[]> = {};
        for (const k of Object.keys(src)) {
            out[k] = src[k].map((t) => ({ ...t }));
        }
        return out;
    };

    const createTask = async (payload: Partial<Task> & { project_id: number | string }) => {
        setError(null);
        // Optimistic: add a temporary task to state
        const tempId = `temp-${Date.now()}`;
        const tempTask: Task = { id: tempId, status: payload.status ?? 'todo', ...payload } as Task;

        setTasksByStatus((current) => {
            const copy = cloneTasks(current);
            if (!copy[tempTask.status]) copy[tempTask.status] = [];
            copy[tempTask.status] = [tempTask, ...copy[tempTask.status]];
            return copy;
        });

        try {
            const res = await fetch(`/api/v1/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to create task: ${res.status} ${text}`);
            }

            const created: Task = await res.json();
            // Replace temp task with real task
            setTasksByStatus((current) => {
                const copy = cloneTasks(current);
                copy[tempTask.status] = copy[tempTask.status].map((t) => (t.id === tempId ? created : t));
                return copy;
            });
        } catch (err: any) {
            // Rollback
            setTasksByStatus((current) => {
                const copy = cloneTasks(current);
                copy[tempTask.status] = copy[tempTask.status].filter((t) => t.id !== tempId);
                return copy;
            });
            setError(err?.message ?? 'Error creating task');
            throw err;
        }
    };

    const updateTask = async (taskId: number | string, payload: Partial<Task>) => {
        setError(null);
        const prevState = cloneTasks(tasksByStatus);

        // Optimistic: update task in state
        setTasksByStatus((current) => {
            const copy = cloneTasks(current);
            for (const status of Object.keys(copy)) {
                copy[status] = copy[status].map((t) =>
                    String(t.id) === String(taskId) ? { ...t, ...payload } : t
                );
            }
            return copy;
        });

        try {
            const res = await fetch(`/api/v1/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to update task: ${res.status} ${text}`);
            }

            const updated: Task = await res.json();
            // merge canonical server response
            setTasksByStatus((current) => {
                const copy = cloneTasks(current);
                for (const status of Object.keys(copy)) {
                    copy[status] = copy[status].map((t) =>
                        String(t.id) === String(taskId) ? updated : t
                    );
                }
                return copy;
            });
        } catch (err: any) {
            // Rollback
            setTasksByStatus(prevState);
            setError(err?.message ?? 'Error updating task');
            throw err;
        }
    };

    const deleteTask = async (taskId: number | string) => {
        setError(null);
        const prevState = cloneTasks(tasksByStatus);
        let removedTask: Task | null = null;

        // Optimistic: remove from state
        setTasksByStatus((current) => {
            const copy = cloneTasks(current);
            for (const status of Object.keys(copy)) {
                copy[status] = copy[status].filter((t) => {
                    if (String(t.id) === String(taskId)) {
                        removedTask = t;
                        return false;
                    }
                    return true;
                });
            }
            return copy;
        });

        try {
            const res = await fetch(`/api/v1/tasks/${taskId}`, {
                method: 'DELETE',
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to delete task: ${res.status} ${text}`);
            }
        } catch (err: any) {
            // Rollback
            if (removedTask) {
                setTasksByStatus(prevState);
            }
            setError(err?.message ?? 'Error deleting task');
            throw err;
        }
    };

    return { createTask, updateTask, deleteTask, error };
}

/**
 * Suggested test stub files:
 * resources/js/hooks/__tests__/useTasks.test.tsx
 * resources/js/hooks/__tests__/useTaskMutations.test.tsx
 *
 * Test ideas:
 * - useTasks: ensure GET request fetches tasks and groups correctly
 * - useTaskMutations: simulate optimistic create/update/delete, assert local state updates, server response merges, rollback on failure
 */