import AppLayout from '@/layouts/app-layout';
import { PageHeader } from '@/components/ui/page-header';
import { LeadForm } from '@/components/forms/lead-form';
import { Head, useForm, usePage, router } from '@inertiajs/react';

export default function LeadEdit({ lead }: { lead: any }) {
    const handleSubmit = (data) => {
        router.put(`/leads/${lead.id}`, data);
    }; 

    return (
        <AppLayout>
            <PageHeader
                title="Edit Lead"
                breadcrumbs={[
                    { title: 'Leads', href: '/leads' },
                    { title: `${lead?.title ?? 'Lead'}`, href: `/leads/${lead?.id}` },
                    { title: `Edit: ${lead?.title ?? 'Lead'}` },
                ]}
            />

            <div className="mt-6">
                <LeadForm
                    lead={lead}
                    onSubmit={handleSubmit}
                    submitLabel="Update Lead"
                />
            </div>    
        </AppLayout>
    );
}
