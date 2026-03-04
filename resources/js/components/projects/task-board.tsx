import {
    KanbanBoard,
    KanbanCard,
    KanbanCards,
    KanbanHeader,
    KanbanProvider,
} from '@/components/ui/shadcn-io/kanban/index';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useMemo, useState, useRef } from 'react';

// Fallback AppLayout
let AppLayout: React.FC<React.PropsWithChildren> = ({ children }) => (
    <div>{children}</div>
);
try {
    AppLayout = require('@/layouts/app-layout').default || AppLayout;
} catch {}

// Static imports for hooks
import useTaskMutations from '@/hooks/use-task-mutations';
import { useTasks } from '@/hooks/use-tasks';

let toast = ({ title, description, variant }: any) => {
    if (variant === 'destructive') alert(`${title}\n${description ?? ''}`);
};
try {
    toast = require('@/components/ui/toast').toast || toast;
} catch {}

/**
 * Utility helpers
 */
const formatDate = (d?: string | Date | null) => {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    if (Number.isNaN(date.getTime())) return String(d);
    return date.toLocaleDateString();
};

const initials = (name?: string) =>
    (name || 'U')
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

/**
 * Type
 */
type Task = {
    id?: string | number;
    title?: string;
    description?: string;
    assignee?: { name: string; avatarUrl?: string };
    labels?: string[];
    due_at?: string | null;
    priority?: string;
    status?: string;
    [key: string]: any;
};

/**
 * New Task form component (inline)
 */
const NewTaskForm: React.FC<{
    columnId: string;
    onCreate: (payload: Partial<Task>) => Promise<void> | void;
    onClose?: () => void;
}> = ({ columnId, onCreate, onClose }) => {
    const [title, setTitle] = useState('');
    const [assignee, setAssignee] = useState('');
    const [labels, setLabels] = useState('');
    const [priority, setPriority] = useState('Normal');
    const [loading, setLoading] = useState(false);

    const submit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!title.trim()) return;
        setLoading(true);
        try {
            await onCreate({
                title: title.trim(),
                assignee: assignee ? { name: assignee } : undefined,
                labels: labels
                    ? labels
                          .split(',')
                          .map((l) => l.trim())
                          .filter(Boolean)
                    : undefined,
                priority,
                status: columnId,
            });
            setTitle('');
            setAssignee('');
            setLabels('');
            setPriority('Normal');
            onClose?.();
        } catch (err: any) {
            toast({
                title: 'Failed to create task',
                description: err?.message ?? 'Unknown error',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="space-y-2 p-2" onSubmit={submit}>
            <input
                className="w-full rounded-md border bg-white/5 p-2 text-sm placeholder:text-muted-foreground"
                placeholder="Task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />
            <div className="flex gap-2">
                <input
                    className="flex-1 rounded-md border bg-white/5 p-2 text-sm placeholder:text-muted-foreground"
                    placeholder="Assignee name (optional)"
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                />
                <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="rounded-md border bg-white/5 p-2 text-sm"
                >
                    <option>Low</option>
                    <option>Normal</option>
                    <option>High</option>
                    <option>Critical</option>
                </select>
            </div>
            <input
                className="w-full rounded-md border bg-white/5 p-2 text-sm placeholder:text-muted-foreground"
                placeholder="Labels (comma separated)"
                value={labels}
                onChange={(e) => setLabels(e.target.value)}
            />
            <div className="flex gap-2">
                <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1 text-sm text-white disabled:opacity-60"
                    disabled={loading}
                >
                    {loading ? 'Creating...' : 'Create'}
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md border px-3 py-1 text-sm"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
};

/**
 * Task card (prettier)
 */
const PrettyTaskCard: React.FC<{ item: any }> = ({ item }) => {
    const task = item.task as Task;
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded-md bg-white/5 p-3 shadow-sm"
        >
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold">
                    {task.assignee?.avatarUrl ? (
                        <img
                            src={task.assignee.avatarUrl}
                            alt={task.assignee.name}
                            className="h-10 w-10 rounded-full object-cover"
                        />
                    ) : (
                        <span>
                            {initials(task.assignee?.name ?? task.title)}
                        </span>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm leading-tight font-semibold">
                            {task.title ?? `#${item.id}`}
                        </h4>
                        <div className="text-xs text-muted-foreground">
                            {formatDate(task.due_at)}
                        </div>
                    </div>

                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {task.description}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        {/* Labels */}
                        {(task.labels || []).slice(0, 3).map((l: string) => (
                            <span
                                key={l}
                                className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium"
                            >
                                {l}
                            </span>
                        ))}

                        {/* Priority badge */}
                        {task.priority && (
                            <span
                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                    task.priority === 'Critical'
                                        ? 'bg-red-600 text-white'
                                        : task.priority === 'High'
                                          ? 'bg-amber-500 text-black'
                                          : 'bg-green-500 text-black'
                                }`}
                            >
                                {task.priority}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

/**
 * Main board component
 */
export default function TaskBoard({
    projectId,
}: {
    projectId: number | string;
}) {
    // ✅ Get tasks and update function from hook
    const { tasks, loading, error, updateTaskStatus, refetch } = useTasks(projectId);

    // ✅ Local state for optimistic updates (required by useTaskMutations)
    const [tasksByStatus, setTasksByStatus] = React.useState<Record<string, Task[]>>({});

    // ✅ Sync tasksByStatus state when remote tasks change
    React.useEffect(() => {
        const grouped = (tasks ?? []).reduce<Record<string, Task[]>>((acc, task) => {
            const status = (task.status ?? 'todo').toLowerCase();
            if (!acc[status]) acc[status] = [];
            acc[status].push(task);
            return acc;
        }, {});
        setTasksByStatus(grouped);
    }, [tasks]);

    // ✅ Now pass both state and setter — no more "is not a function"
    const { updateTask, createTask } = useTaskMutations(
        tasksByStatus,
        setTasksByStatus,
    );

    // Controls
    const [search, setSearch] = useState('');
    const [labelFilter, setLabelFilter] = useState<string | null>(null);
    const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
    const [swimlaneBy, setSwimlaneBy] = useState<'none' | 'assignee' | 'priority'>('none');
    const [openNewFor, setOpenNewFor] = useState<string | null>(null);

    // Debounced search
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    
    React.useEffect(() => {
        const id = setTimeout(
            () => setDebouncedSearch(search.trim().toLowerCase()),
            220,
        );
        return () => clearTimeout(id);
    }, [search]);

    // Default column order
    const DEFAULT_STATUSES = ['todo', 'in_progress', 'review', 'done'];

    const kanbanColumns = useMemo(() => {
        const keys = Object.keys(tasksByStatus ?? {});
        const statuses = keys.length ? keys : DEFAULT_STATUSES;
        return statuses.map((status) => ({ id: status, name: status }));
    }, [tasksByStatus]);

    const kanbanData = useMemo(() => {
        return Object.entries(tasksByStatus ?? {}).flatMap(
            ([status, tasks]: any[]) =>
                (tasks ?? []).map((t: any) => ({
                    id: String(t.id),
                    name: t.title ?? t.id,
                    column: status,
                    task: t,
                })),
        );
    }, [tasksByStatus]);

    // Filtering function
    const filteredData = (items: any[]) => {
        return items.filter((item) => {
            const task = item.task as Task;
            if (debouncedSearch) {
                const hay =
                    `${task.title ?? ''} ${task.description ?? ''} ${task.assignee?.name ?? ''}`.toLowerCase();
                if (!hay.includes(debouncedSearch)) return false;
            }
            if (labelFilter) {
                if (!task.labels || !task.labels.includes(labelFilter))
                    return false;
            }
            if (assigneeFilter) {
                if (!task.assignee || task.assignee.name !== assigneeFilter)
                    return false;
            }
            return true;
        });
    };

    // ── Drag handlers ───────────────────────────────────────────────────────
    //
    // ROOT CAUSE OF RESET BUG:
    // KanbanProvider.handleDragOver mutates data items IN-PLACE
    // (newData[activeIndex].column = overColumn on a shallow-copied array).
    // Since kanbanData items are shared object references, by the time
    // onDataChange fires, original.column === item.column is always true,
    // so movedItems was always empty and updateTaskStatus was never called.
    //
    // FIX: snapshot the card's original column in onDragStart, then use
    // onDragEnd (which fires once, after the drop) to compare and persist.
    const dragStartRef = useRef<{ cardId: string; column: string } | null>(null);

    const handleDragStart = (event: any) => {
        const card = kanbanData.find((x) => x.id === String(event.active?.id));
        if (card) {
            dragStartRef.current = { cardId: card.id, column: card.column };
        }
    };

    const handleDragEnd = async (event: any) => {
        const { active } = event;
        if (!active || !dragStartRef.current) return;

        const originalColumn = dragStartRef.current.column;

        // After KanbanProvider's internal dragOver mutations, the card's
        // column property in kanbanData already reflects the drop target.
        const movedCard = kanbanData.find((x) => x.id === String(active.id));
        const newColumn = movedCard?.column;

        dragStartRef.current = null;

        if (!newColumn || newColumn === originalColumn) return;

        try {
            await updateTaskStatus({
                taskId: Number(active.id),
                newStatus: newColumn,
            });
        } catch (err: any) {
            console.error('Failed to move task:', err);
            toast({
                title: 'Failed to move task',
                description: err?.message ?? 'Unknown error',
                variant: 'destructive',
            });
            refetch(); // revert to server state on failure
        }
    };

    // ✅ FIXED: Create new task with proper mutation
    const handleCreateTask = async (payload: Partial<Task>) => {
        try {
            // Use the createTask mutation if available
            if (typeof createTask === 'function') {
                await createTask({
                    ...payload,
                    project_id: projectId,
                });
            } else {
                // Fallback: call the API directly
                const response = await fetch(`/api/v1/projects/${projectId}/tasks`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    throw new Error('Failed to create task');
                }
            }

            // Refetch to get the new task from server
            refetch();
            
            toast({
                title: 'Task created',
                description: 'Task has been created successfully',
            });
        } catch (err: any) {
            console.error('Failed to create task:', err);
            toast({
                title: 'Failed to create task',
                description: err?.message ?? 'Unknown error',
                variant: 'destructive',
            });
        }
    };

    // Loading and error states
    if (loading) return <div className="p-4">Loading tasks...</div>;
    if (error) return <div className="p-4 text-red-600">{String(error)}</div>;

    // Gather filter options
    const allLabels = new Set<string>();
    const allAssignees = new Set<string>();
    kanbanData.forEach((d) => {
        (d.task.labels || []).forEach((l: string) => allLabels.add(l));
        if (d.task.assignee?.name) allAssignees.add(d.task.assignee.name);
    });

    return (
        <AppLayout>
            <div className="p-4">
                {/* Controls */}
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 items-center gap-2">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search tasks, people, description..."
                            className="w-full max-w-md rounded-md border bg-white/5 p-2 text-sm"
                        />
                        <select
                            value={labelFilter ?? ''}
                            onChange={(e) =>
                                setLabelFilter(e.target.value || null)
                            }
                            className="rounded-md border bg-white/5 p-2 text-sm"
                        >
                            <option value="">All labels</option>
                            {[...allLabels].map((l) => (
                                <option key={l} value={l}>
                                    {l}
                                </option>
                            ))}
                        </select>
                        <select
                            value={assigneeFilter ?? ''}
                            onChange={(e) =>
                                setAssigneeFilter(e.target.value || null)
                            }
                            className="rounded-md border bg-white/5 p-2 text-sm"
                        >
                            <option value="">All assignees</option>
                            {[...allAssignees].map((a) => (
                                <option key={a} value={a}>
                                    {a}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm">Swimlane:</label>
                        <select
                            value={swimlaneBy}
                            onChange={(e) =>
                                setSwimlaneBy(e.target.value as any)
                            }
                            className="rounded-md border bg-white/5 p-2 text-sm"
                        >
                            <option value="none">None</option>
                            <option value="assignee">Assignee</option>
                            <option value="priority">Priority</option>
                        </select>
                    </div>
                </div>

                {/* Kanban */}
                <KanbanProvider
                    columns={kanbanColumns}
                    data={kanbanData}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    {(column) => {
                        const allItems = kanbanData.filter(
                            (x) => x.column === column.id,
                        );
                        const visibleItems = filteredData(allItems);

                        let swimlaneGroups: Record<string, any[]> = {
                            All: visibleItems,
                        };

                        if (swimlaneBy === 'assignee') {
                            swimlaneGroups = {};
                            visibleItems.forEach((v) => {
                                const key =
                                    v.task?.assignee?.name ?? 'Unassigned';
                                swimlaneGroups[key] = swimlaneGroups[key] || [];
                                swimlaneGroups[key].push(v);
                            });
                        } else if (swimlaneBy === 'priority') {
                            swimlaneGroups = {};
                            visibleItems.forEach((v) => {
                                const key = v.task?.priority ?? 'Normal';
                                swimlaneGroups[key] = swimlaneGroups[key] || [];
                                swimlaneGroups[key].push(v);
                            });
                        }

                        return (
                            <KanbanBoard
                                id={column.id}
                                key={column.id}
                                className="min-w-[230px]"
                            >
                                <KanbanHeader className="flex items-center justify-between">
                                    <span>
                                        {column.name} ({allItems.length})
                                    </span>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() =>
                                                setOpenNewFor(
                                                    openNewFor === column.id
                                                        ? null
                                                        : column.id,
                                                )
                                            }
                                            className="rounded-md bg-primary px-2 py-1 text-xs text-white"
                                        >
                                            + New Task
                                        </button>
                                    </div>
                                </KanbanHeader>

                                {/* New Task form */}
                                {openNewFor === column.id && (
                                    <div className="p-2">
                                        <NewTaskForm
                                            columnId={column.id}
                                            onCreate={handleCreateTask}
                                            onClose={() => setOpenNewFor(null)}
                                        />
                                    </div>
                                )}

                                {/* Cards */}
                                <ColumnSwimlaneRenderer
                                    columnId={column.id}
                                    swimlaneGroups={swimlaneGroups}
                                />

                                <KanbanCards
                                    id={column.id}
                                    className="hidden"
                                >
                                    {(item) => null}
                                </KanbanCards>
                            </KanbanBoard>
                        );
                    }}
                </KanbanProvider>
            </div>
        </AppLayout>
    );
}

/**
 * ColumnSwimlaneRenderer
 * ✅ FIXED: Removed renderedColumns logic - let React handle rendering
 */
const ColumnSwimlaneRenderer: React.FC<{
    columnId: string;
    swimlaneGroups: Record<string, any[]>;
}> = ({ columnId, swimlaneGroups }) => {
    return (
        <div className="space-y-3 p-2">
            {Object.keys(swimlaneGroups).map((lane) => (
                <div
                    key={lane}
                    className="rounded-md border bg-transparent p-2"
                >
                    <div className="mb-2 flex items-center justify-between">
                        <h5 className="text-xs font-semibold">{lane}</h5>
                        <div className="text-xs text-muted-foreground">
                            {swimlaneGroups[lane].length} cards
                        </div>
                    </div>

                    <div className="space-y-2">
                        <AnimatePresence initial={false}>
                            {swimlaneGroups[lane].map((item: any) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                >
                                    <KanbanCard
                                        id={item.id}
                                        name={item.name}
                                        column={item.column}
                                        task={item.task}
                                    >
                                        <PrettyTaskCard item={item} />
                                    </KanbanCard>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            ))}
        </div>
    );
};