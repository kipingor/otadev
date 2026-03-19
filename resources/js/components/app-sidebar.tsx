import { NavFooter } from '@/components/nav-footer';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar, SidebarContent, SidebarFooter, SidebarHeader,
    SidebarMenu, SidebarMenuButton, SidebarMenuItem,
    SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
} from 'lucide-react';
import AppLogo from './app-logo';
import { cn } from '@/lib/utils';
import { useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface NavItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
    label: string;
    defaultOpen?: boolean;
    items: NavItem[];
}

const navGroups: NavGroup[] = [
    {
        label: 'CRM',
        defaultOpen: true,
        items: [
            { title: 'Dashboard',    href: '/dashboard',               icon: LayoutGrid  },
            { title: 'Leads',        href: '/leads',         icon: FileText    },
            { title: 'Pipeline',     href: '/pipelines',     icon: Columns     },
            { title: 'Contacts',     href: '/contacts',          icon: UserPlus    },
            { title: 'Opportunities',href: '/opportunities', icon: Briefcase   },
            { title: 'Clients',      href: '/clients',           icon: Building2   },
        ],
    },
    {
        label: 'Operations',
        defaultOpen: true,
        items: [
            { title: 'Projects',     href: '/projects',     icon: Folder      },
            { title: 'Tenders & RFPs', href: '/tenders',         icon: ScrollText  },
        ],
    },
    {
        label: 'Finance',
        defaultOpen: false,
        items: [
            { title: 'Accounting',   href: '/accounting',        icon: Receipt         },
            { title: 'Invoices',     href: '/invoices',          icon: ClipboardList   },
            { title: 'Payments',     href: '/payments',          icon: Receipt         },
            { title: 'Expenses',     href: '/expenses',          icon: BarChart3       },
            { title: 'Follow-ups',   href: '/follow-ups',        icon: Bell            },
            { title: 'Client Reports',href: '/client-reports',   icon: Users           },
        ],
    },
    {
        label: 'Supply Chain',
        defaultOpen: false,
        items: [
            { title: 'Suppliers',     href: '/suppliers',        icon: Building2   },
            { title: 'Products',      href: '/products',         icon: Package     },
            { title: 'Purchase Orders',href: '/purchase-orders', icon: ShoppingCart},
            { title: 'Deliveries',    href: '/deliveries',       icon: Truck       },
        ],
    },
    {
        label: 'Reports & Admin',
        defaultOpen: false,
        items: [
            { title: 'Reports',      href: '/reports',           icon: BookOpen    },
            { title: 'Activities',   href: '/activities',        icon: Activity    },
            { title: 'Conversations',href: '/conversations',     icon: MessageSquare},
            { title: 'Audit Logs',   href: '/audit-logs',        icon: ClipboardList},
        ],
    },
];

// ── Group Component ───────────────────────────────────────────────────────────

function NavGroupSection({ group, currentUrl }: { group: NavGroup; currentUrl: string }) {
    const [open, setOpen] = useState(
        group.defaultOpen || group.items.some(item => currentUrl.startsWith(item.href))
    );

    const isActive = (href: string) => {
        if (href === '/dashboard' || href.endsWith('dashboard')) {
            return currentUrl === href || currentUrl.endsWith('/dashboard');
        }
        return currentUrl.startsWith(href);
    };

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <SidebarGroup>
                <SidebarGroupLabel asChild>
                    <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                        {group.label}
                        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
                    </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                    <SidebarGroupContent>
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
                                                active && 'bg-primary/10 text-primary font-medium'
                                            )}
                                        >
                                            <Link href={item.href} prefetch>
                                                <item.icon className={cn(
                                                    'h-4 w-4 flex-shrink-0',
                                                    active ? 'text-primary' : 'text-muted-foreground'
                                                )} />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </CollapsibleContent>
            </SidebarGroup>
        </Collapsible>
    );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

export function AppSidebar() {
    const { url } = usePage();

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="gap-0">
                {navGroups.map((group) => (
                    <NavGroupSection key={group.label} group={group} currentUrl={url} />
                ))}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}