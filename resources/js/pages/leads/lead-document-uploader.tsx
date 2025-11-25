import React, { useRef, useState } from 'react';
import Button from '@/components/ui/Button';


export default function LeadDocumentUploader({ onUploadComplete, onUploadStart, leadId }: any) {
    const ref = useRef<HTMLInputElement | null>(null);
    const [progress, setProgress] = useState<number | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function upload(file: File) {
        onUploadStart?.();
        setBusy(true);
        setError(null);
        setProgress(0);

        const form = new FormData();
        form.append('file', file);
        if (leadId) {
            form.append('lead_id', String(leadId));
        }

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/v1/upload/lead-document');
        xhr.setRequestHeader('Accept', 'application/json');

        xhr.upload.onprogress = function (e) {
            if (e.lengthComputable) {
                const pct = Math.round((e.loaded / e.total) * 100);
                setProgress(pct);
            }
        };

        xhr.onload = function () {
            setBusy(false);
            setProgress(null);
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const json = JSON.parse(xhr.responseText);
                    if (json.ok) {
                        onUploadComplete?.(json.document.id, json.document);
                    } else {
                        setError(json.message || 'Upload failed');
                    }
                } catch (err) {
                    setError('Invalid server response');
                }
            } else {
                setError(`Upload failed (${xhr.status})`);
            }
        };

        xhr.onerror = function () {
            setBusy(false);
            setProgress(null);
            setError('Network error during upload');
        };

        xhr.send(form);
    }

    return (
        <div>
            <label className="inline-flex items-center gap-2">
                <input
                    ref={ref}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    disabled={busy}
                    onChange={(e) => e.target.files && upload(e.target.files[0])}
                    className="hidden"
                />
                <Button type="button" onClick={() => ref.current?.click()} disabled={busy}>
                    {busy ? 'Uploading...' : 'Choose document'}
                </Button>
            </label>

            {progress !== null && (
                <div className="mt-2 w-full bg-gray-100 rounded overflow-hidden">
                    <div className="h-2 bg-sky-500" style={{ width: `${progress}%` }}></div>
                    <div className="text-xs text-gray-500 mt-1">{progress}%</div>
                </div>
            )}

            {error && <div role="alert" className="text-sm text-red-600 mt-2">{error}</div>}
        </div>
    );
}