/**
 * Tenant & Subscription TypeScript types
 *
 * These match the shapes shared by HandleInertiaRequests::share()
 * and the onboarding/subscription page props.
 */

// ── Module ────────────────────────────────────────────────────────────────────

export type ModuleKey =
    | 'leads'
    | 'pipeline'
    | 'contacts'
    | 'opportunities'
    | 'projects'
    | 'accounting'
    | 'clients'
    | 'analytics'
    | 'supply_chain'
    | 'hr';

export interface Module {
    id: number;
    key: ModuleKey;
    name: string;
    description: string | null;
    icon: string | null;
    is_free: boolean;
    is_active: boolean;
    sort_order: number;
    plan_availability: PlanKey[];
}

// ── Plan ──────────────────────────────────────────────────────────────────────

export type PlanKey = 'free' | 'starter' | 'growth' | 'enterprise';
export type TenantStatus = 'trial' | 'active' | 'suspended' | 'cancelled';
export type TenantRole = 'owner' | 'admin' | 'member';
export type BillingCycle = 'monthly' | 'annual';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'cancelled' | 'incomplete';

export interface PlanDetail {
    key: PlanKey;
    name: string;
    price_monthly: number;
    price_annual: number;
    max_users: number;
    max_modules: number;
    description: string;
    features: string[];
    cta: string;
    highlighted: boolean;
}

// ── Tenant (shared via Inertia on every page) ─────────────────────────────────

export interface TenantData {
    id: string;
    name: string;
    slug: string;
    plan: PlanKey;
    status: TenantStatus;
    logo_path: string | null;
    timezone: string;
    currency: string;
    max_users: number;
    is_trial: boolean;
    trial_ends_at: string | null;
    trial_days_left: number | null;
    is_suspended: boolean;
    role: TenantRole;
}

// ── Subscription ──────────────────────────────────────────────────────────────

export interface SubscriptionData {
    id: number;
    tenant_id: string;
    plan: PlanKey;
    billing_cycle: BillingCycle;
    status: SubscriptionStatus;
    max_users: number;
    amount: number;
    currency: string;
    trial_ends_at: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    cancelled_at: string | null;
}

// ── Tenant membership (for workspace switcher) ────────────────────────────────

export interface TenantMembership {
    tenant_id: string;
    name: string;
    slug: string;
    plan: PlanKey;
    logo_path: string | null;
    role: TenantRole;
    is_current: boolean;
    enabled_modules: ModuleKey[];
}

// ── Shared Inertia props extension ───────────────────────────────────────────
// Merge into your existing types/index.d.ts SharedData interface:
//
//   import type { TenantData } from './tenant';
//   export interface SharedData {
//       ...existing fields...
//       tenant: TenantData | null;
//       enabled_modules: string[];
//   }

export interface TenantSharedData {
    tenant: TenantData | null;
    enabled_modules: ModuleKey[];
}