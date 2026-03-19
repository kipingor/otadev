import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Conversations', href: '/conversations' }];

export default function ConversationIndex() {
    const { conversations } = usePage().props as any;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Conversations" />
            <div className="flex h-full flex-1 flex-col gap-8 p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Conversations</h1>
                    <Link
                        href="/conversations/create"
                        className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                    >
                        New Conversation
                    </Link>
                </div>

                {conversations?.data?.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                        No conversations yet.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {conversations?.data?.map((c: any) => (
                            <Link
                                key={c.id}
                                // FIX: was route("conversations.show", c.id) — Ziggy, wrong name
                                href={`/conversations/${c.id}`}
                                className="block p-4 border rounded-lg hover:bg-muted transition-colors"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">
                                            {c.lead?.title ?? c.message?.slice(0, 60) ?? 'Conversation'}
                                        </p>
                                        {c.message && (
                                            <p className="text-sm text-muted-foreground truncate mt-0.5">
                                                {c.message}
                                            </p>
                                        )}
                                    </div>
                                    <time className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                                        {new Date(c.created_at).toLocaleDateString()}
                                    </time>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {conversations?.meta?.last_page > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                        {conversations.meta.links?.map((link: any, i: number) => (
                            link.url ? (
                                <Link
                                    key={i}
                                    href={link.url}
                                    className={`px-3 py-1 rounded text-sm border ${
                                        link.active
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'hover:bg-muted border-border'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ) : (
                                <span
                                    key={i}
                                    className="px-3 py-1 rounded text-sm border border-border text-muted-foreground"
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            )
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}