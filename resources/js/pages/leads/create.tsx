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
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Leads', href: '/leads' },
    { title: 'Create', href: '/leads/create' },
];

export default function LeadCreate() {
    const form = useForm({
        title: '',
        description: '',
        type: 'conversation',
        document_id: null,
    });

    const [uploading, setUploading] = useState(false);

    const type = form.data.type as string;

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/leads');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Lead" />

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

                    <Button type="submit" disabled={uploading} className="btn-primary">
                        Create Lead
                    </Button>
                </form>
            </div>
        </AppLayout>
    );
}
