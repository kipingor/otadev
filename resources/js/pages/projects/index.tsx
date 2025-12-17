import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Card,
    CardAction,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { IconTrendingUp } from "@tabler/icons-react";
import { type BreadcrumbItem } from '@/types';


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Projects',
        href: '/projects',
    },
];


export default function ProjectsIndex() {
    const { props } = usePage<any>();
    const projectList = props.projects?.data ?? [];


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Projects" />


            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Projects</h1>
                <Link href="/projects/create" className="btn">New Project</Link>
            </div>

            <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card mt-4 grid grid-cols-3 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
                {projectList.map((p: any) => (
                    <Card key={p.id} className="@container/card">
                        <CardHeader>
                            <CardDescription>Total Revenue</CardDescription>
                            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                {p.name}
                            </CardTitle>
                            <CardAction>
                                <Badge variant="outline">
                                    <IconTrendingUp />
                                        Status: {p.status}
                                </Badge>
                            </CardAction>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1.5 text-sm">
                            <div className="line-clamp-1 flex gap-2 font-medium">
                                <Link href={`/projects/${p.id}`} className="text-sm underline">Open</Link> <IconTrendingUp className="size-4" />
                            </div>
                            <div className="text-muted-foreground">
                                Status: {p.status}
                            </div>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </AppLayout>
    );
}