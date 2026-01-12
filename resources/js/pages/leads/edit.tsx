import AppLayout from '@/layouts/app-layout';
import { PageHeader } from '@/components/ui/page-header';
import { LeadForm } from '@/components/forms/lead-form';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function EditLead({ lead, users, pipelineStages }) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (data) => {
        setIsSubmitting(true);
        
        router.put(`/leads/${lead.id}`, data, {
            onSuccess: () => {
                toast.success('Lead updated successfully!');
            },
            onError: (errors) => {
                toast.error('Failed to update lead');
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
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
                    initialData={lead}
                    users={users}
                    pipelineStages={pipelineStages}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                />
            </div>    
        </AppLayout>
    );
}
