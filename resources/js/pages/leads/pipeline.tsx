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

    return (
        <AppLayout breadcrumbs={[{ title: 'Pipeline', href: '/pipeline' }]}>
            <Head title="Pipeline" />
            <div className="p-4 h-full">
                <PipelineBoard columns={pipelineColumns} setColumns={setPipelineColumns} />
            </div>
        </AppLayout>
    );
};

export default PipelinePage;