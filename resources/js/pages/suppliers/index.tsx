import AppLayout from '@/layouts/app-layout';
import { Head, Link } from "@inertiajs/react";
import { type BreadcrumbItem } from '@/types';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Mail, Phone } from 'lucide-react';
import { route } from 'ziggy-js';

interface Supplier {
    id: number;
    name: string;
    email: string;
    phone: string;
    created_at?: string;
}

interface Props {
    suppliers: Supplier[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Suppliers', href: route('web.suppliers.index') },
];

export default function SupplierIndex({ suppliers }: Props) {
    const columns: Column<Supplier>[] = [
        {
            key: 'name',
            label: 'Name',
            sortable: true,
            searchable: true,
            render: (supplier) => (
                <div className="font-medium">{supplier.name}</div>
            ),
        },
        {
            key: 'email',
            label: 'Email',
            sortable: true,
            searchable: true,
            render: (supplier) => (
                <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a 
                        href={`mailto:${supplier.email}`}
                        className="text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {supplier.email}
                    </a>
                </div>
            ),
        },
        {
            key: 'phone',
            label: 'Phone',
            sortable: true,
            render: (supplier) => (
                <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a 
                        href={`tel:${supplier.phone}`}
                        className="text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {supplier.phone}
                    </a>
                </div>
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'text-right',
            render: (supplier) => (
                <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    onClick={(e) => e.stopPropagation()}
                >
                    <Link href={route('web.suppliers.edit', supplier.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                    </Link>
                </Button>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Suppliers" />

            <div className='flex h-full flex-1 flex-col gap-6 p-6'>
                {/* Header */}
                <PageHeader
                    title="Suppliers"
                    description="Manage your supplier contacts and information."
                    actions={[
                        {
                            label: 'Add Supplier',
                            href: route('web.suppliers.create'),
                            icon: Plus,
                            variant: 'default',
                        },
                    ]}
                />

                {/* Suppliers Table */}
                <DataTable
                    data={suppliers}
                    columns={columns}
                    searchable
                    searchPlaceholder="Search suppliers by name, email..."
                    onRowClick={(supplier) => {
                        // Navigate to supplier show or edit page
                        window.location.href = route('web.suppliers.show', supplier.id);
                    }}
                    emptyState={{
                        title: 'No suppliers found',
                        description: 'Get started by adding your first supplier.',
                        action: {
                            label: 'Add Supplier',
                            href: route('web.suppliers.create'),
                        },
                    }}
                />
            </div>
        </AppLayout>
    );
}