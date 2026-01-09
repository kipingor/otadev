import { Button } from '@/components/ui/button';
import { FormField, InputWithCount, TextareaWithCount } from '@/components/ui/form-field';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Lead, LeadType } from '@/types/models';
import { useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { type FormEvent } from 'react';
import { z } from 'zod';
import LeadDocumentUploader from '@/pages/leads/lead-document-uploader';

const leadSchema = z.object({
    title: z
        .string()
        .min(3, 'Title must be at least 3 characters')
        .max(255, 'Title cannot exceed 255 characters'),
    description: z.string().optional(),
    type: z.enum([LeadType.DOCUMENT, LeadType.CONVERSATION]),
    document_id: z.number().nullable(),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface LeadFormProps {
    lead?: Lead;
    onSubmit: (data: LeadFormData) => void;
    submitLabel?: string;
}

export function LeadForm({ lead, onSubmit, submitLabel = 'Save Lead' }: LeadFormProps) {
    const form = useForm<LeadFormData>({
        title: lead?.title || '',
        description: lead?.description || '',
        type: (lead?.type as LeadType) || LeadType.CONVERSATION,
        document_id: null,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        // Client-side validation
        try {
            leadSchema.parse(form.data);
            onSubmit(form.data);
        } catch (error) {
            if (error instanceof z.ZodError) {
                error.errors.forEach((err) => {
                    const field = err.path[0] as keyof LeadFormData;
                    form.setError(field, err.message);
                });
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <FormField
                label="Lead Title"
                error={form.errors.title}
                hint="A descriptive title helps identify this lead quickly"
                required
            >
                <InputWithCount
                    value={form.data.title}
                    onChange={(e) => form.setData('title', e.target.value)}
                    maxLength={255}
                    placeholder="e.g., Enterprise Software Deal"
                    disabled={form.processing}
                />
            </FormField>

            <FormField label="Lead Type" error={form.errors.type} required>
                <Select
                    value={form.data.type}
                    onValueChange={(value) => form.setData('type', value as LeadType)}
                    disabled={form.processing}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select lead type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={LeadType.CONVERSATION}>
                            Conversation
                        </SelectItem>
                        <SelectItem value={LeadType.DOCUMENT}>Document</SelectItem>
                    </SelectContent>
                </Select>
            </FormField>

            {form.data.type === LeadType.DOCUMENT && (
                <FormField
                    label="Upload Document"
                    error={form.errors.document_id}
                    hint="Upload a PDF or document for AI processing"
                >
                    <LeadDocumentUploader
                        onUploadStart={() => {}}
                        onUploadComplete={(docId) => {
                            form.setData('document_id', docId);
                        }}
                    />
                </FormField>
            )}

            <FormField
                label="Description"
                error={form.errors.description}
                hint="Optional: Add any additional details about this lead"
            >
                <TextareaWithCount
                    value={form.data.description || ''}
                    onChange={(e) => form.setData('description', e.target.value)}
                    maxLength={5000}
                    rows={4}
                    placeholder="Enter lead description..."
                    disabled={form.processing}
                />
            </FormField>

            <div className="flex items-center gap-2">
                <Button type="submit" disabled={form.processing}>
                    {form.processing && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {submitLabel}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    disabled={form.processing}
                    onClick={() => window.history.back()}
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
}