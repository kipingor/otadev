import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
    variant?: 'card' | 'table' | 'list' | 'form';
    count?: number;
    className?: string;
}

export function LoadingState({
    variant = 'card',
    count = 3,
    className,
}: LoadingStateProps) {
    if (variant === 'card') {
        return (
            <div className={cn('grid gap-6 md:grid-cols-2 lg:grid-cols-3', className)}>
                {Array.from({ length: count }).map((_, i) => (
                    <CardSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (variant === 'table') {
        return (
            <div className={cn('space-y-3', className)}>
                {Array.from({ length: count }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        );
    }

    if (variant === 'list') {
        return (
            <div className={cn('space-y-2', className)}>
                {Array.from({ length: count }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
        );
    }

    if (variant === 'form') {
        return (
            <div className={cn('space-y-4', className)}>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-32" />
            </div>
        );
    }

    return null;
}

function CardSkeleton() {
    return (
        <div className="rounded-lg border p-6 space-y-4">
            <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-20 w-full" />
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
            </div>
        </div>
    );
}