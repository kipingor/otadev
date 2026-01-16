import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Users, FileText, DollarSign, ArrowRight, Clock, CheckCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { cn } from '@/lib/utils';

interface DashboardMetrics {
    overview: {
        total_leads: number;
        active_leads: number;
        conversion_rate: number;
        total_opportunities: number;
    };
    leads_over_time: Array<{ date: string; count: number }>;
    opportunity_pipeline: Array<{ stage: string; count: number; value: number }>;
    revenue_over_time: Array<{ date: string; revenue: number }>;
}

interface Activity {
    id: number;
    type: string;
    description: string;
    created_at: string;
    causer?: {
        name: string;
    };
}

interface DashboardProps {
    metrics: DashboardMetrics;
    recent_activities: Activity[];
}

export default function Dashboard({ metrics, recent_activities = [] }: DashboardProps) {
    // Calculate trends (mock for now, should come from backend)
    const leadTrend = 12.5;
    const conversionTrend = -2.3;
    const opportunityTrend = 8.7;

    return (
        <AppLayout>
            <Head title="Dashboard" />

            <div className="space-y-8 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-muted-foreground">
                            Welcome back! Here's what's happening with your leads today.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link href="/leads">View All Leads</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/leads/create">
                                Create Lead
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title="Total Leads"
                        value={metrics.overview.total_leads}
                        trend={leadTrend}
                        icon={<Users className="h-4 w-4 text-muted-foreground" />}
                        href="/leads"
                    />
                    <MetricCard
                        title="Active Leads"
                        value={metrics.overview.active_leads}
                        subtitle="In progress"
                        icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                        href="/leads?status=new,contacted"
                    />
                    <MetricCard
                        title="Conversion Rate"
                        value={`${metrics.overview.conversion_rate}%`}
                        trend={conversionTrend}
                        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
                    />
                    <MetricCard
                        title="Opportunities"
                        value={metrics.overview.total_opportunities}
                        trend={opportunityTrend}
                        icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                        href="/opportunities"
                    />
                </div>

                {/* Charts Row */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Leads Over Time</CardTitle>
                            <CardDescription>New leads created in the last 30 days</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={metrics.leads_over_time}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Pipeline Overview</CardTitle>
                            <CardDescription>Opportunities by pipeline stage</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={metrics.opportunity_pipeline}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="stage" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Revenue and Activity Row */}
                <div className="grid gap-4 md:grid-cols-7">
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Revenue Trend</CardTitle>
                            <CardDescription>Revenue from won opportunities</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={metrics.revenue_over_time}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']} />
                                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>Latest updates from your team</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recent_activities.length === 0 ? (
                                    <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
                                ) : (
                                    recent_activities.slice(0, 5).map((activity) => (
                                        <div key={activity.id} className="flex items-start gap-3">
                                            <div className="rounded-full bg-primary/10 p-2">
                                                <CheckCircle className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm">{activity.description}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {activity.causer?.name} • {new Date(activity.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

interface MetricCardProps {
    title: string;
    value: number | string;
    subtitle?: string;
    trend?: number;
    icon?: React.ReactNode;
    href?: string;
}

function MetricCard({ title, value, subtitle, trend, icon, href }: MetricCardProps) {
    const content = (
        <>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
                {trend !== undefined && (
                    <div className="flex items-center gap-1 text-xs mt-2">
                        {trend > 0 ? (
                            <>
                                <TrendingUp className="h-3 w-3 text-green-600" />
                                <span className="text-green-600">+{trend}%</span>
                            </>
                        ) : (
                            <>
                                <TrendingDown className="h-3 w-3 text-red-600" />
                                <span className="text-red-600">{trend}%</span>
                            </>
                        )}
                        <span className="text-muted-foreground">from last month</span>
                    </div>
                )}
            </CardContent>
        </>
    );

    if (href) {
        return (
            <Link href={href}>
                <Card className="hover:bg-accent transition-colors cursor-pointer">
                    {content}
                </Card>
            </Link>
        );
    }

    return <Card>{content}</Card>;
}