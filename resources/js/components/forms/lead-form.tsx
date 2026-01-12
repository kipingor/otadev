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

// Zod Schema
const leadFormSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
    type: z.enum(['document', 'conversation'], {
        required_error: 'Please select a lead type',
    }),
    description: z.string().optional(),
    owner_id: z.number({
        required_error: 'Please select an owner',
    }),
    pipeline_stage_id: z.number({
        required_error: 'Please select a pipeline stage',
    }),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

interface LeadFormProps {
    initialData?: Partial<LeadFormValues>;
    users: Array<{ id: number; name: string }>;
    pipelineStages: Array<{ id: number; name: string }>;
    onSubmit: (data: LeadFormValues) => void;
    isSubmitting?: boolean;
}

export function LeadForm({
    initialData,
    users,
    pipelineStages,
    onSubmit,
    isSubmitting = false,
}: LeadFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm<LeadFormValues>({
        resolver: zodResolver(leadFormSchema),
        defaultValues: initialData,
    });

    const selectedType = watch('type');

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Lead Information</CardTitle>
                    <CardDescription>
                        Enter the details for this lead. All fields marked with * are required.
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
                    </div>

                    {/* Owner */}
                    <div className="space-y-2">
                        <Label htmlFor="owner_id">
                            Owner <span className="text-destructive">*</span>
                        </Label>
                        <Select onValueChange={(value) => setValue('owner_id', parseInt(value))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select owner" />
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
                    </div>

                    {/* Pipeline Stage */}
                    <div className="space-y-2">
                        <Label htmlFor="pipeline_stage_id">
                            Pipeline Stage <span className="text-destructive">*</span>
                        </Label>
                        <Select onValueChange={(value) => setValue('pipeline_stage_id', parseInt(value))}>
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
                </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? 'Saving...' : 'Save Lead'}
                </Button>
            </div>
        </form>
    );
}