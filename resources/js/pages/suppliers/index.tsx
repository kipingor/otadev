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

export default function SupplierIndex({ suppliers }: any) {
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

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead className='text-right'></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {suppliers.map((s: any) => (
                            <TableRow key={s.id}>
                                <TableCell>{s.name}</TableCell>
                                <TableCell>{s.email}</TableCell>
                                <TableCell>{s.phone}</TableCell>
                                <TableCell className='text-right'>
                                    <Link
                                        href={`/suppliers/${s.id}/edit`}
                                        className='text-blue-600'
                                    >
                                        Edit
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}                        
                    </TableBody>
                </Table>
            </div>


        </AppLayout>
    );
}
