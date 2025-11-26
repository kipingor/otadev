import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import leads from '@/routes/leads';
import opportunities from '@/routes/opportunities';
import pipelines from '@/routes/pipelines';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { PieChart } from '@/components/charts/PieChart';
import { AreaChart } from '@/components/charts/AreaChart';
import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics';
import { useDashboardRealtime } from '@/hooks/use-dashboard-realtime';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, TrendingUp, Users, FileText, Target, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

function StatCard({ 
    title, 
    value, 
    href, 
    icon: Icon, 
    trend, 
    loading = false 
}: { 
    title: string; 
    value: string | number; 
    href?: any; 
    icon?: any;
    trend?: { value: number; label: string };
    loading?: boolean;
}) {
    return (
        <Card className="p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Skeleton className="h-8 w-20" />
                ) : (
                    <div className="text-2xl font-bold">{value}</div>
                )}
                {trend && !loading && (
                    <p className={`text-xs ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
                    </p>
                )}
            </CardContent>
            <CardFooter>
                {href ? (
                    <Link href={href} className="text-sm text-primary-600 hover:underline">
                        View all
                    </Link>
                ) : null}
            </CardFooter>
        </Card>
    );
}

export default function Dashboard() {
    const { props } = usePage();
    const initialData = (props as any)?.data?.metrics;
    
    const { data: metrics, isLoading, refetch, isFetching } = useDashboardMetrics(30000);
    
    // Enable real-time updates
    useDashboardRealtime();
    
    // Use real-time data if available, fallback to initial server data
    const currentMetrics = metrics || initialData;

    const formatCurrency = (value: number) => 
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

    const formatNumber = (value: number) => 
        new Intl.NumberFormat('en-US').format(value);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header with refresh button */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => refetch()}
                        disabled={isFetching}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {/* Overview Stats */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
                    <StatCard 
                        title="Leads" 
                        value={currentMetrics?.overview?.leads ?? '—'} 
                        href={leads.index()} 
                        icon={Users}
                        loading={isLoading}
                    />
                    <StatCard 
                        title="Opportunities" 
                        value={currentMetrics?.overview?.opportunities ?? '—'} 
                        href={opportunities.index()} 
                        icon={Target}
                        loading={isLoading}
                    />
                    <StatCard 
                        title="Open Pipeline" 
                        value={currentMetrics?.overview?.open_pipeline ?? '—'} 
                        href={pipelines.index()} 
                        icon={TrendingUp}
                        loading={isLoading}
                    />
                    <StatCard 
                        title="Documents" 
                        value={currentMetrics?.overview?.documents ?? '—'} 
                        href={leads.index()} 
                        icon={FileText}
                        loading={isLoading}
                    />
                    <StatCard 
                        title="Active Projects" 
                        value={currentMetrics?.overview?.active_projects ?? '—'} 
                        icon={Target}
                        loading={isLoading}
                    />
                    <StatCard 
                        title="Completed Tasks" 
                        value={currentMetrics?.overview?.completed_tasks ?? '—'} 
                        icon={CheckCircle}
                        loading={isLoading}
                    />
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Leads Over Time (30 Days)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-[300px] w-full" />
                            ) : (
                                <LineChart
                                    data={currentMetrics?.leads_over_time || []}
                                    xKey="formatted_date"
                                    yKey="leads"
                                    color="#3b82f6"
                                    formatTooltip={(value, name) => [
                                        `${value} leads`,
                                        'Leads'
                                    ]}
                                />
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue Over Time (6 Months)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-[300px] w-full" />
                            ) : (
                                <AreaChart
                                    data={currentMetrics?.revenue_over_time || []}
                                    xKey="formatted_month"
                                    yKey="revenue"
                                    color="#10b981"
                                    formatTooltip={(value, name) => [
                                        formatCurrency(value),
                                        'Revenue'
                                    ]}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Opportunity Pipeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-[300px] w-full" />
                            ) : (
                                <PieChart
                                    data={currentMetrics?.opportunity_pipeline || []}
                                    dataKey="count"
                                    nameKey="stage"
                                    formatTooltip={(value, name) => [
                                        `${value} opportunities`,
                                        name
                                    ]}
                                />
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Pipeline Value by Stage</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-[300px] w-full" />
                            ) : (
                                <BarChart
                                    data={currentMetrics?.opportunity_pipeline || []}
                                    xKey="stage"
                                    yKey="value"
                                    color="#8b5cf6"
                                    formatTooltip={(value, name) => [
                                        formatCurrency(value),
                                        'Value'
                                    ]}
                                />
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Task Completion</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-green-600">
                                            {currentMetrics?.task_completion?.completion_rate || 0}%
                                        </div>
                                        <div className="text-sm text-muted-foreground">Completion Rate</div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Completed</span>
                                            <span>{currentMetrics?.task_completion?.completed || 0}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>In Progress</span>
                                            <span>{currentMetrics?.task_completion?.in_progress || 0}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Pending</span>
                                            <span>{currentMetrics?.task_completion?.pending || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-3">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center space-x-3">
                                        <Skeleton className="h-8 w-8 rounded-full" />
                                        <div className="space-y-1 flex-1">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-3 w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {(currentMetrics?.recent_activity || []).map((activity, index) => (
                                    <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50">
                                        <div className={`w-2 h-2 rounded-full mt-2 ${
                                            activity.type === 'lead' ? 'bg-blue-500' : 'bg-green-500'
                                        }`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">{activity.title}</p>
                                            <p className="text-xs text-muted-foreground">{activity.description}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {activity.user} • {new Date(activity.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
