import { arrayMove } from '@dnd-kit/sortable';


export const handleDragEnd = ({ event, columns, setColumns }: any) => {
    const { active, over } = event;
    if (!over) return;


    const activeId = active.id;
    const overId = over.id;


    if (activeId === overId) return;


    const source = columns.find((col: any) => col.leads.some((l: any) => l.id === activeId));
    const destination = columns.find((col: any) => col.leads.some((l: any) => l.id === overId));


    if (!source || !destination) return;


    const sourceIndex = source.leads.findIndex((l: any) => l.id === activeId);
    const destinationIndex = destination.leads.findIndex((l: any) => l.id === overId);


    const newColumns = [...columns];


    // remove from source
    const [moved] = source.leads.splice(sourceIndex, 1);


    // add to destination using arrayMove for sorted placement
    destination.leads.splice(destinationIndex, 0, moved);


    setColumns(newColumns);


    // TODO: POST update to server
    // axios.post('/api/pipeline/move', { lead_id: activeId, to_column: destination.id });
};