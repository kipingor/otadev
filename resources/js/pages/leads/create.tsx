import { PageHeader } from '@/components/ui/page-header';
import AppLayout from '@/layouts/app-layout';
import { LeadForm } from '@/components/forms/lead-form';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useFormAutosave } from '@/hooks/use-form-autosave';

interface CreateLeadProps {
    users: Array<{ id: number; name: string }>;
    pipelineStages: Array<{ id: number; name: string }>;
}

export default function CreateLead({ users, pipelineStages }: CreateLeadProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { clearDraft } = useFormAutosave('lead_create');

    const handleSubmit = (data: any) => {
        setIsSubmitting(true);
        
        router.post('/leads', data, {
            onSuccess: (page) => {
                // Clear autosaved draft
                clearDraft();
                
                toast.success('Lead created successfully!');
                
                // Navigate to the created lead if ID is available in response
                const lead = (page.props as any).lead;
                if (lead?.id) {
                    router.visit(`/leads/${lead.id}`);
                } else {
                    // Fallback to leads list
                    router.visit('/leads');
                }
            },
            onError: (errors) => {
                console.error('Validation errors:', errors);
                
                // Show generic error toast
                toast.error('Failed to create lead', {
                    description: 'Please check the form for errors',
                });
                
                // Errors are automatically handled by the form component
                // via Inertia's error bag
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

            <div className="mt-6 max-w-4xl">
                <LeadForm
                    users={users}
                    pipelineStages={pipelineStages}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    submitLabel="Create Lead"
                    showStatus={false}
                />
            </div>
        </AppLayout>
    );
}