import { usePage } from '@inertiajs/react';
import type { TenantData, ModuleKey } from '@/types/tenant';

interface TenantPageProps {
    tenant: TenantData | null;
    enabled_modules: ModuleKey[];
    [key: string]: unknown;
}

/**
 * useTenant
 *
 * Reads the current tenant context from Inertia shared props (set by
 * HandleInertiaRequests). Returns helpers for module access checks and
 * plan/trial display.
 *
 * Usage:
 *   const { tenant, hasModule, isOnFreePlan, trialDaysLeft } = useTenant();
 *
 *   if (!hasModule('accounting')) {
 *     return <UpgradePrompt module="accounting" />;
 *   }
 */
export function useTenant() {
    const { tenant, enabled_modules } = usePage<TenantPageProps>().props;

    const hasModule = (key: ModuleKey): boolean => {
        return enabled_modules.includes(key);
    };

    const isOnFreePlan    = tenant?.plan === 'free';
    const isOnTrial       = tenant?.is_trial ?? false;
    const isSuspended     = tenant?.is_suspended ?? false;
    const trialDaysLeft   = tenant?.trial_days_left ?? null;
    const isTrialExpiring = isOnTrial && trialDaysLeft !== null && trialDaysLeft <= 3;

    return {
        tenant,
        enabledModules: enabled_modules,
        hasModule,
        isOnFreePlan,
        isOnTrial,
        isSuspended,
        trialDaysLeft,
        isTrialExpiring,
        plan: tenant?.plan ?? 'free',
        role: tenant?.role ?? null,
        isOwner: tenant?.role === 'owner',
        isAdmin: tenant?.role === 'owner' || tenant?.role === 'admin',
    };
}