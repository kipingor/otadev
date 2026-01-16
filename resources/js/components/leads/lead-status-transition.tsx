import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { LeadStatusBadge } from '@/components/ui/status-badge';
import { Textarea } from '@/components/ui/textarea';
import { LeadStatus } from '@/types/models';
import { Lead } from '@/types/models.types';
import { router } from '@inertiajs/react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface LeadStatusTransitionProps {
    lead: Lead;
    onUpdate?: () => void;
}

// Define valid status transitions
const VALID_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
    [LeadStatus.NEW]: [
        LeadStatus.CONTACTED,
        LeadStatus.QUALIFIED,
        LeadStatus.LOST,
        LeadStatus.ARCHIVED,
    ],
    [LeadStatus.CONTACTED]: [
        LeadStatus.QUALIFIED,
        LeadStatus.LOST,
        LeadStatus.ARCHIVED,
    ],
    [LeadStatus.QUALIFIED]: [
        LeadStatus.PROPOSAL_SENT,
        LeadStatus.LOST,
        LeadStatus.ARCHIVED,
    ],
    [LeadStatus.PROPOSAL_SENT]: [
        LeadStatus.NEGOTIATION,
        LeadStatus.LOST,
        LeadStatus.ARCHIVED,
    ],
    [LeadStatus.NEGOTIATION]: [
        LeadStatus.WON,
        LeadStatus.LOST,
        LeadStatus.ARCHIVED,
    ],
    [LeadStatus.WON]: [LeadStatus.ARCHIVED],
    [LeadStatus.LOST]: [LeadStatus.ARCHIVED],
    [LeadStatus.ARCHIVED]: [],
};

export function LeadStatusTransition({ lead, onUpdate }: LeadStatusTransitionProps) {
    const [open, setOpen] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<LeadStatus | null>(null);
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validTransitions = VALID_TRANSITIONS[lead.status as LeadStatus] || [];

    const handleStatusSelect = (status: LeadStatus) => {
        if (status === LeadStatus.LOST) {
            // Show reason dialog for LOST status
            setSelectedStatus(status);
            setIsDialogOpen(true);
            setOpen(false);
        } else {
            handleTransition(status);
        }
    };

    const handleTransition = async (status: LeadStatus, lostReason?: string) => {
        setIsSubmitting(true);

        try {
            router.post(
                `/api/v1/leads/${lead.id}/transition`,
                {
                    status,
                    reason: lostReason,
                },
                {
                    onSuccess: () => {
                        toast.success(`Lead status updated to ${status}`);
                        setIsDialogOpen(false);
                        setReason('');
                        onUpdate?.();
                    },
                    onError: (errors) => {
                        toast.error(
                            errors.message || 'Failed to update lead status',
                        );
                    },
                    onFinish: () => {
                        setIsSubmitting(false);
                    },
                },
            );
        } catch (error) {
            toast.error('Failed to update lead status');
            setIsSubmitting(false);
        }
    };

    const handleLostSubmit = () => {
        if (!reason.trim()) {
            toast.error('Please provide a reason for marking this lead as lost');
            return;
        }
        handleTransition(LeadStatus.LOST, reason);
    };

    if (validTransitions.length === 0) {
        return <LeadStatusBadge status={lead.status} />;
    }

    return (
        <>
            <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                        <LeadStatusBadge status={lead.status} showIcon={false} />
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {validTransitions.map((status) => (
                        <DropdownMenuItem
                            key={status}
                            onClick={() => handleStatusSelect(status)}
                            disabled={isSubmitting}
                        >
                            <LeadStatusBadge status={status} />
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Lost Reason Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mark Lead as Lost</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for marking this lead as lost.
                            This helps improve future lead qualification.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason</Label>
                            <Textarea
                                id="reason"
                                placeholder="e.g., Budget constraints, competitor chosen, no longer interested..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsDialogOpen(false);
                                setReason('');
                            }}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleLostSubmit}
                            disabled={isSubmitting || !reason.trim()}
                        >
                            {isSubmitting && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Mark as Lost
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}