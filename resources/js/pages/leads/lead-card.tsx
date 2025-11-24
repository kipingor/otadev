import React from 'react';
import { Link } from '@inertiajs/react';


export default function LeadCard({ lead }: { lead: any }) {
    return (
        <div className="rounded-lg border p-4 bg-white/60 dark:bg-black/40">
            <h3 className="font-semibold">{lead.title ?? 'Untitled'}</h3>
            <p className="text-sm text-muted-foreground">{lead.type}</p>
            <p className="mt-2 text-sm line-clamp-3">{lead.description}</p>
            <div className="mt-3 flex items-center justify-between">
                <Link href={`/leads/${lead.id}`} className="text-sm underline">View</Link>
                <span className="text-xs text-muted-foreground">{lead.created_at}</span>
            </div>
        </div>
    );
}