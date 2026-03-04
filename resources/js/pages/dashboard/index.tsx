import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Dashboard } from '@/components/dashboard';

export default function DashboardPage() {
    return (
        <>
            <Head title="Dashboard" />
            <AppLayout>
                <div className="container mx-auto py-6">
                    <Dashboard />
                </div>
            </AppLayout>
        </>
    );
}