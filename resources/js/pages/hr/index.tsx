import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Link, Head } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';

export default function HRIndexPage() {
    const breadcrumbs: BreadcrumbItem[] = [{ title: 'HR', href: '/hr' }];

    const sections: { title: string; href: string; description?: string }[] = [
        { title: 'Staff Directory', href: '/hr/staff', description: 'View and manage employees & contractors' },
        { title: 'Leave Management', href: '/hr/leave', description: 'Approve and track leave requests' },
        { title: 'Performance Reviews', href: '/hr/performance', description: 'Manage reviews & goals' },
        { title: 'Recruitment', href: '/hr/recruitment', description: 'Open roles and applicant tracking' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Human Resources" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Human Resources</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sections.map((section) => (
                        <Link
                            key={section.href}
                            href={section.href}
                            className="block p-6 border rounded-xl hover:bg-muted transition-shadow shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-lg font-medium">{section.title}</div>
                                    {section.description && <div className="mt-1 text-sm text-muted-foreground">{section.description}</div>}
                                </div>
                                <div aria-hidden className="text-muted-foreground ml-4">{'>'}</div>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-lg border p-4">
                        <h2 className="font-semibold mb-2">Quick Actions</h2>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/hr/staff/create" className="text-blue-600 underline">Add new staff</Link></li>
                            <li><Link href="/hr/leave/create" className="text-blue-600 underline">Create leave request</Link></li>
                            <li><Link href="/hr/recruitment" className="text-blue-600 underline">Post a job</Link></li>
                        </ul>
                    </div>

                    <div className="rounded-lg border p-4">
                        <h2 className="font-semibold mb-2">Recent Leave Requests</h2>
                        <div className="text-sm text-muted-foreground">No recent items (seed demo data to view).</div>
                    </div>

                    <div className="rounded-lg border p-4">
                        <h2 className="font-semibold mb-2">Team Availability</h2>
                        <div className="text-sm text-muted-foreground">Summary of resource availability will appear here.</div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}