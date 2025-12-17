import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage } from "@inertiajs/react";
import { type BreadcrumbItem } from '@/types';
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Supplier', href: '/supplier' },
];

export default function SupplierShow({ supplier }: any) {
    // const { props } = usePage<any>();
    // const supplier = props.supplier;
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Suppliers" />

            <div className='flex h-full flex-col gap-8 p-6'>
                {/* Header with title and "New Supplier" button */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
                        <p className='text-muted-foreground'>Something internesting about suppliers</p>
                    </div>
                    <Button
                        variant='outline'
                        size='sm'
                        asChild
                        className='h-8 px-3 text-xs'
                    >
                        <Link href={"/suppliers.create"} className='p-1'>
                            New Supplier +
                        </Link>
                    </Button>                    

                </div>
                <div>
                    Show the supplier??
                </div>
            </div>
        </AppLayout>
    );
}