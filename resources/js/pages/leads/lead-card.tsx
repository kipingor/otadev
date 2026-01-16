import { Link } from '@inertiajs/react';
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Lead } from '@/types/models.types';
import { formatDistanceToNow } from 'date-fns';
import { LeadStatusBadge } from '@/components/ui/status-badge';
import { route } from 'ziggy-js';

interface LeadCardProps {
    lead: Lead;
}

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
        <Link href={route('leads.show', lead.id)}>
            <Card className="transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer h-full group">
                <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">
                            {lead.title}
                        </CardTitle>
                        <LeadStatusBadge status={lead.status} />
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
                                    <AvatarImage src={lead.owner.avatar} alt={lead.owner.name} />
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