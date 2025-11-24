import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';


export default function LeadShow() {
    const { props } = usePage<any>();
    const lead = props.lead;


    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Leads', href: '/leads' },
        { title: lead?.title ?? 'Lead', href: `/leads/${lead?.id}` },
    ];


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