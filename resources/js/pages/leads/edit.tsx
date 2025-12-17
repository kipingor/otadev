import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import LeadDocumentUploader from '@/pages/leads/lead-document-uploader';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function LeadEdit() {
    const { props } = usePage<any>();
    const lead = props.lead ?? {};

    const form = useForm({
        title: lead.title ?? '',
        description: lead.description ?? '',
        type: lead.type ?? 'conversation',
        document_id: lead.document_id ?? lead.document?.id ?? null,
    });

    const [uploading, setUploading] = useState(false);

    const type = String(form.data.type || 'conversation');

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.put(`/leads/${lead.id}`);
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Leads', href: '/leads' },
        { title: lead?.title ?? 'Lead', href: `/leads/${lead?.id}` },
        { title: 'Edit', href: `/leads/${lead?.id}/edit` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit: ${lead?.title ?? 'Lead'}`} />

            <div className="rounded bg-white p-6 shadow">
                <form onSubmit={onSubmit} className="space-y-8">
                    <div>
                        <Label className="mb-2 block">Title</Label>
                        <Input
                            placeholder="Lead Title"
                            value={form.data.title as string}
                            onChange={(e) => form.setData('title', e.target.value)}
                        />
                        {form.errors.title && (
                            <p className="text-destructive text-sm mt-1">{form.errors.title}</p>
                        )}
                    </div>

                    <div>
                        <Label className="mb-2 block">Type</Label>
                        <Select
                            onValueChange={(val: string) => form.setData('type', val)}
                            value={String(form.data.type)}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Lead Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Lead Type</SelectLabel>
                                    <SelectItem value="conversation">Conversation</SelectItem>
                                    <SelectItem value="document">Document</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        {form.errors.type && (
                            <p className="text-destructive text-sm mt-1">{form.errors.type}</p>
                        )}
                    </div>

                    {type === 'document' && (
                        <LeadDocumentUploader
                            leadId={lead?.id}
                            onUploadStart={() => setUploading(true)}
                            onUploadComplete={(docId: number) => {
                                form.setData('document_id', docId);
                                setUploading(false);
                            }}
                        />
                    )}

                    <div>
                        <Label className="mb-2 block">Description</Label>
                        <Textarea
                            placeholder="Lead Description"
                            value={form.data.description as string}
                            onChange={(e: any) => form.setData('description', e.target.value)}
                        />
                        {form.errors.description && (
                            <p className="text-destructive text-sm mt-1">{form.errors.description}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button type="submit" disabled={uploading} className="btn-primary">
                            Save Changes
                        </Button>
                        <Button variant="ghost" asChild>
                            <a href={`/leads/${lead?.id}`}>Cancel</a>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
