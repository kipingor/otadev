import { useState } from 'react';
import PipelineBoard from '@/components/pipeline/pipeline-board';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';


import { type FC } from 'react';

interface Lead {
    id: number | string;
    title: string;
    client_name: string;
}

interface PipelineColumn {
    id: string;
    title: string;
    leads: Lead[];
}

interface PipelinePageProps {
    columns: PipelineColumn[];
}

const PipelinePage: FC<PipelinePageProps> = ({ columns }) => {
    const [pipelineColumns, setPipelineColumns] = useState<PipelineColumn[]>(columns);

    // Map legacy `columns` prop into `stages` and `leadsByStage` expected by `PipelineBoard`
    const stages = pipelineColumns.map((c) => ({ key: c.id, name: c.title }));
    const leadsByStage: Record<string, Lead[]> = pipelineColumns.reduce((acc, c) => {
        acc[c.id] = c.leads;
        return acc;
    }, {} as Record<string, Lead[]>);

    return (
        <AppLayout breadcrumbs={[{ title: 'Pipeline', href: '/pipeline' }]}> 
            <Head title="Pipeline" />
            <div className="p-4 h-full">
                <PipelineBoard stages={stages} leadsByStage={leadsByStage} />
            </div>
        </AppLayout>
    );
};

export default PipelinePage;