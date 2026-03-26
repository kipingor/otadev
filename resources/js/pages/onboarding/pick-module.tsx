import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle2, Loader2, Users, Columns, BookUser } from 'lucide-react';
import type { Module } from '@/types/tenant';

interface Props {
    free_modules: Module[];
    all_modules: Module[];
    current_modules: string[];
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    Users, Columns, BookUser,
};

export default function PickModule({ free_modules, all_modules, current_modules }: Props) {
    const { data, setData, post, processing } = useForm({
        module_key: current_modules[0] ?? '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!data.module_key) return;
        post('/onboarding/pick-module');
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
            <Head title="Pick Your Module" />

            <div className="w-full max-w-2xl space-y-6">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-2xl font-bold tracking-tight">Choose your free module</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Pick one module to start with. You can add more by upgrading your plan.
                    </p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center gap-2">
                    {['Workspace', 'Module', 'Done'].map((step, i) => (
                        <div key={step} className="flex flex-1 items-center gap-2">
                            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold
                                ${i === 0 ? 'bg-primary/20 text-primary' : i === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                {i === 0 ? '✓' : i + 1}
                            </div>
                            <span className={`text-xs ${i === 1 ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                                {step}
                            </span>
                            {i < 2 && <div className="flex-1 h-px bg-border" />}
                        </div>
                    ))}
                </div>

                {/* Free module picker */}
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                        {free_modules.map((mod) => {
                            const selected = data.module_key === mod.key;
                            const Icon = ICON_MAP[mod.icon ?? ''] ?? Users;
                            return (
                                <button
                                    key={mod.key}
                                    type="button"
                                    onClick={() => setData('module_key', mod.key)}
                                    className={cn(
                                        'relative rounded-xl border-2 p-4 text-left transition-all',
                                        selected
                                            ? 'border-primary bg-primary/5 shadow-md'
                                            : 'border-border bg-card hover:border-primary/40 hover:shadow-sm',
                                    )}
                                >
                                    {selected && (
                                        <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-primary" />
                                    )}
                                    <Icon className={cn('h-7 w-7 mb-3', selected ? 'text-primary' : 'text-muted-foreground')} />
                                    <p className="font-semibold text-sm">{mod.name}</p>
                                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{mod.description}</p>
                                    <Badge className="mt-2 bg-emerald-100 text-emerald-700 text-[10px]">Free</Badge>
                                </button>
                            );
                        })}
                    </div>

                    {/* All modules teaser (locked) */}
                    <Card className="p-4 bg-muted/40">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            More modules available on paid plans
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {all_modules
                                .filter(m => !m.is_free)
                                .map(m => (
                                    <Badge key={m.key} variant="outline" className="text-xs text-muted-foreground">
                                        🔒 {m.name}
                                    </Badge>
                                ))}
                        </div>
                    </Card>

                    <div className="flex gap-3">
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={!data.module_key || processing}
                        >
                            {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Start with {free_modules.find(m => m.key === data.module_key)?.name ?? '…'}
                        </Button>
                        <Button variant="outline" asChild>
                            <a href="/subscription/plans">View all plans</a>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
