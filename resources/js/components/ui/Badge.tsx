import React from 'react';

export default function Badge({ status }: { status?: string }) {
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
}
