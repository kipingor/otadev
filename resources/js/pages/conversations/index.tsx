import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage } from "@inertiajs/react";
import { route } from 'ziggy-js';

export default function ConversationIndex() {
    const { conversations } = usePage().props as any;

    return (
        <AppLayout>
            <Head title="Conversations" />
            <div className="flex h-full flex-1 flex-col gap-8 p-6">
                <h1 className="text-2xl font-bold mb-4">Conversations</h1>

                <div className="space-y-4">
                    {conversations.data.map((c: any) => (
                        <Link
                            key={c.id}
                            href={route("conversations.show", c.id)}
                            className="block p-4 border rounded-lg hover:bg-muted"
                        >
                            <p className="font-semibold">{c.title}</p>
                            <p className="text-sm text-gray-600">{c.created_at}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
