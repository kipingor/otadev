import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ExpenseCard, { type Expense } from '@/pages/expenses/expense-card';
import { type BreadcrumbItem } from '@/types';
import { Receipt, Plus, DollarSign } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Expenses', href: '/expenses' }];

const fmt = (amount: number, currency = 'USD') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

const CATEGORIES = ['travel', 'accommodation', 'software', 'hardware', 'meals', 'supplies', 'marketing', 'utilities', 'other'];

export default function ExpensesIndex() {
    const { props } = usePage<any>();
    const expenses: Expense[] = props.expenses?.data ?? [];
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [projectFilter, setProjectFilter] = useState('all');

    // Compute project list from data
    const projects = Array.from(
        new Map(
            expenses.filter((e) => e.project).map((e) => [e.project!.id, e.project!])
        ).values()
    );

    const filtered = expenses.filter((e) => {
        const matchesCat  = categoryFilter === 'all' || e.category === categoryFilter;
        const matchesProj = projectFilter === 'all' || String(e.project_id) === projectFilter;
        const matchesSearch = !search || e.description.toLowerCase().includes(search.toLowerCase()) || (e.vendor ?? '').toLowerCase().includes(search.toLowerCase());
        return matchesCat && matchesProj && matchesSearch;
    });

    const totalFiltered = filtered.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalAll      = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    // Category breakdown for summary
    const byCategory: Record<string, number> = {};
    expenses.forEach((e) => {
        const cat = e.category ?? 'other';
        byCategory[cat] = (byCategory[cat] ?? 0) + Number(e.amount);
    });
    const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Expenses" />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Expenses</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Track project and operational expenses</p>
                    </div>
                    <Link href="/expenses/create">
                        <Button><Plus className="h-4 w-4 mr-2" />New Expense</Button>
                    </Link>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                        </div>
                        <p className="text-2xl font-bold">{fmt(totalAll)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{expenses.length} records</p>
                    </div>
                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Receipt className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-medium text-muted-foreground">Filtered Total</p>
                        </div>
                        <p className="text-2xl font-bold">{fmt(totalFiltered)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{filtered.length} records shown</p>
                    </div>
                    {topCategory && (
                        <div className="rounded-lg border bg-card p-4">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Top Category</p>
                            <p className="text-lg font-bold capitalize">{topCategory[0]}</p>
                            <p className="text-sm text-muted-foreground">{fmt(topCategory[1])}</p>
                        </div>
                    )}
                </div>

                {/* Filters */}
                <div className="flex gap-3 flex-wrap">
                    <Input
                        placeholder="Search description or vendor..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-xs"
                    />
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All categories</SelectItem>
                            {CATEGORIES.map((c) => (
                                <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {projects.length > 0 && (
                        <Select value={projectFilter} onValueChange={setProjectFilter}>
                            <SelectTrigger className="w-52">
                                <SelectValue placeholder="All projects" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All projects</SelectItem>
                                {projects.map((p) => (
                                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                {/* List */}
                {filtered.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                        <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No expenses found</p>
                        <p className="text-sm mt-1">
                            {expenses.length === 0
                                ? 'Record your first expense to get started.'
                                : 'Try adjusting your filters.'}
                        </p>
                        {expenses.length === 0 && (
                            <Link href="/expenses/create" className="mt-4 inline-block">
                                <Button variant="outline"><Plus className="h-4 w-4 mr-2" />Add Expense</Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((e) => <ExpenseCard key={e.id} expense={e} />)}
                    </div>
                )}

                {/* Pagination */}
                {props.expenses?.links && (
                    <div className="flex gap-2 justify-center">
                        {props.expenses.links.map((link: any, i: number) => (
                            link.url ? (
                                <Link key={i} href={link.url}
                                    className={`px-3 py-1.5 rounded text-sm border ${link.active ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }} />
                            ) : (
                                <span key={i} className="px-3 py-1.5 rounded text-sm border text-muted-foreground opacity-50"
                                    dangerouslySetInnerHTML={{ __html: link.label }} />
                            )
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}