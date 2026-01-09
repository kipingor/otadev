import { Link } from '@inertiajs/react';
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Lead } from '@/types/models.types';
import { formatDistanceToNow } from 'date-fns';
import { route } from 'ziggy-js';

interface LeadCardProps {
    lead: Lead;
}

const statusColors = {
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    contacted: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    qualified: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    proposal_sent: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    negotiation: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    won: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    lost: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

const statusLabels = {
    new: 'New',
    contacted: 'Contacted',
    qualified: 'Qualified',
    proposal_sent: 'Proposal Sent',
    negotiation: 'Negotiation',
    won: 'Won',
    lost: 'Lost',
    archived: 'Archived',
};

export default function LeadCard({ lead }: LeadCardProps) {
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <Link href={`leads/${lead.id}`}>
            <Card className="transition-all hover:shadow-lg cursor-pointer h-full">
                <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg line-clamp-1">
                            {lead.title}
                        </CardTitle>
                        <Badge 
                            variant="secondary"
                            className={statusColors[lead.status]}
                        >
                            {statusLabels[lead.status]}
                        </Badge>
                    </div>
                    
                    {lead.description && (
                        <CardDescription className="line-clamp-2 mt-2">
                            {lead.description}
                        </CardDescription>
                    )}
                </CardHeader>

                <CardContent>
                    <div className="flex flex-col gap-3">
                        {/* Owner */}
                        {lead.owner && (
                            <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs">
                                        {getInitials(lead.owner.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-muted-foreground">
                                    {lead.owner.name}
                                </span>
                            </div>
                        )}

                        {/* Pipeline Stage */}
                        {lead.pipeline_stage && (
                            <div className="flex items-center gap-2">
                                <div 
                                    className="h-2 w-2 rounded-full"
                                    style={{ 
                                        backgroundColor: lead.pipeline_stage.color || '#64748b' 
                                    }}
                                />
                                <span className="text-sm text-muted-foreground">
                                    {lead.pipeline_stage.name}
                                </span>
                            </div>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                            <span className="capitalize">{lead.type}</span>
                            <span>
                                {formatDistanceToNow(new Date(lead.created_at), { 
                                    addSuffix: true 
                                })}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}