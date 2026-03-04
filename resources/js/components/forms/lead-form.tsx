import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { router } from '@inertiajs/react';

// Zod Schema - Aligned with backend validation
const leadFormSchema = z.object({
    id: z.number().optional(),
    
    title: z.string()
        .min(1, 'Title is required')
        .max(255, 'Title must be less than 255 characters'),
    
    type: z.enum(['document', 'conversation']).refine(
        (val) => val !== undefined && val !== null,
        { message: 'Please select a lead type' }
    ),
    
    description: z.string()
        .max(5000, 'Description must be less than 5000 characters')
        .optional()
        .or(z.literal('')),
    
    owner_id: z.number().optional(),
    
    pipeline_stage_id: z.number({ message: 'Please select a pipeline stage' }),
    
    status: z.enum([
        'new',
        'contacted',
        'qualified',
        'proposal_sent',
        'negotiation',
        'won',
        'lost',
        'archived',
    ]).optional(),
    
    estimated_value: z.number().min(0, 'Value must be positive').nullable().optional(),
    
    metadata: z.object({
        source: z.string().max(255).optional().or(z.literal('')),
        tags: z.string().max(50).optional().or(z.literal('')),
    }).optional(),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

interface LeadFormProps {
    initialData?: Partial<LeadFormValues>;
    users: Array<{ id: number; name: string }>;
    pipelineStages: Array<{ id: number; name: string }>;
    onSubmit: (data: LeadFormValues) => void;
    isSubmitting?: boolean;
    submitLabel?: string;
    showStatus?: boolean;
}

export function LeadForm({
    initialData,
    users,
    pipelineStages,
    onSubmit,
    isSubmitting = false,
    submitLabel = 'Save Lead',
    showStatus = false,
}: LeadFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm<LeadFormValues>({
        resolver: zodResolver(leadFormSchema),
        defaultValues: initialData || {
            type: 'conversation',
            metadata: {
                source: '',
                tags: '',
            },
        },
    });

    const selectedType = watch('type');
    const selectedOwnerId = watch('owner_id');
    const selectedPipelineStageId = watch('pipeline_stage_id');
    const selectedStatus = watch('status');

    const handleCancel = () => {
        if (initialData?.id) {
            router.visit(`/leads/${initialData.id}`);
        } else {
            router.visit('/leads');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Lead Information</CardTitle>
                    <CardDescription>
                        Enter the details for this lead. Fields marked with * are required.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">
                            Title <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="title"
                            placeholder="Enter lead title"
                            {...register('title')}
                            aria-invalid={errors.title ? 'true' : 'false'}
                        />
                        {errors.title && (
                            <p className="text-sm text-destructive">{errors.title.message}</p>
                        )}
                    </div>

                    {/* Type */}
                    <div className="space-y-2">
                        <Label htmlFor="type">
                            Lead Type <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            onValueChange={(value) => setValue('type', value as 'document' | 'conversation')}
                            defaultValue={selectedType}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select lead type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="document">Document</SelectItem>
                                <SelectItem value="conversation">Conversation</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.type && (
                            <p className="text-sm text-destructive">{errors.type.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            {selectedType === 'document'
                                ? 'Document leads are created from uploaded files'
                                : 'Conversation leads are created from chat interactions'}
                        </p>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Enter lead description (optional)"
                            rows={4}
                            {...register('description')}
                        />
                        {errors.description && (
                            <p className="text-sm text-destructive">{errors.description.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Maximum 5000 characters
                        </p>
                    </div>

                    {/* Owner */}
                    <div className="space-y-2">
                        <Label htmlFor="owner_id">
                            Owner
                        </Label>
                        <Select 
                            onValueChange={(value) => setValue('owner_id', parseInt(value))}
                            value={selectedOwnerId?.toString()}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select owner (defaults to you)" />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map((user) => (
                                    <SelectItem key={user.id} value={user.id.toString()}>
                                        {user.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.owner_id && (
                            <p className="text-sm text-destructive">{errors.owner_id.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            If not selected, you will be assigned as the owner
                        </p>
                    </div>

                    {/* Pipeline Stage */}
                    <div className="space-y-2">
                        <Label htmlFor="pipeline_stage_id">
                            Pipeline Stage <span className="text-destructive">*</span>
                        </Label>
                        <Select 
                            onValueChange={(value) => setValue('pipeline_stage_id', parseInt(value))}
                            value={selectedPipelineStageId?.toString()}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select pipeline stage" />
                            </SelectTrigger>
                            <SelectContent>
                                {pipelineStages.map((stage) => (
                                    <SelectItem key={stage.id} value={stage.id.toString()}>
                                        {stage.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.pipeline_stage_id && (
                            <p className="text-sm text-destructive">{errors.pipeline_stage_id.message}</p>
                        )}
                    </div>

                    {/* Status (Optional - shown in edit mode) */}
                    {showStatus && (
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select 
                                onValueChange={(value) => setValue('status', value as any)}
                                value={selectedStatus}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="new">New</SelectItem>
                                    <SelectItem value="contacted">Contacted</SelectItem>
                                    <SelectItem value="qualified">Qualified</SelectItem>
                                    <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                                    <SelectItem value="negotiation">Negotiation</SelectItem>
                                    <SelectItem value="won">Won</SelectItem>
                                    <SelectItem value="lost">Lost</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.status && (
                                <p className="text-sm text-destructive">{errors.status.message}</p>
                            )}
                        </div>
                    )}

                    {/* Estimated Value */}
                    <div className="space-y-2">
                        <Label htmlFor="estimated_value">
                            Estimated Value (USD)
                        </Label>
                        <Input
                            id="estimated_value"
                            type="number"
                            min="0"
                            step="100"
                            placeholder="e.g., 50000"
                            {...register('estimated_value')}
                            aria-invalid={errors.estimated_value ? 'true' : 'false'}
                        />
                        {errors.estimated_value && (
                            <p className="text-sm text-destructive">
                                {errors.estimated_value.message}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Estimated monetary value of this lead opportunity
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Metadata Card (Advanced Options) */}
            <Card>
                <CardHeader>
                    <CardTitle>Additional Information</CardTitle>
                    <CardDescription>
                        Optional metadata for tracking and organization
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Source */}
                    <div className="space-y-2">
                        <Label htmlFor="metadata.source">Source</Label>
                        <Input
                            id="metadata.source"
                            placeholder="e.g., Website, Referral, Event"
                            {...register('metadata.source')}
                        />
                        {errors.metadata?.source && (
                            <p className="text-sm text-destructive">{errors.metadata.source.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            How did this lead come to you? (Max 255 characters)
                        </p>
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                        <Label htmlFor="metadata.tags">Tags</Label>
                        <Input
                            id="metadata.tags"
                            placeholder="e.g., urgent, high-value"
                            {...register('metadata.tags')}
                        />
                        {errors.metadata?.tags && (
                            <p className="text-sm text-destructive">{errors.metadata.tags.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Comma-separated tags for categorization (Max 50 characters)
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4">
                <Button 
                    type="button" 
                    variant="outline" 
                    disabled={isSubmitting}
                    onClick={handleCancel}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? 'Saving...' : submitLabel}
                </Button>
            </div>
        </form>
    );
}