import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Sparkles, Calendar, DollarSign, Building2 } from 'lucide-react';
import { useRef } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tenders', href: '/tenders' },
    { title: 'Upload Tender', href: '/tenders/create' },
];

export default function TenderCreate() {
    const fileRef = useRef<HTMLInputElement>(null);
    const { data, setData, post, processing, errors, progress } = useForm<any>({
        title: '', issuer: '', reference_number: '', submission_deadline: '',
        estimated_value: '', currency: 'USD', notes: '', document: null,
    });

    const [fileName, setFileName] = [data.document?.name ?? null, () => {}];

    function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setData('document', file);
        // Auto-fill title from filename if empty
        if (!data.title) {
            setData('title', file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Upload Tender" />
            <div className="max-w-2xl mx-auto p-6 space-y-6">

                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Upload Tender / RFP</h1>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-indigo-500" />
                        AI will analyse the document, extract requirements, build a checklist, and guide you through the application
                    </p>
                </div>

                <form
                    onSubmit={e => { e.preventDefault(); post('/tenders', { forceFormData: true }); }}
                    className="space-y-5"
                    encType="multipart/form-data"
                >
                    {/* Document upload */}
                    <Card className="border-indigo-200 bg-indigo-50/20">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2"><Upload className="h-4 w-4 text-indigo-600" />Tender Document</CardTitle>
                            <CardDescription>Upload the RFP, tender notice, or bid document (PDF, DOC, TXT). AI will read and analyse it.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div
                                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                                    data.document ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/30'
                                }`}
                                onClick={() => fileRef.current?.click()}
                            >
                                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt,.md" onChange={pickFile} className="hidden" name="document" />
                                {data.document ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <FileText className="h-8 w-8 text-indigo-500" />
                                        <div className="text-left">
                                            <p className="font-medium text-indigo-700">{data.document.name}</p>
                                            <p className="text-xs text-indigo-400">{(data.document.size / 1024 / 1024).toFixed(1)} MB — Click to change</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-sm font-medium text-gray-600">Click to upload or drag and drop</p>
                                        <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, TXT up to 20MB</p>
                                    </>
                                )}
                            </div>
                            {progress && (
                                <div className="mt-2">
                                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progress.percentage ?? 0}%` }} />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Basic info */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />Tender Details</CardTitle>
                            <CardDescription>Provide what you know — AI will fill in the rest from the document.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <Label>Tender Title *</Label>
                                <Input value={data.title} onChange={e => setData('title', e.target.value)} placeholder="Provision of IT Services 2026" className={`mt-1 ${errors.title ? 'border-red-400' : ''}`} />
                                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                            </div>
                            <div>
                                <Label>Issuing Organisation</Label>
                                <div className="relative mt-1">
                                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input value={data.issuer} onChange={e => setData('issuer', e.target.value)} placeholder="Ministry of Finance" className="pl-9" />
                                </div>
                            </div>
                            <div>
                                <Label>Reference / Tender No.</Label>
                                <Input value={data.reference_number} onChange={e => setData('reference_number', e.target.value)} placeholder="MOF/2026/IT/001" className="mt-1 font-mono" />
                            </div>
                            <div>
                                <Label>Submission Deadline</Label>
                                <div className="relative mt-1">
                                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input type="date" value={data.submission_deadline} onChange={e => setData('submission_deadline', e.target.value)} className="pl-9" />
                                </div>
                            </div>
                            <div>
                                <Label>Estimated Value</Label>
                                <div className="relative mt-1">
                                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input type="number" value={data.estimated_value} onChange={e => setData('estimated_value', e.target.value)} placeholder="500000" className="pl-9" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-gray-500">Notes (optional)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea value={data.notes} onChange={e => setData('notes', e.target.value)} placeholder="Any initial thoughts, constraints, or context about this bid…" rows={3} />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3 pt-1">
                        <Button type="button" variant="outline" onClick={() => history.back()}>Cancel</Button>
                        <Button type="submit" disabled={processing} className="gap-2 min-w-[200px]">
                            {processing
                                ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Analysing document…</>
                                : <><Sparkles className="h-4 w-4" />Create &amp; Analyse</>
                            }
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}