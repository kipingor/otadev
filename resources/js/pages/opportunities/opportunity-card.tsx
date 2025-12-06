import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Link } from '@inertiajs/react';

export default function OpportunityCard({ opportunity }: { opportunity: any }) {
    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };
    return (
        <Card className="border-0 bg-linear-to-br from-card to-card/50 shadow-sm transition-shadow duration-300 hover:shadow-lg">
            <CardHeader className="pd-4">
                <CardTitle className="text-lg font-semibold">
                    {opportunity.title ?? 'Untitled'}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <span className="rounded-full bg-muted px-3 py-1 text-xs tracking-wide uppercase">
                    {opportunity.stage}
                </span>
                <p className="mt-2 line-clamp-3 text-sm">
                    {opportunity.summary ?? 'No summary provided yet.'}
                </p>
                <div className="text-sm text-muted-foreground">
                    Lead: {opportunity.lead?.title ?? 'n/a'} • Owner:{' '}
                    {opportunity.owner?.name ?? 'n/a'}
                </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">
                    {opportunity.currency ?? 'USD'}{' '}
                    {Number(opportunity.estimated_value ?? 0).toLocaleString()}
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-auto p-0 text-xs"
                >
                    <Link
                        href={`/opportunities/${opportunity.id}`}
                        className="p-1"
                    >
                        View →
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
