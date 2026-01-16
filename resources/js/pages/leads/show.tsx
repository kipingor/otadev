import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { useState } from 'react';
import LeadDocumentUploader from '@/pages/leads/lead-document-uploader';
import { useLeadDocumentsRealtime } from '@/hooks/use-lead-documents-realtime';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Clock, CheckCircle2, AlertCircle, Edit, ArrowLeft, Download } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { LeadStatusBadge } from '@/components/ui/status-badge';
import { route } from 'ziggy-js';

interface LeadDocument {
    id: number;
    filename: string;
    original_name: string;
    status: string;
    ai_summary?: {
        summary?: string;
        key_points?: string[];
    };
    created_at: string;
    file_url?: string;
}

interface Lead {
    id: number;
    title: string;
    description?: string;
    status: string;
    metadata?: Record<string, any>;
    leadDocuments?: LeadDocument[];
    questions?: Array<{ id: number; question: string }>;
    owner?: { name: string };
    created_at: string;
}

export default function LeadShow() {
    const { props } = usePage<{ lead: Lead }>();
    const lead = props.lead;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Leads', href: route('leads.index') },
        { title: lead?.title ?? 'Lead', href: route('leads.show', lead?.id) },
    ];

    const [documents, setDocuments] = useState<LeadDocument[]>(lead?.leadDocuments ?? []);
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
        setDocuments((prev) => {
            const idx = prev.findIndex((d) => d.id === event.document_id);
            if (idx !== -1) {
                const copy = [...prev];
                copy[idx] = { 
                    ...copy[idx], 
                    status: event.status, 
                    ai_summary: event.ai_summary 
                };
                return copy;
            }
            return [...prev, { 
                id: event.document_id, 
                status: event.status, 
                ai_summary: event.ai_summary,
                filename: '',
                original_name: '',
                created_at: new Date().toISOString(),
            }];
        });
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={lead?.title ?? 'Lead'} />

            <div className='flex h-full flex-1 flex-col gap-6 p-6'>
                {/* Lead Header */}
                <PageHeader
                    title={lead?.title ?? 'Lead'}
                    description={lead?.description}
                    backButton={{
                        label: 'Back to Leads',
                        href: route('leads.index'),
                    }}
                    actions={[
                        {
                            label: 'Edit Lead',
                            href: route('leads.edit', lead?.id),
                            icon: Edit,
                            variant: 'outline',
                        },
                    ]}
                />

                {/* Lead Info Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <CardTitle>Lead Information</CardTitle>
                                <CardDescription>
                                    Created {new Date(lead?.created_at).toLocaleDateString()}
                                </CardDescription>
                            </div>
                            <LeadStatusBadge status={lead?.status} size="lg" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            {lead?.owner && (
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">Owner</div>
                                    <div className="mt-1">{lead.owner.name}</div>
                                </div>
                            )}
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">Status</div>
                                <div className="mt-1 capitalize">{lead?.status?.replace(/_/g, ' ')}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* AI Summary Section */}
                {lead?.metadata && Object.keys(lead?.metadata).length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">AI-Generated Summary</CardTitle>
                            <CardDescription>
                                Automatically extracted information and insights
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-muted p-4 rounded-lg">
                                <pre className="text-sm overflow-auto max-h-64 whitespace-pre-wrap break-words font-mono">
                                    {JSON.stringify(lead?.metadata, null, 2)}
                                </pre>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Documents Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Documents</CardTitle>
                                <CardDescription>
                                    {documents.length === 0
                                        ? 'No documents uploaded yet'
                                        : `${documents.length} document${documents.length !== 1 ? 's' : ''} uploaded`}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Document List */}
                        {documents.length > 0 && (
                            <div className="space-y-3">
                                {documents.map((d) => (
                                    <div
                                        key={d.id}
                                        className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                                    >
                                        <div className="rounded-full bg-muted p-2">
                                            {getStatusIcon(d.status)}
                                        </div>

                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className="font-medium truncate">
                                                    {d.original_name ?? d.filename ?? `Document ${d.id}`}
                                                </h4>
                                                <Badge variant={getStatusVariant(d.status)}>
                                                    {d.status}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {d.created_at
                                                    ? new Date(d.created_at).toLocaleString()
                                                    : 'Recently uploaded'}
                                            </p>

                                            {/* AI Summary for Document */}
                                            {d.ai_summary?.summary && (
                                                <div className="mt-3 pt-3 border-t">
                                                    <p className="text-xs font-medium text-muted-foreground mb-2">
                                                        AI Summary
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {d.ai_summary.summary}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {d.file_url && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                asChild
                                            >
                                                <a 
                                                    href={d.file_url} 
                                                    download
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Upload Section */}
                        <div className={documents.length > 0 ? "mt-6 pt-6 border-t" : ""}>
                            <h4 className="font-medium mb-4">Upload New Document</h4>
                            <LeadDocumentUploader
                                leadId={lead?.id}
                                onUploadStart={() => setUploading(true)}
                                onUploadComplete={(docId: number, doc: any) => {
                                    setUploading(false);
                                    setDocuments((prev) => [doc, ...prev]);
                                }}
                            />
                            {uploading && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3 p-3 bg-muted rounded-lg">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Processing document with AI...
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
                                AI-generated questions to better understand this lead
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {lead?.questions.map((q: any, idx: number) => (
                                    <div 
                                        key={q.id} 
                                        className="flex gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                    >
                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                                            {idx + 1}
                                        </div>
                                        <p className="text-sm flex-1">{q.question}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}