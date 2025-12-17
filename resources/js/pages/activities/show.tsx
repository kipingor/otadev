import AppLayout from '@/layouts/app-layout';
import { Head } from "@inertiajs/react";

export default function ActivityShow({ activity }: any) {
    return (
        <AppLayout>
            <Head title={`Activity #${activity.id}`} />

            <h1 className="text-2xl font-bold mb-4">
                Activity #{activity.id}
            </h1>

            <div className="space-y-2">
                <p><strong>Type:</strong> {activity.type}</p>
                <p><strong>Description:</strong> {activity.description}</p>
                <p><strong>User:</strong> {activity.user?.name}</p>
                <p><strong>Created:</strong> {activity.created_at}</p>
            </div>
        </AppLayout>
    );
}
