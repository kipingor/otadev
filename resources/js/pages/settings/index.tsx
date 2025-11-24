import React from 'react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Link, usePage } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { index } from '@/routes/settings';

export default function SettingsIndex() {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Settings',
            href: index().url,
        },
    ];
    const { sections } = usePage<{ sections: Array<{ title: string; href: string; description: string }> }>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <SettingsLayout>
                <div className="space-y-6">
                    <h1 className="text-2xl font-semibold">Settings</h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sections.map((section) => (
                            <Link
                                key={section.title}
                                href={section.href}
                                className="p-6 border rounded-xl hover:bg-muted transition shadow-sm"
                            >
                                <div className="text-xl font-medium">{section.title}</div>
                                <div className="text-sm text-muted-foreground">{section.description}</div>
                            </Link>
                        ))}
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
