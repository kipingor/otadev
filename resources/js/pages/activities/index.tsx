import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage } from "@inertiajs/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ActivityIndex() {
    const { activities } = usePage().props as any;

    return (
        <AppLayout>
            <Head title="Activities" />

            <div className="flex h-full flex-1 flex-col gap-8 p-6">
                <div className="flex justify-between mb-6">
                    <h1 className="text-2xl font-bold">Activities</h1>
                </div>

                <Card>
                    <CardContent>
                        <table className="table-auto w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="py-2 text-left">ID</th>
                                    <th className="text-left">Type</th>
                                    <th className="text-left">Description</th>
                                    <th className="text-left">Created At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activities.data.map((a: any) => (
                                    <tr key={a.id} className="border-b">
                                        <td className="py-2">{a.id}</td>
                                        <td>{a.type}</td>
                                        <td>{a.description}</td>
                                        <td>{a.created_at}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
