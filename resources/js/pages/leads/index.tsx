import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import leads from '@/routes/leads';
import LeadCard from '@/pages/leads/lead-card';
import { Button } from '@/components/ui/button';

const breadcrumbs: BreadcrumbItem[] = [
    { 
        title: 'Leads', 
        href: '/leads' 
    },
];


export default function LeadsIndex() {
    // `props` expected: leads (pagination)
    const { props } = usePage<any>();
    const leads = props.leads?.data ?? [];


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Leads" />

            <div className='flex h-full flex-1 flex-col gap-8 p-6'>
                {/* Header with title and "New Lead" button */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
                        <p className="text-muted-foreground">Manage your leads and track potential customers.</p>
                    </div>
                    {/* <Link href="/leads/create" className='inline-flex items-center justify-center whitespace-nowrap text-accent-foreground h-8 rounded-md px-3 gap-2 bg-emerald-600'>New Lead</Link> */}
                    <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="h-8 px-3 text-xs"
                    >
                        <Link href={`/leads/create`} className="p-1">
                            New Lead +
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-6 grid-col-1 md:grid-cols-2 lg:grid-cols-3 mt-4">
                    {leads.map((lead: any) => (
                        <LeadCard key={lead.id} lead={lead} />
                    ))}
                </div>
            </div>


            


            {/* simple pagination */}
            <div className="mt-6">{/* render pagination links via server */}</div>
        </AppLayout>
    );
}