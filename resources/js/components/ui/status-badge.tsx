import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LeadStatus } from '@/types/models';
import {
    CheckCircle2,
    Circle,
    Clock,
    FileText,
    MessageSquare,
    TrendingUp,
    XCircle,
    Archive,
} from 'lucide-react';

interface StatusBadgeProps {
    status: LeadStatus | string;
    showIcon?: boolean;
    className?: string;
}

const STATUS_CONFIG = {
    [LeadStatus.NEW]: {
        label: 'New',
        variant: 'default' as const,
        className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
        icon: Circle,
    },
    [LeadStatus.CONTACTED]: {
        label: 'Contacted',
        variant: 'default' as const,
        className: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400',
        icon: MessageSquare,
    },
    [LeadStatus.QUALIFIED]: {
        label: 'Qualified',
        variant: 'default' as const,
        className: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
        icon: CheckCircle2,
    },
    [LeadStatus.PROPOSAL_SENT]: {
        label: 'Proposal Sent',
        variant: 'default' as const,
        className: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
        icon: FileText,
    },
    [LeadStatus.NEGOTIATION]: {
        label: 'Negotiation',
        variant: 'default' as const,
        className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
        icon: TrendingUp,
    },
    [LeadStatus.WON]: {
        label: 'Won',
        variant: 'default' as const,
        className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        icon: CheckCircle2,
    },
    [LeadStatus.LOST]: {
        label: 'Lost',
        variant: 'default' as const,
        className: 'bg-red-500/10 text-red-700 dark:text-red-400',
        icon: XCircle,
    },
    [LeadStatus.ARCHIVED]: {
        label: 'Archived',
        variant: 'default' as const,
        className: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
        icon: Archive,
    },
};

export function StatusBadge({ status, showIcon = true, className }: StatusBadgeProps) {
    const config = STATUS_CONFIG[status as LeadStatus] || {
        label: status,
        variant: 'outline' as const,
        className: '',
        icon: Clock,
    };

    const Icon = config.icon;

    return (
        <Badge
            variant={config.variant}
            className={cn(config.className, 'gap-1', className)}
        >
            {showIcon && <Icon className="h-3 w-3" />}
            <span>{config.label}</span>
        </Badge>
    );
}