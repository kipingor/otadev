import React, { useRef } from 'react';


export default function LeadDocumentUploader({ onUploadComplete, onUploadStart }: any) {
    const ref = useRef<HTMLInputElement | null>(null);


    async function upload(file: File) {
        onUploadStart?.();


        const form = new FormData();
        form.append('file', file);


        const resp = await fetch('/api/v1/upload/lead-document', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                // Note: auth cookie / sanctum expected
            },
            body: form,
        });


        const json = await resp.json();
        if (json.ok) {
            onUploadComplete?.(json.document.id);
        } else {
            alert('Upload failed');
        }
    }


    return (
        <div>
            <input ref={ref} type="file" accept=".pdf,.doc,.docx" onChange={(e) => e.target.files && upload(e.target.files[0])} />
        </div>
    );
}