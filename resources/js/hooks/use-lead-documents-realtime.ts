import { useEffect } from 'react';
import { echo } from '@/lib/echo';

export function useLeadDocumentsRealtime(leadId: number | string, onUpdate: (payload: any) => void) {
    useEffect(() => {
        if (!leadId) return;

        const channel = (echo as any).private(`leads.${leadId}`);

        channel.listen('.lead.document.processed', (event: any) => {
            onUpdate(event);
        });

        return () => {
            try {
                (echo as any).leaveChannel(`private:leads.${leadId}`);
            } catch (e) {
                // ignore
            }
        };
    }, [leadId, onUpdate]);
}
