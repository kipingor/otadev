import AppLayout from '@/layouts/app-layout';
import { OpportunityKanban } from '@/components/opportunities';

export default function OpportunitiesPage() {
    return (
        <AppLayout>
            <OpportunityKanban />
        </AppLayout>
    );
}