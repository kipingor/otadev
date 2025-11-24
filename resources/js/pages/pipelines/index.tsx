import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import PipelineBoard from '@/components/pipeline/pipeline-board';
import useLeadsRealtime from '@/hooks/use-leads';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pipeline', href: '/pipelines' },
];

export default function PipelineIndex() {
    useLeadsRealtime();

    const { props } = usePage<any>();
    const stages = props.stages ?? [];
    const leadsByStage = props.leadsByStage ?? {}; // { stage_key: [leads] }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pipeline" />
            <PipelineBoard stages={stages} leadsByStage={leadsByStage} />
        </AppLayout>
    );
}