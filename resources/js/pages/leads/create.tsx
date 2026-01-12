import { PageHeader } from '@/components/ui/page-header';
import AppLayout from '@/layouts/app-layout';
import { LeadForm } from '@/components/forms/lead-form';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function CreateLead({ users, pipelineStages }) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (data) => {
        setIsSubmitting(true);
        
        router.post('/leads', data, {
            onSuccess: () => {
                toast.success('Lead created successfully!');
            },
            onError: (errors) => {
                toast.error('Failed to create lead');
                console.error(errors);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <AppLayout>
            <PageHeader
                title="Create Lead"
                breadcrumbs={[
                    { title: 'Leads', href: '/leads' },
                    { title: 'Create', href: '/leads/create' },
                ]}
            />

            <div className="mt-6">
                <LeadForm
                    users={users}
                    pipelineStages={pipelineStages}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                />
            </div>
        </AppLayout>
    );
}
