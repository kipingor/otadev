import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import ExpenseCard from '@/pages/expenses/expense-card';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Expenses', href: '/expenses' }];

export default function ExpensesIndex() {
    const { props } = usePage<any>();
    const expenses = props.expenses?.data ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Expenses" />
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Expenses</h1>
                <Link href="/expenses/create"><Button>New Expense</Button></Link>
            </div>

            <div className="space-y-4">
                {expenses.map((e: any) => <ExpenseCard key={e.id} expense={e} />)}
            </div>
        </AppLayout>
    );
}
