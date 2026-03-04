import Gantt from '@/components/projects/gantt';
import TaskBoard from '@/components/projects/task-board';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import {
    PROJECT_STATUS_CONFIG,
    type ProjectShowProps,
} from '@/types/project.types';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    Copy,
    DollarSign,
    Download,
    Edit,
    FileText,
    MoreVertical,
    Target,
    Trash,
    Users,
} from 'lucide-react';
import { useState } from 'react';

export default function ProjectShow({
    project,
    progress,
    timeline,
    budget,
    isAtRisk,
    canManage,
}: ProjectShowProps) {
    const [activeTab, setActiveTab] = useState('overview');
    const statusConfig = PROJECT_STATUS_CONFIG[project.status];

    const handleClone = () => {
        if (
            confirm(
                'Clone this project? This will create a copy with all tasks and team members.',
            )
        ) {
            router.post(
                `/projects/${project.id}/clone`,
                {
                    include_tasks: true,
                    include_team: true,
                },
                {
                    onSuccess: () => {
                        // Success handled by flash message
                    },
                },
            );
        }
    };

    const handleDelete = () => {
        if (
            confirm(
                'Are you sure you want to delete this project? This action cannot be undone.',
            )
        ) {
            router.delete(`/projects/${project.id}`);
        }
    };

    const handleStatusChange = (status: string) => {
        router.post(
            `/projects/${project.id}/update-status`,
            { status },
            { preserveState: true },
        );
    };

    return (
        <>
            <Head title={project.name} />

            <AppLayout>
                <div className="min-h-screen bg-gray-50">
                    {/* Header */}
                    <div className="border-b border-gray-200 bg-white">
                        <div className="px-6 py-6">
                            {/* Breadcrumb */}
                            <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                                <Link
                                    href="/projects"
                                    className="hover:text-gray-900"
                                >
                                    Projects
                                </Link>
                                <span>/</span>
                                <span className="text-gray-900">
                                    {project.name}
                                </span>
                            </div>

                            {/* Title Row */}
                            <div className="mb-6 flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="mb-2 flex items-center gap-3">
                                        <h1 className="text-3xl font-bold text-gray-900">
                                            {project.name}
                                        </h1>
                                        <Badge
                                            className={`${statusConfig.bgColor} ${statusConfig.textColor}`}
                                        >
                                            {statusConfig.label}
                                        </Badge>
                                        {isAtRisk && (
                                            <Badge className="bg-red-100 text-red-800">
                                                <AlertTriangle className="mr-1 h-3 w-3" />
                                                At Risk
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-gray-600">
                                        {project.description}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {canManage && (
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                router.visit(
                                                    `/projects/${project.id}/edit`,
                                                )
                                            }
                                        >
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit
                                        </Button>
                                    )}

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    router.visit(
                                                        `/projects/${project.id}/export`,
                                                    )
                                                }
                                            >
                                                <Download className="mr-2 h-4 w-4" />
                                                Export
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={handleClone}
                                            >
                                                <Copy className="mr-2 h-4 w-4" />
                                                Clone Project
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            {canManage && (
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={handleDelete}
                                                >
                                                    <Trash className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            {/* Key Metrics */}
                            <div className="grid grid-cols-4 gap-4">
                                <Card className="p-4">
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-sm text-gray-600">
                                            Progress
                                        </span>
                                        <Target className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <div className="mb-2 text-2xl font-bold">
                                        {progress.overall}%
                                    </div>
                                    <Progress
                                        value={progress.overall}
                                        className="h-2"
                                    />
                                </Card>

                                <Card className="p-4">
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-sm text-gray-600">
                                            Tasks
                                        </span>
                                        <CheckCircle2 className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <div className="mb-2 text-2xl font-bold">
                                        {progress.tasks.completed}/
                                        {progress.tasks.total}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {progress.tasks.progress}% complete
                                    </div>
                                </Card>

                                <Card className="p-4">
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-sm text-gray-600">
                                            Budget
                                        </span>
                                        <DollarSign className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <div className="mb-2 text-2xl font-bold">
                                        {budget.utilization}%
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {project.currency}{' '}
                                        {budget.spent.toLocaleString()} spent
                                    </div>
                                </Card>

                                <Card className="p-4">
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-sm text-gray-600">
                                            Team
                                        </span>
                                        <Users className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <div className="mb-2 text-2xl font-bold">
                                        {project.teamMembers?.length || 0}
                                    </div>
                                    <div className="flex -space-x-2">
                                        {project.teamMembers
                                            ?.slice(0, 4)
                                            .map((member) => (
                                                <Avatar
                                                    key={member.id}
                                                    className="h-6 w-6 border-2 border-white"
                                                >
                                                    <AvatarImage
                                                        src={
                                                            member.user?.avatar
                                                        }
                                                    />
                                                    <AvatarFallback className="text-xs">
                                                        {member.user?.name.charAt(
                                                            0,
                                                        )}
                                                    </AvatarFallback>
                                                </Avatar>
                                            ))}
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="p-6">
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList>
                                <TabsTrigger value="overview">
                                    Overview
                                </TabsTrigger>
                                <TabsTrigger value="tasks">
                                    Tasks ({progress.tasks.total})
                                </TabsTrigger>
                                <TabsTrigger value="timeline">
                                    Timeline
                                </TabsTrigger>
                                <TabsTrigger value="team">Team</TabsTrigger>
                                <TabsTrigger value="files">Files</TabsTrigger>
                                <TabsTrigger value="activity">
                                    Activity
                                </TabsTrigger>
                            </TabsList>

                            {/* Overview Tab */}
                            <TabsContent value="overview" className="mt-6">
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="col-span-2 space-y-6">
                                        {/* Project Details */}
                                        <Card className="p-6">
                                            <h2 className="mb-4 text-lg font-semibold">
                                                Project Details
                                            </h2>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="mb-1 text-sm text-gray-600">
                                                        Client
                                                    </div>
                                                    <div className="font-medium">
                                                        {project.client?.name ||
                                                            'Not assigned'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="mb-1 text-sm text-gray-600">
                                                        Owner
                                                    </div>
                                                    <div className="font-medium">
                                                        {project.owner?.name ||
                                                            'Not assigned'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="mb-1 text-sm text-gray-600">
                                                        Start Date
                                                    </div>
                                                    <div className="font-medium">
                                                        {project.start_date
                                                            ? new Date(
                                                                  project.start_date,
                                                              ).toLocaleDateString()
                                                            : 'Not set'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="mb-1 text-sm text-gray-600">
                                                        End Date
                                                    </div>
                                                    <div className="font-medium">
                                                        {project.end_date
                                                            ? new Date(
                                                                  project.end_date,
                                                              ).toLocaleDateString()
                                                            : 'Not set'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="mb-1 text-sm text-gray-600">
                                                        Budget
                                                    </div>
                                                    <div className="font-medium">
                                                        {project.currency}{' '}
                                                        {project.budget?.toLocaleString() ||
                                                            0}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="mb-1 text-sm text-gray-600">
                                                        Opportunity
                                                    </div>
                                                    <div className="font-medium">
                                                        {project.opportunity ? (
                                                            <Link
                                                                href={`/opportunities/${project.opportunity.id}`}
                                                                className="text-blue-600 hover:underline"
                                                            >
                                                                {
                                                                    project
                                                                        .opportunity
                                                                        .title
                                                                }
                                                            </Link>
                                                        ) : (
                                                            'None'
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>

                                        {/* Progress Breakdown */}
                                        <Card className="p-6">
                                            <h2 className="mb-4 text-lg font-semibold">
                                                Progress Breakdown
                                            </h2>
                                            <div className="space-y-4">
                                                {/* Tasks */}
                                                <div>
                                                    <div className="mb-2 flex items-center justify-between">
                                                        <span className="text-sm font-medium">
                                                            Tasks
                                                        </span>
                                                        <span className="text-sm text-gray-600">
                                                            {
                                                                progress.tasks
                                                                    .completed
                                                            }
                                                            /
                                                            {
                                                                progress.tasks
                                                                    .total
                                                            }
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        value={
                                                            progress.tasks
                                                                .progress
                                                        }
                                                        className="h-2"
                                                    />
                                                </div>

                                                {/* Milestones — only show when the project has at least one */}
                                                {progress.milestones.total >
                                                    0 && (
                                                    <div>
                                                        <div className="mb-2 flex items-center justify-between">
                                                            <span className="text-sm font-medium">
                                                                Milestones
                                                            </span>
                                                            <span className="text-sm text-gray-600">
                                                                {
                                                                    progress
                                                                        .milestones
                                                                        .completed
                                                                }
                                                                /
                                                                {
                                                                    progress
                                                                        .milestones
                                                                        .total
                                                                }
                                                            </span>
                                                        </div>
                                                        <Progress
                                                            value={
                                                                progress
                                                                    .milestones
                                                                    .progress
                                                            }
                                                            className="h-2"
                                                        />
                                                    </div>
                                                )}

                                                {/* Hours Burned — derived from task time-tracking.
                            Shows as "Budget Usage" in monetary-only mode. */}
                                                {budget.mode === 'hours' &&
                                                budget.budget > 0 ? (
                                                    <div>
                                                        <div className="mb-2 flex items-center justify-between">
                                                            <span className="text-sm font-medium">
                                                                Hours Burned
                                                            </span>
                                                            <span className="text-sm text-gray-600">
                                                                {budget.spent}h
                                                                /{' '}
                                                                {budget.budget}h
                                                                (
                                                                {
                                                                    budget.utilization
                                                                }
                                                                %)
                                                            </span>
                                                        </div>
                                                        <Progress
                                                            value={
                                                                budget.utilization
                                                            }
                                                            className={
                                                                budget.utilization >=
                                                                100
                                                                    ? 'h-2 [&>div]:bg-red-500'
                                                                    : 'h-2'
                                                            }
                                                        />
                                                    </div>
                                                ) : budget.mode ===
                                                      'monetary' &&
                                                  budget.budget > 0 ? (
                                                    <div>
                                                        <div className="mb-2 flex items-center justify-between">
                                                            <span className="text-sm font-medium">
                                                                Budget
                                                            </span>
                                                            <span className="text-sm text-gray-600">
                                                                $
                                                                {budget.budget.toLocaleString()}{' '}
                                                                allocated
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            Expense tracking not
                                                            yet set up
                                                        </p>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </Card>
                                    </div>

                                    {/* Sidebar */}
                                    <div className="space-y-6">
                                        {/* Upcoming Milestones */}
                                        <Card className="p-6">
                                            <h2 className="mb-4 text-lg font-semibold">
                                                Upcoming Milestones
                                            </h2>
                                            {project.milestones &&
                                            project.milestones.length > 0 ? (
                                                <div className="space-y-3">
                                                    {project.milestones
                                                        .slice(0, 5)
                                                        .map((milestone) => (
                                                            <div
                                                                key={
                                                                    milestone.id
                                                                }
                                                                className="flex items-start gap-3"
                                                            >
                                                                <div className="mt-2 h-2 w-2 rounded-full bg-blue-600" />
                                                                <div className="flex-1">
                                                                    <div className="text-sm font-medium">
                                                                        {
                                                                            milestone.title
                                                                        }
                                                                    </div>
                                                                    <div className="text-xs text-gray-600">
                                                                        {new Date(
                                                                            milestone.due_date,
                                                                        ).toLocaleDateString()}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-gray-600">
                                                    No milestones yet
                                                </div>
                                            )}
                                        </Card>

                                        {/* Team Members */}
                                        <Card className="p-6">
                                            <h2 className="mb-4 text-lg font-semibold">
                                                Team Members
                                            </h2>
                                            {project.teamMembers &&
                                            project.teamMembers.length > 0 ? (
                                                <div className="space-y-3">
                                                    {project.teamMembers.map(
                                                        (member) => (
                                                            <div
                                                                key={member.id}
                                                                className="flex items-center gap-3"
                                                            >
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarImage
                                                                        src={
                                                                            member
                                                                                .user
                                                                                ?.avatar
                                                                        }
                                                                    />
                                                                    <AvatarFallback>
                                                                        {member.user?.name.charAt(
                                                                            0,
                                                                        )}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1">
                                                                    <div className="text-sm font-medium">
                                                                        {
                                                                            member
                                                                                .user
                                                                                ?.name
                                                                        }
                                                                    </div>
                                                                    <div className="text-xs text-gray-600">
                                                                        {member.role ||
                                                                            'Team Member'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-gray-600">
                                                    No team members yet
                                                </div>
                                            )}
                                        </Card>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Tasks Tab */}
                            <TabsContent value="tasks" className="mt-6">
                                <TaskBoard projectId={project.id} />
                            </TabsContent>

                            {/* Timeline Tab */}
                            <TabsContent value="timeline" className="mt-6">
                                <Card className="p-6">
                                    <Gantt
                                        project={{
                                            ...project,
                                            tasks: project.tasks?.map(
                                                (task) => ({
                                                    ...task,
                                                    id: String(task.id),
                                                    assigned_to: typeof task.assigned_to === 'object' ? task.assigned_to : task.assignee,
                                                    startAt: task.startAt ? new Date(task.startAt) : new Date(),
                                                    endAt: task.endAt ? new Date(task.endAt) : new Date(),
                                                }),
                                            ),
                                        }}
                                    />
                                </Card>
                            </TabsContent>

                            {/* Team Tab */}
                            <TabsContent value="team" className="mt-6">
                                <Card className="p-6">
                                    <div className="mb-6 flex items-center justify-between">
                                        <h2 className="text-lg font-semibold">
                                            Team Members
                                        </h2>
                                        {canManage && (
                                            <Button>
                                                <Users className="mr-2 h-4 w-4" />
                                                Add Member
                                            </Button>
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        {project.teamMembers &&
                                        project.teamMembers.length > 0 ? (
                                            project.teamMembers.map(
                                                (member) => (
                                                    <div
                                                        key={member.id}
                                                        className="flex items-center justify-between rounded-lg border p-4"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <Avatar className="h-12 w-12">
                                                                <AvatarImage
                                                                    src={
                                                                        member
                                                                            .user
                                                                            ?.avatar
                                                                    }
                                                                />
                                                                <AvatarFallback>
                                                                    {member.user?.name.charAt(
                                                                        0,
                                                                    )}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <div className="font-medium">
                                                                    {
                                                                        member
                                                                            .user
                                                                            ?.name
                                                                    }
                                                                </div>
                                                                <div className="text-sm text-gray-600">
                                                                    {
                                                                        member
                                                                            .user
                                                                            ?.email
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <Badge>
                                                                {member.role ||
                                                                    'Team Member'}
                                                            </Badge>
                                                            {member.allocation_percentage && (
                                                                <div className="text-sm text-gray-600">
                                                                    {
                                                                        member.allocation_percentage
                                                                    }
                                                                    % allocated
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ),
                                            )
                                        ) : (
                                            <div className="py-12 text-center text-gray-600">
                                                No team members yet
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </TabsContent>

                            {/* Files Tab */}
                            <TabsContent value="files" className="mt-6">
                                <Card className="p-6">
                                    <div className="mb-6 flex items-center justify-between">
                                        <h2 className="text-lg font-semibold">
                                            Project Files
                                        </h2>
                                        <Button>
                                            <FileText className="mr-2 h-4 w-4" />
                                            Upload File
                                        </Button>
                                    </div>
                                    <div className="py-12 text-center text-gray-600">
                                        File management coming soon
                                    </div>
                                </Card>
                            </TabsContent>

                            {/* Activity Tab */}
                            <TabsContent value="activity" className="mt-6">
                                <Card className="p-6">
                                    <h2 className="mb-6 text-lg font-semibold">
                                        Recent Activity
                                    </h2>
                                    <div className="py-12 text-center text-gray-600">
                                        Activity log coming soon
                                    </div>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </AppLayout>
        </>
    );
}
