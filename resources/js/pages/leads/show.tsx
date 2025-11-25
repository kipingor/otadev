import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { useState } from 'react';
import LeadDocumentUploader from '@/pages/leads/lead-document-uploader';
import { useLeadDocumentsRealtime } from '@/hooks/use-lead-documents-realtime';


export default function LeadShow() {
    const { props } = usePage<any>();
    const lead = props.lead;


    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Leads', href: '/leads' },
        { title: lead?.title ?? 'Lead', href: `/leads/${lead?.id}` },
    ];


    const [documents, setDocuments] = useState<any[]>(lead?.leadDocuments ?? []);
    const [uploading, setUploading] = useState(false);

    const statusBadge = (status: string | undefined) => {
        const s = (status || 'unknown').toLowerCase();
        const map: Record<string, string> = {
            processing: 'bg-yellow-100 text-yellow-800',
            succeeded: 'bg-green-100 text-green-800',
            failed: 'bg-red-100 text-red-800',
            pending: 'bg-gray-100 text-gray-800',
            unknown: 'bg-gray-100 text-gray-800',
        };
        const classes = map[s] ?? map.unknown;
        return (
            <span className={`inline-flex items-center gap-2 px-2 py-0.5 text-xs font-medium rounded ${classes}`}>
                {s === 'processing' && (
                    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                )}
                <span className="capitalize">{s}</span>
            </span>
        );
    };

    useLeadDocumentsRealtime(lead?.id, (event: any) => {
        // event contains document_id, lead_id, status, ai_summary
        setDocuments((prev) => {
            const idx = prev.findIndex((d) => d.id === event.document_id);
            if (idx !== -1) {
                const copy = [...prev];
                copy[idx] = { ...copy[idx], status: event.status, ai_summary: event.ai_summary };
                return copy;
            }
            // not found, append
            return [...prev, { id: event.document_id, status: event.status, ai_summary: event.ai_summary }];
        });
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={lead?.title ?? 'Lead'} />


            <div className="space-y-4">
                <h2 className="text-xl font-semibold">{lead?.title}</h2>
                <div className="prose">{lead?.description}</div>


                <section>
                    <h3 className="font-semibold">AI Summary</h3>
                    <pre className="whitespace-pre-wrap">{JSON.stringify(lead?.metadata ?? {}, null, 2)}</pre>
                </section>

                <section>
                    <h3 className="font-semibold">Documents</h3>
                    <div className="space-y-2">
                        {documents.map((d) => (
                            <div key={d.id} className="p-3 border rounded">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <strong>{d.original_name ?? d.filename ?? `Document ${d.id}`}</strong>
                                        <div className="text-sm text-gray-500">Uploaded: {d.created_at ? new Date(d.created_at).toLocaleString() : '—'}</div>
                                    </div>
                                    <div className="flex-shrink-0">
                                        {statusBadge(d.status)}
                                    </div>
                                </div>
                                {d.ai_summary?.summary && (
                                    <div className="mt-2 prose">
                                        <h4>AI Summary</h4>
                                        <pre className="whitespace-pre-wrap">{d.ai_summary.summary}</pre>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-4">
                        <h4 className="font-medium">Upload new document</h4>
                        <LeadDocumentUploader leadId={lead?.id} onUploadStart={() => setUploading(true)} onUploadComplete={(docId: number, doc: any) => {
                            setUploading(false);
                            setDocuments((prev) => [doc, ...prev]);
                        }} />
                        {uploading && <div className="text-sm text-muted">Uploading...</div>}
                    </div>
                </section>


                <section>
                    <h3 className="font-semibold">Clarifying Questions</h3>
                    <ul>
                        {lead?.questions?.map((q: any) => (
                            <li key={q.id}>{q.question}</li>
                        ))}
                    </ul>
                </section>
            </div>
        </AppLayout>
    );
}