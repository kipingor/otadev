import AppLayout from '@/layouts/app-layout';
import { Head } from "@inertiajs/react";
import { Card, CardContent } from "@/components/ui/card";

export default function ConversationShow({ conversation, messages }: any) {
    return (
        <AppLayout>
            <Head title='New Conversation' />
            <div className="p-6 max-w-2xl mx-auto space-y-6"></div>

            <Card className="p-6 space-y-4"></Card>
        </AppLayout>
    );
}
