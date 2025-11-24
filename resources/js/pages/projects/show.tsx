import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import Gantt from '@/components/projects/gantt';
import TaskBoard from '@/components/projects/task-board';
import { type BreadcrumbItem } from '@/types';


export default function ProjectShow() {
    const { props } = usePage<any>();
    const project = props.project;


    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Projects', href: '/projects' },
        { title: project?.name ?? 'Project', href: '/projects' },
    ];


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={project?.name ?? 'Project'} />


            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-4">
                    <Gantt project={project} />
                    <TaskBoard projectId={project?.id} />
                </div>
                <aside className="space-y-4">
                    <div className="rounded-lg border p-4">
                        <h3 className="font-semibold mb-2">Project Info</h3>
                        <div>
                            <div className="flex justify-between text-sm py-1">
                                <span className="text-muted-foreground">Name:</span>
                                <span>{project?.name}</span>
                            </div>
                            <div className="flex justify-between text-sm py-1">
                                <span className="text-muted-foreground">Status:</span>
                                <span>{project?.status}</span>
                            </div>
                            {/* Optional: add more project fields as needed */}
                            {project?.description && (
                                <div className="mt-2">
                                    <span className="text-muted-foreground block">Description:</span>
                                    <span className="block">{project.description}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="rounded-lg border p-4">
                        <h3 className="font-semibold mb-2">Team</h3>
                        {Array.isArray(project?.team) && project.team.length > 0 ? (
                            <ul className="space-y-2">
                                {project.team.map((member: any) => (
                                    <li key={member.id} className="flex items-center gap-2">
                                        <span className="font-medium">{member.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {member.role && `(${member.role})`}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <span className="text-muted-foreground text-sm">No team members assigned.</span>
                        )}
                    </div>
                </aside>
            </div>
        </AppLayout>
    );
}