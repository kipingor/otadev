import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from "@inertiajs/react";
import { type BreadcrumbItem } from '@/types';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Trash2, Mail, Phone, MapPin, Globe } from 'lucide-react';
import { useDeleteConfirmation } from '@/components/ui/confirm-dialog';
import { route } from 'ziggy-js';

interface Supplier {
    id: number;
    name: string;
    email: string;
    phone: string;
    address?: string;
    website?: string;
    notes?: string;
    contact_person?: string;
    created_at: string;
    updated_at: string;
}

interface Props {
    supplier: Supplier;
}

export default function SupplierShow({ supplier }: Props) {
    const { confirmDelete, ConfirmDialog } = useDeleteConfirmation();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Suppliers', href: route('suppliers.index') },
        { title: supplier?.name ?? 'Supplier', href: route('suppliers.show', supplier?.id) },
    ];

    const handleDelete = async () => {
        await confirmDelete({
            itemName: supplier.name,
            onConfirm: async () => {
                router.delete(route('suppliers.destroy', supplier.id), {
                    onSuccess: () => {
                        router.visit(route('suppliers.index'));
                    },
                });
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={supplier?.name ?? 'Supplier'} />
            <ConfirmDialog />

            <div className='flex h-full flex-1 flex-col gap-6 p-6'>
                {/* Header */}
                <PageHeader
                    title={supplier?.name}
                    description="View and manage supplier information"
                    backButton={{
                        label: 'Back to Suppliers',
                        href: route('suppliers.index'),
                    }}
                    actions={[
                        {
                            label: 'Edit',
                            href: route('suppliers.edit', supplier?.id),
                            icon: Edit,
                            variant: 'outline',
                        },
                        {
                            label: 'Delete',
                            onClick: handleDelete,
                            icon: Trash2,
                            variant: 'destructive',
                        },
                    ]}
                />

                {/* Content Grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content - Contact Information */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Contact Information</CardTitle>
                                <CardDescription>
                                    Primary contact details for this supplier
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Email */}
                                <div className="flex items-start gap-3">
                                    <div className="rounded-full bg-muted p-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-muted-foreground">
                                            Email
                                        </div>
                                        <a 
                                            href={`mailto:${supplier.email}`}
                                            className="text-primary hover:underline"
                                        >
                                            {supplier.email}
                                        </a>
                                    </div>
                                </div>

                                {/* Phone */}
                                <div className="flex items-start gap-3">
                                    <div className="rounded-full bg-muted p-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-muted-foreground">
                                            Phone
                                        </div>
                                        <a 
                                            href={`tel:${supplier.phone}`}
                                            className="text-primary hover:underline"
                                        >
                                            {supplier.phone}
                                        </a>
                                    </div>
                                </div>

                                {/* Address */}
                                {supplier.address && (
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-full bg-muted p-2">
                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-muted-foreground">
                                                Address
                                            </div>
                                            <div className="whitespace-pre-line">
                                                {supplier.address}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Website */}
                                {supplier.website && (
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-full bg-muted p-2">
                                            <Globe className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-muted-foreground">
                                                Website
                                            </div>
                                            <a 
                                                href={supplier.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline"
                                            >
                                                {supplier.website}
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Notes Section */}
                        {supplier.notes && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Notes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="whitespace-pre-line text-muted-foreground">
                                        {supplier.notes}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <aside className="space-y-6">
                        {/* Details Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Contact Person */}
                                {supplier.contact_person && (
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground">
                                            Contact Person
                                        </div>
                                        <div className="mt-1">
                                            {supplier.contact_person}
                                        </div>
                                    </div>
                                )}

                                {/* Created Date */}
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">
                                        Added On
                                    </div>
                                    <div className="mt-1">
                                        {new Date(supplier.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </div>
                                </div>

                                {/* Updated Date */}
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">
                                        Last Updated
                                    </div>
                                    <div className="mt-1">
                                        {new Date(supplier.updated_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <a
                                    href={`mailto:${supplier.email}`}
                                    className="flex items-center gap-2 rounded-lg border p-3 hover:bg-muted transition-colors"
                                >
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">Send Email</span>
                                </a>
                                <a
                                    href={`tel:${supplier.phone}`}
                                    className="flex items-center gap-2 rounded-lg border p-3 hover:bg-muted transition-colors"
                                >
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">Call Supplier</span>
                                </a>
                                {supplier.website && (
                                    <a
                                        href={supplier.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 rounded-lg border p-3 hover:bg-muted transition-colors"
                                    >
                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">Visit Website</span>
                                    </a>
                                )}
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </div>
        </AppLayout>
    );
}