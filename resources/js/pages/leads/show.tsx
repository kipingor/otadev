import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { useState } from 'react';
import LeadDocumentUploader from '@/pages/leads/lead-document-uploader';
import { useLeadDocumentsRealtime } from '@/hooks/use-lead-documents-realtime';
import Badge from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText, Clock, CheckCircle2, AlertCircle } from 'lucide-react';


export default function LeadShow() {
    const { props } = usePage<any>();
    const lead = props.lead;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Leads', href: '/leads' },
        { title: lead?.title ?? 'Lead', href: `/leads/${lead?.id}` },
    ];

    const [documents, setDocuments] = useState<any[]>(lead?.leadDocuments ?? []);
    const [uploading, setUploading] = useState(false);

    const getStatusVariant = (status: string | undefined): 'default' | 'secondary' | 'destructive' | 'outline' => {
        const s = (status || 'unknown').toLowerCase();
        switch (s) {
            case 'processing':
                return 'secondary';
            case 'succeeded':
                return 'default';
            case 'failed':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const getStatusIcon = (status: string | undefined) => {
        const s = (status || 'unknown').toLowerCase();
        switch (s) {
            case 'processing':
                return <Loader2 className="h-3 w-3 animate-spin" />;
            case 'succeeded':
                return <CheckCircle2 className="h-3 w-3" />;
            case 'failed':
                return <AlertCircle className="h-3 w-3" />;
            case 'pending':
                return <Clock className="h-3 w-3" />;
            default:
                return <FileText className="h-3 w-3" />;
        }
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

            <div className='flex h-full flex-1 flex-col gap-8 p-6'>
                <div className="space-y-6">
                    {/* Lead Header */}
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{lead?.title}</h1>
                        {lead?.description && (
                            <p className="text-muted-foreground mt-2">{lead?.description}</p>
                        )}
                    </div>

                    {/* AI Summary Section */}
                    {lead?.metadata && Object.keys(lead?.metadata).length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">AI Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <pre className="bg-muted p-4 rounded-md text-sm overflow-auto max-h-48 whitespace-pre-wrap break-words">
                                    {JSON.stringify(lead?.metadata, null, 2)}
                                </pre>
                            </CardContent>
                        </Card>
                    )}

                    {/* Documents Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Documents</CardTitle>
                            <CardDescription>
                                {documents.length === 0
                                    ? 'No documents uploaded yet'
                                    : `${documents.length} document${documents.length !== 1 ? 's' : ''} uploaded`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Document List */}
                            {documents.length > 0 && (
                                <div className="space-y-3">
                                    {documents.map((d) => (
                                        <div
                                            key={d.id}
                                            className="flex items-start justify-between gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                    <h4 className="font-medium truncate">
                                                        {d.original_name ?? d.filename ?? `Document ${d.id}`}
                                                    </h4>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {d.created_at
                                                        ? new Date(d.created_at).toLocaleString()
                                                        : 'Recently uploaded'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <Badge status={d.status} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* AI Summary for Each Document */}
                            {documents.some((d) => d.ai_summary?.summary) && (
                                <div className="space-y-4 mt-6 pt-6 border-t">
                                    {documents
                                        .filter((d) => d.ai_summary?.summary)
                                        .map((d) => (
                                            <div key={d.id} className="space-y-2">
                                                <h5 className="font-medium text-sm">
                                                    AI Summary: {d.original_name ?? d.filename ?? `Document ${d.id}`}
                                                </h5>
                                                <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-40 whitespace-pre-wrap break-words">
                                                    {d.ai_summary.summary}
                                                </pre>
                                            </div>
                                        ))}
                                </div>
                            )}

                            {/* Upload Section */}
                            <div className="mt-6 pt-6 border-t">
                                <h4 className="font-medium mb-4">Upload new document</h4>
                                <LeadDocumentUploader
                                    leadId={lead?.id}
                                    onUploadStart={() => setUploading(true)}
                                    onUploadComplete={(docId: number, doc: any) => {
                                        setUploading(false);
                                        setDocuments((prev) => [doc, ...prev]);
                                    }}
                                />
                                {uploading && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Processing document...
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Questions Section */}
                    {lead?.questions && lead?.questions.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Clarifying Questions</CardTitle>
                                <CardDescription>
                                    {lead?.questions.length} question{lead?.questions.length !== 1 ? 's' : ''} to address
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {lead?.questions.map((q: any) => (
                                        <li key={q.id} className="flex items-start gap-3 p-3 rounded-md bg-muted/50">
                                            <span className="text-muted-foreground text-sm">•</span>
                                            <span className="text-sm">{q.question}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}