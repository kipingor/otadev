import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
    variant?: 'spinner' | 'skeleton' | 'card' | 'table';
    text?: string;
    className?: string;
}

export function LoadingState({ variant = 'spinner', text = 'Loading...', className = '' }: LoadingStateProps) {
    if (variant === 'spinner') {
        return (
            <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                {text && <p className="mt-2 text-sm text-muted-foreground">{text}</p>}
            </div>
        );
    }

    if (variant === 'skeleton') {
        return (
            <div className={`space-y-4 ${className}`}>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        );
    }

    if (variant === 'card') {
        return (
            <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-24 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (variant === 'table') {
        return (
            <div className={`space-y-2 ${className}`}>
                <Skeleton className="h-10 w-full" />
                {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        );
    }

    return null;
}