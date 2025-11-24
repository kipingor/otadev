import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import LeadCard from '@/pages/leads/lead-card';


const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Leads', href: '/leads' },
];


export default function LeadsIndex() {
    // `props` expected: leads (pagination)
    const { props } = usePage<any>();
    const leads = props.leads?.data ?? [];


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Leads" />


            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Leads</h1>
                <Link href="/leads/create" className="btn">New Lead</Link>
            </div>


            <div className="grid gap-4 md:grid-cols-3 mt-4">
                {leads.map((lead: any) => (
                    <LeadCard key={lead.id} lead={lead} />
                ))}
            </div>


            {/* simple pagination */}
            <div className="mt-6">{/* render pagination links via server */}</div>
        </AppLayout>
    );
}