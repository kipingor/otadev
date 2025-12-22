/**
 * Model type definitions
 * Aligned with Laravel backend models
 */

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

export enum PipelineStageType {
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

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface PipelineStage {
    id: number;
    name: string;
    type: PipelineStageType;
    order: number;
    color: string | null;
    created_at: string;
    updated_at: string;
}

export interface Lead {
    id: number;
    title: string;
    description: string | null;
    type: LeadType;
    status: LeadStatus;
    created_by: number;
    owner_id: number;
    pipeline_stage_id: number;
    metadata: Record<string, any> | null;
    ai_reviewed: boolean;
    order: number;
    contacted_at: string | null;
    qualified_at: string | null;
    converted_to_opportunity_at: string | null;
    won_at: string | null;
    lost_at: string | null;
    archived_at: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    
    // Relationships
    user?: User;
    owner?: User;
    pipeline_stage?: PipelineStage;
    questions?: LeadQuestion[];
    lead_documents?: LeadDocument[];
    opportunity?: Opportunity;
    proposals?: Proposal[];
    activities?: Activity[];
}

export interface LeadDocument {
    id: number;
    lead_id: number;
    file_path: string;
    file_name: string;
    file_type: string;
    file_size: number;
    processed: boolean;
    extracted_text: string | null;
    metadata: Record<string, any> | null;
    created_at: string;
    updated_at: string;
    
    // Relationships
    lead?: Lead;
}

export interface LeadQuestion {
    id: number;
    lead_id: number;
    question: string;
    answer: string | null;
    asked_by: number | null;
    answered_at: string | null;
    created_at: string;
    updated_at: string;
    
    // Relationships
    lead?: Lead;
    asker?: User;
}

export interface Opportunity {
    id: number;
    lead_id: number;
    title: string;
    description: string | null;
    value: number;
    probability: number;
    expected_close_date: string | null;
    status: string;
    created_at: string;
    updated_at: string;
    
    // Relationships
    lead?: Lead;
}

export interface Proposal {
    id: number;
    lead_id: number;
    title: string;
    content: string;
    status: string;
    generated_by_ai: boolean;
    sent_at: string | null;
    accepted_at: string | null;
    rejected_at: string | null;
    created_at: string;
    updated_at: string;
    
    // Relationships
    lead?: Lead;
}

export interface Activity {
    id: number;
    lead_id: number;
    user_id: number;
    action: string;
    description: string | null;
    data: Record<string, any> | null;
    created_at: string;
    
    // Relationships
    lead?: Lead;
    user?: User;
}

export interface Project {
    id: number;
    name: string;
    description: string | null;
    status: string;
    start_date: string | null;
    end_date: string | null;
    budget: number | null;
    created_at: string;
    updated_at: string;
}

export interface Task {
    id: number;
    project_id: number;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    assigned_to: number | null;
    due_date: string | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
    
    // Relationships
    project?: Project;
    assignee?: User;
}

/**
 * Pagination types
 */
export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginationMeta {
    current_page: number;
    from: number;
    last_page: number;
    links: PaginationLink[];
    path: string;
    per_page: number;
    to: number;
    total: number;
}

export interface PaginatedData<T> {
    data: T[];
    links: PaginationLink[];
    meta: PaginationMeta;
}

/**
 * Form types
 */
export interface LeadFormData {
    title: string;
    description?: string | null;
    type: LeadType;
    owner_id: number;
    pipeline_stage_id: number;
    status?: LeadStatus;
    metadata?: Record<string, any>;
}

export interface LeadUpdateData extends Partial<LeadFormData> {
    ai_reviewed?: boolean;
}

/**
 * API Response types
 */
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    meta?: Record<string, any>;
    errors?: Record<string, string[]>;
}

/**
 * Statistics types
 */
export interface LeadStatistics {
    total: number;
    new: number;
    qualified: number;
    won: number;
    lost: number;
    conversion_rate: number;
}

export interface DashboardMetrics {
    leads: LeadStatistics;
    opportunities: {
        total: number;
        total_value: number;
        average_value: number;
    };
    pipeline: {
        stages: Array<{
            stage: string;
            count: number;
            value: number;
        }>;
    };
}

/**
 * Status transition types
 */
export interface StatusTransition {
    value: LeadStatus;
    label: string;
    color: string;
}

export interface StatusHistory {
    status: LeadStatus;
    label: string;
    timestamp: string;
}