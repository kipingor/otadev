// ── Stage enum (must mirror app/Enums/OpportunityStage.php) ──────────────────
export enum OpportunityStage {
    QUALIFICATION = 'qualification',
    PROPOSAL      = 'proposal',
    NEGOTIATION   = 'negotiation',
    CLOSED_WON    = 'closed_won',
    CLOSED_LOST   = 'closed_lost',
}

// ── Stage configs ─────────────────────────────────────────────────────────────
// FIX 1: Removed DECISION (didn't exist in PHP enum → caused MySQL truncation).
// FIX 2: Added `isClosed` boolean (was missing — always read as undefined in card).
// FIX 3: `color` now stores a bare CSS color name, not a full Tailwind class, so
//         the conditional class logic in OpportunityCardEnhanced works correctly.
export const OPPORTUNITY_STAGE_CONFIGS: Record<
    OpportunityStage,
    {
        label: string;
        /** Bare color name used for conditional Tailwind classes in the card. */
        color: 'gray' | 'blue' | 'orange' | 'green' | 'red';
        bgClass: string;
        defaultProbability: number;
        isClosed: boolean;
    }
> = {
    [OpportunityStage.QUALIFICATION]: {
        label: 'Qualification',
        color: 'gray',
        bgClass: 'bg-gray-100',
        defaultProbability: 10,
        isClosed: false,
    },
    [OpportunityStage.PROPOSAL]: {
        label: 'Proposal',
        color: 'blue',
        bgClass: 'bg-blue-100',
        defaultProbability: 30,
        isClosed: false,
    },
    [OpportunityStage.NEGOTIATION]: {
        label: 'Negotiation',
        color: 'orange',
        bgClass: 'bg-orange-100',
        defaultProbability: 60,
        isClosed: false,
    },
    [OpportunityStage.CLOSED_WON]: {
        label: 'Closed Won',
        color: 'green',
        bgClass: 'bg-green-100',
        defaultProbability: 100,
        isClosed: true,
    },
    [OpportunityStage.CLOSED_LOST]: {
        label: 'Closed Lost',
        color: 'red',
        bgClass: 'bg-red-100',
        defaultProbability: 0,
        isClosed: true,
    },
};

// ── Opportunity model ─────────────────────────────────────────────────────────
// FIX 4: Added missing fields that the card accesses but were not in the interface.
export interface Opportunity {
    id: number;
    lead_id: number;
    title: string;
    description?: string | null;

    /** API input / response field. NOTE: the backend model column is `estimated_value`;
     *  the API controller currently accepts `amount` — keep both until that is unified. */
    amount?: number;
    estimated_value?: number;

    probability: number;
    weighted_value?: number;

    stage: OpportunityStage;
    expected_close_date?: string | null;
    /** Set when the opportunity is won or lost */
    closed_at?: string | null;

    contact_name?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;

    created_at: string;
    updated_at: string;

    // ── Eager-loaded relationships (may be absent depending on the query) ──────
    lead?: {
        id: number;
        title: string;
        [key: string]: unknown;
    } | null;
    owner?: {
        id: number;
        name: string;
        email?: string;
        avatar?: string | null;
    } | null;
}