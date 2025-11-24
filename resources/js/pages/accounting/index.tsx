import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Accounting', href: '/accounting' },
];

export default function AccountingIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Accounting" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Accounting</h1>
                </div>
                <div className="flex-1 rounded-xl border border-sidebar-border/70 p-6">
                    <p className="text-muted-foreground">Accounting dashboard coming soon...</p>
                </div>
            </div>
        </AppLayout>
    );
}

