import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import LeadDocumentUploader from '@/pages/leads/lead-document-uploader';
import { type BreadcrumbItem } from '@/types';


const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Leads', href: '/leads' },
    { title: 'Create', href: '/leads/create' },
];

export default function LeadCreate() {
    const form = useForm({ title: '', description: '', type: 'conversation', document_id: null });
    const [uploading, setUploading] = useState(false);


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Lead" />


            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    form.post('/leads');
                }}
                className="space-y-4"
            >
                <div>
                    <label className="block text-sm font-medium">Title</label>
                    <input value={form.data.title} onChange={(e) => {
                        const v = (e.target as HTMLInputElement).value;
                        (form as any).setData('title', v);
                    }} className="input" />
                </div>


                <div>
                    <label className="block text-sm font-medium">Type</label>
                    <select value={form.data.type} onChange={(e) => {
                        const v = (e.target as HTMLSelectElement).value;
                        (form as any).setData('type', v);
                    }} className="input">
                        <option value="conversation">Conversation</option>
                        <option value="document">Document</option>
                    </select>
                </div>


                {form.data.type === 'document' && (
                    <LeadDocumentUploader
                        onUploadStart={() => setUploading(true)}
                        onUploadComplete={(docId: number) => {
                            const _docId = docId as any;
                            (form as any).setData('document_id', _docId);
                            setUploading(false);
                        }}
                    />
                )}


                <div>
                    <label className="block text-sm font-medium">Description</label>
                    <textarea value={form.data.description} onChange={(e) => (form as any).setData('description', (e.target as HTMLTextAreaElement).value)} className="textarea" />
                </div>


                <div>
                    <button type="submit" disabled={uploading} className="btn-primary">Create Lead</button>
                </div>
            </form>
        </AppLayout>
    );
}