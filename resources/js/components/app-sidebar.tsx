import { NavFooter } from '@/components/nav-footer';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar, SidebarContent, SidebarFooter, SidebarHeader,
    SidebarMenu, SidebarMenuButton, SidebarMenuItem,
    SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { dashboard } from '@/routes/web';
import leads from '@/routes/web/leads';
import pipelines from '@/routes/web/pipelines';
import projects from '@/routes/web/projects';
import opportunities from '@/routes/web/opportunities';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutGrid, FileText, Columns, Briefcase, Building2, UserPlus,
    Folder, ScrollText, Receipt, Bell, Users,
    Package, ShoppingCart, Truck, BookOpen, ChevronDown,
    BarChart3, Activity, MessageSquare, ClipboardList,
    Lock, Zap, AlertTriangle,
} from 'lucide-react';
import AppLogo from './app-logo';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useTenant } from '@/hooks/useTenant';
import type { ModuleKey } from '@/types/tenant';

// ── Types ─────────────────────────────────────────────────────────────────────

interface NavItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
    label: string;
    module: ModuleKey | null; // null = always visible (no module gate)
    defaultOpen?: boolean;
    items: NavItem[];
}

const navGroups: NavGroup[] = [
    {
        label: 'CRM',
        module: null, // Dashboard always visible
        defaultOpen: true,
        items: [
            { title: 'Dashboard',     href: '/dashboard',   icon: LayoutGrid },
        ],
    },
    {
        label: 'Leads',
        module: 'leads',
        defaultOpen: true,
        items: [
            { title: 'All Leads',  href: '/leads',     icon: FileText },
        ],
    },
    {
        label: 'Pipeline',
        module: 'pipeline',
        defaultOpen: true,
        items: [
            { title: 'Kanban Board', href: '/pipelines', icon: Columns },
        ],
    },
    {
        label: 'Contacts & Clients',
        module: 'contacts',
        defaultOpen: false,
        items: [
            { title: 'Contacts', href: '/contacts',     icon: UserPlus  },
            { title: 'Clients',  href: '/clients',      icon: Building2 },
        ],
    },
    {
        label: 'Opportunities',
        module: 'opportunities',
        defaultOpen: false,
        items: [
            { title: 'Opportunities', href: '/opportunities', icon: Briefcase },
        ],
    },
    {
        label: 'Operations',
        module: 'projects',
        defaultOpen: true,
        items: [
            { title: 'Projects',      href: '/projects', icon: Folder     },
            { title: 'Tenders & RFPs',href: '/tenders',  icon: ScrollText },
        ],
    },
    {
        label: 'Finance',
        module: 'accounting',
        defaultOpen: false,
        items: [
            { title: 'Accounting',    href: '/accounting',     icon: Receipt       },
            { title: 'Invoices',      href: '/invoices',       icon: ClipboardList },
            { title: 'Payments',      href: '/payments',       icon: Receipt       },
            { title: 'Expenses',      href: '/expenses',       icon: BarChart3     },
            { title: 'Follow-ups',    href: '/follow-ups',     icon: Bell          },
            { title: 'Client Reports',href: '/client-reports', icon: Users         },
        ],
    },
    {
        label: 'Supply Chain',
        module: 'supply_chain',
        defaultOpen: false,
        items: [
            { title: 'Suppliers',      href: '/suppliers',       icon: Building2   },
            { title: 'Products',       href: '/products',        icon: Package     },
            { title: 'Purchase Orders',href: '/purchase-orders', icon: ShoppingCart},
            { title: 'Deliveries',     href: '/deliveries',      icon: Truck       },
        ],
    },
    {
        label: 'HR',
        module: 'hr',
        defaultOpen: false,
        items: [
            { title: 'HR Dashboard', href: '/hr',       icon: Users },
            { title: 'Staff',        href: '/hr/staff', icon: Users },
            { title: 'Leave',        href: '/hr/leave', icon: Bell  },
        ],
    },
    {
        label: 'Analytics',
        module: 'analytics',
        defaultOpen: false,
        items: [
            { title: 'Reports',     href: '/reports',               icon: BookOpen },
            { title: 'Lead Analytics', href: '/analytics/leads',    icon: BarChart3 },
            { title: 'Performance', href: '/analytics/performance', icon: BarChart3 },
        ],
    },
    {
        label: 'Admin',
        module: null,
        defaultOpen: false,
        items: [
            { title: 'Activities',    href: '/activities',    icon: Activity      },
            { title: 'Conversations', href: '/conversations', icon: MessageSquare },
            { title: 'Audit Logs',    href: '/audit-logs',    icon: ClipboardList },
        ],
    },
];

// ── Locked module prompt ──────────────────────────────────────────────────────

function LockedGroupContent({ label }: { label: string }) {
    return (
        <div className="mx-2 mb-2 rounded-md border border-dashed border-muted-foreground/30 bg-muted/20 px-3 py-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-3 w-3 flex-shrink-0" />
                <span>{label} is not on your plan.</span>
            </div>
            <Link
                href="/subscription/plans"
                className="mt-1 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
                <Zap className="h-3 w-3" />
                Upgrade to unlock
            </Link>
        </div>
    );
}

// ── Nav group ─────────────────────────────────────────────────────────────────

function NavGroupSection({
    group,
    currentUrl,
    isEnabled,
}: {
    group: NavGroup;
    currentUrl: string;
    isEnabled: boolean;
}) {
    const [open, setOpen] = useState(
        group.defaultOpen ||
        (isEnabled && group.items.some((item) => currentUrl.startsWith(item.href)))
    );

    const isActive = (href: string) => {
        if (href === '/dashboard') return currentUrl === href || currentUrl.endsWith('/dashboard');
        return currentUrl.startsWith(href);
    };

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <SidebarGroup>
                <SidebarGroupLabel asChild>
                    <CollapsibleTrigger
                        className={cn(
                            'flex w-full items-center justify-between px-2 py-1.5',
                            'text-xs font-semibold uppercase tracking-wider transition-colors',
                            isEnabled
                                ? 'text-muted-foreground hover:text-foreground'
                                : 'text-muted-foreground/50',
                        )}
                    >
                        <span className="flex items-center gap-1.5">
                            {group.label}
                            {!isEnabled && group.module && (
                                <Lock className="h-2.5 w-2.5 opacity-50" />
                            )}
                        </span>
                        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
                    </CollapsibleTrigger>
                </SidebarGroupLabel>

                <CollapsibleContent>
                    <SidebarGroupContent>
                        {isEnabled ? (
                            <SidebarMenu>
                                {group.items.map((item) => {
                                    const active = isActive(item.href);
                                    return (
                                        <SidebarMenuItem key={item.href}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={active}
                                                className={cn(
                                                    'gap-2',
                                                    active && 'bg-primary/10 text-primary font-medium',
                                                )}
                                            >
                                                <Link href={item.href} prefetch>
                                                    <item.icon
                                                        className={cn(
                                                            'h-4 w-4 flex-shrink-0',
                                                            active ? 'text-primary' : 'text-muted-foreground',
                                                        )}
                                                    />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        ) : (
                            <LockedGroupContent label={group.label} />
                        )}
                    </SidebarGroupContent>
                </CollapsibleContent>
            </SidebarGroup>
        </Collapsible>
    );
}

// ── Trial banner ──────────────────────────────────────────────────────────────

function TrialBanner({ daysLeft }: { daysLeft: number }) {
    const urgent = daysLeft <= 3;
    return (
        <div className={cn(
            'mx-2 mb-2 rounded-md border px-3 py-2 text-xs',
            urgent
                ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400'
                : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400',
        )}>
            <div className="flex items-center gap-1.5 font-medium">
                <AlertTriangle className="h-3 w-3" />
                {urgent ? `Trial expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}!` : `${daysLeft} days left in trial`}
            </div>
            <Link href="/subscription/plans" className="mt-0.5 block hover:underline font-semibold">
                Upgrade now →
            </Link>
        </div>
    );
}

// ── Plan badge (in sidebar header) ────────────────────────────────────────────

const PLAN_COLORS: Record<string, string> = {
    free:       'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    starter:    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    growth:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    enterprise: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
};

// ── Main Sidebar ──────────────────────────────────────────────────────────────

export function AppSidebar() {
    const { url } = usePage();
    const { tenant, hasModule, isOnTrial, trialDaysLeft, isTrialExpiring } = useTenant();

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                                {tenant && (
                                    <div className="flex flex-col min-w-0">
                                        <span className="truncate text-sm font-semibold">{tenant.name}</span>
                                        <span className={cn(
                                            'inline-flex items-center rounded px-1 py-0 text-[10px] font-medium w-fit capitalize',
                                            PLAN_COLORS[tenant.plan],
                                        )}>
                                            {tenant.plan}
                                        </span>
                                    </div>
                                )}
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="gap-0">
                {/* Trial expiry warning */}
                {isOnTrial && trialDaysLeft !== null && trialDaysLeft <= 7 && (
                    <TrialBanner daysLeft={trialDaysLeft} />
                )}

                {navGroups.map((group) => {
                    // A group with module: null is always enabled
                    const isEnabled = group.module === null || hasModule(group.module);
                    return (
                        <NavGroupSection
                            key={group.label}
                            group={group}
                            currentUrl={url}
                            isEnabled={isEnabled}
                        />
                    );
                })}
            </SidebarContent>

            <SidebarFooter>
                {/* Workspace switcher shortcut */}
                {tenant && (
                    <div className="px-2 pb-1">
                        <Link
                            href="/switch-tenant"
                            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        >
                            <Building2 className="h-3 w-3" />
                            Switch workspace
                        </Link>
                    </div>
                )}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}