import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';
import type { TenantData, ModuleKey } from './tenant';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    tenant: TenantData | null;
    enabled_modules: ModuleKey[];
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

/** Represents a single sales lead in the pipeline */
export interface Lead {
    id: number | string;
    name: string;
    company?: string;
    email?: string;
    [key: string]: unknown;
}

export type ID = number | string;

export interface ActivityLog {
    id: ID;
    description: string;
    created_at: string;
    [key: string]: unknown;
}

export interface PageProps<T extends Record<string, unknown> = Record<string, unknown>>
    extends SharedData {
    [key: string]: unknown;
}