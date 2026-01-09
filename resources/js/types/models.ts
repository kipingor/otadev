export enum LeadStatus {
    NEW = 'new',
    CONTACTED = 'contacted',
    QUALIFIED = 'qualified',
    PROPOSAL_SENT = 'proposal_sent',
    NEGOTIATION = 'negotiation',
    WON = 'won',
    LOST = 'lost',
    ARCHIVED = 'archived',
}

export enum PipelineStage {
    INTAKE = 'intake',
    DISCOVERY = 'discovery',
    PROPOSAL = 'proposal',
    NEGOTIATION = 'negotiation',
    CLOSED_WON = 'closed_won',
    CLOSED_LOST = 'closed_lost',
}

export enum LeadType {
    DOCUMENT = 'document',
    CONVERSATION = 'conversation',
}

