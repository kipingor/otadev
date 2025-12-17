import AppLayout from '@/layouts/app-layout';
import { Head } from "@inertiajs/react";
import { Card, CardContent } from "@/components/ui/card";

export default function ConversationShow({ conversation, messages }: any) {
    return (
        <AppLayout>
            <Head title={conversation.title} />

            <h1 className="text-2xl font-bold mb-4">{conversation.title}</h1>

            <Card>
                <CardContent className="space-y-4">
                    {messages.map((m: any) => (
                        <div key={m.id} className="border-b pb-2">
                            <p className="font-bold">{m.user?.name}</p>
                            <p>{m.body}</p>
                            <p className="text-sm text-gray-500">{m.created_at}</p>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </AppLayout>
    );
}
