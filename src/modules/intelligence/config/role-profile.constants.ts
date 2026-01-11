/**
 * Role Profile Constants - DawinOS v2.0
 * Pre-defined role profiles and templates
 */

import { 
  RoleProfile, 
  RoleTemplate, 
  SkillCategory, 
  AuthorityType,
} from '../types/role-profile.types';

// ============================================
// Standard Role Profiles
// ============================================

/**
 * CEO Role Profile
 */
export const CEO_PROFILE: Partial<RoleProfile> = {
  title: 'Chief Executive Officer',
  slug: 'ceo',
  description: 'Group CEO responsible for overall strategy and performance across all subsidiaries',
  shortDescription: 'Group CEO',
  subsidiaryId: 'all',
  jobLevel: 'EXECUTIVE',
  employmentTypes: ['full-time'],
  reportsTo: [],
  supervises: ['coo', 'cfo', 'cto', 'subsidiary-md'],
  skills: [
    { category: 'strategic', name: 'Strategic Planning', requiredLevel: 'expert', isCore: true },
    { category: 'management', name: 'Executive Leadership', requiredLevel: 'expert', isCore: true },
    { category: 'financial', name: 'Financial Acumen', requiredLevel: 'advanced', isCore: true },
  ],
  approvalAuthorities: [
    { type: 'financial', canApproveFor: 'all' },
    { type: 'hr', canApproveFor: 'all' },
    { type: 'contract', canApproveFor: 'all' },
    { type: 'policy', canApproveFor: 'all' },
  ],
  taskCapabilities: [
    {
      eventType: 'strategic.market_change',
      taskTypes: ['analyze_impact', 'executive_briefing'],
      canInitiate: true,
      canExecute: true,
      canApprove: true,
      canDelegate: true,
    },
    {
      eventType: 'strategic.opportunity_identified',
      taskTypes: ['evaluate_opportunity'],
      canInitiate: true,
      canExecute: true,
      canApprove: true,
      canDelegate: true,
    },
  ],
  typicalTaskLoad: { daily: 15, weekly: 50, maxConcurrent: 20 },
  aiContext: {
    briefingPriorities: ['strategic-updates', 'financial-metrics', 'risk-alerts', 'key-decisions'],
    taskSortingWeights: { 'strategic': 1.5, 'financial': 1.3, 'urgent': 1.4 },
    communicationStyle: 'formal',
  },
};

/**
 * CFO Role Profile
 */
export const CFO_PROFILE: Partial<RoleProfile> = {
  title: 'Chief Financial Officer',
  slug: 'cfo',
  description: 'Group CFO responsible for financial strategy, capital management, and reporting',
  shortDescription: 'Group CFO',
  subsidiaryId: 'all',
  jobLevel: 'EXECUTIVE',
  employmentTypes: ['full-time'],
  reportsTo: ['ceo'],
  supervises: ['finance-manager', 'accountant', 'accounts-payable-clerk'],
  skills: [
    { category: 'financial', name: 'Financial Management', requiredLevel: 'expert', isCore: true },
    { category: 'strategic', name: 'Financial Strategy', requiredLevel: 'expert', isCore: true },
    { category: 'compliance', name: 'Financial Compliance', requiredLevel: 'advanced', isCore: true },
  ],
  approvalAuthorities: [
    { type: 'financial', canApproveFor: 'all' },
    { type: 'expense', canApproveFor: 'all' },
    { type: 'procurement', canApproveFor: 'all', maxAmount: { amount: 100000000, currency: 'UGX' } },
  ],
  taskCapabilities: [
    {
      eventType: 'financial.payment_received',
      taskTypes: ['reconcile_payment', 'send_receipt'],
      canInitiate: false,
      canExecute: true,
      canApprove: true,
      canDelegate: true,
    },
    {
      eventType: 'financial.invoice_overdue',
      taskTypes: ['send_reminder', 'escalate_debt'],
      canInitiate: false,
      canExecute: true,
      canApprove: true,
      canDelegate: true,
    },
    {
      eventType: 'financial.budget_exceeded',
      taskTypes: ['review_budget_variance', 'approve_budget_increase'],
      canInitiate: false,
      canExecute: true,
      canApprove: true,
      canDelegate: true,
    },
  ],
  typicalTaskLoad: { daily: 20, weekly: 80, maxConcurrent: 25 },
  aiContext: {
    briefingPriorities: ['cash-flow', 'budget-variance', 'pending-approvals', 'capital-updates'],
    taskSortingWeights: { 'financial': 1.5, 'compliance': 1.3, 'deadline': 1.4 },
    communicationStyle: 'formal',
  },
};

/**
 * HR Manager Role Profile
 */
export const HR_MANAGER_PROFILE: Partial<RoleProfile> = {
  title: 'HR Manager',
  slug: 'hr-manager',
  description: 'Manages all human resources functions including recruitment, payroll, and employee relations',
  shortDescription: 'HR Manager',
  subsidiaryId: 'all',
  jobLevel: 'MANAGER',
  employmentTypes: ['full-time'],
  reportsTo: ['coo', 'ceo'],
  supervises: ['hr-officer', 'payroll-officer'],
  skills: [
    { category: 'management', name: 'People Management', requiredLevel: 'advanced', isCore: true },
    { category: 'administrative', name: 'HR Administration', requiredLevel: 'advanced', isCore: true },
    { category: 'compliance', name: 'Labor Law Compliance', requiredLevel: 'advanced', isCore: true },
  ],
  approvalAuthorities: [
    { type: 'hr', canApproveFor: 'all' },
    { type: 'leave', canApproveFor: 'all' },
    { type: 'expense', canApproveFor: 'department', maxAmount: { amount: 5000000, currency: 'UGX' } },
  ],
  taskCapabilities: [
    {
      eventType: 'hr.leave_requested',
      taskTypes: ['approve_leave'],
      canInitiate: false,
      canExecute: true,
      canApprove: true,
      canDelegate: true,
    },
    {
      eventType: 'hr.contract_expiring',
      taskTypes: ['review_contract_renewal', 'prepare_renewal'],
      canInitiate: false,
      canExecute: true,
      canApprove: true,
      canDelegate: true,
    },
    {
      eventType: 'hr.performance_review_due',
      taskTypes: ['conduct_review', 'self_assessment'],
      canInitiate: true,
      canExecute: true,
      canApprove: true,
      canDelegate: true,
    },
  ],
  typicalTaskLoad: { daily: 25, weekly: 100, maxConcurrent: 30 },
  aiContext: {
    briefingPriorities: ['pending-leave', 'contract-renewals', 'payroll-deadlines', 'grievances'],
    taskSortingWeights: { 'deadline': 1.5, 'employee-welfare': 1.4, 'compliance': 1.3 },
    communicationStyle: 'formal',
  },
};

/**
 * Project Manager Role Profile
 */
export const PROJECT_MANAGER_PROFILE: Partial<RoleProfile> = {
  title: 'Project Manager',
  slug: 'project-manager',
  description: 'Manages project execution, client relationships, and team coordination',
  shortDescription: 'Project Manager',
  jobLevel: 'MANAGER',
  employmentTypes: ['full-time', 'contract'],
  reportsTo: ['operations-manager', 'subsidiary-md'],
  supervises: ['site-supervisor', 'team-lead'],
  skills: [
    { category: 'management', name: 'Project Management', requiredLevel: 'advanced', isCore: true },
    { category: 'customer', name: 'Client Relations', requiredLevel: 'advanced', isCore: true },
    { category: 'operational', name: 'Operations Coordination', requiredLevel: 'intermediate', isCore: true },
  ],
  approvalAuthorities: [
    { type: 'operational', canApproveFor: 'team' },
    { type: 'expense', canApproveFor: 'team', maxAmount: { amount: 2000000, currency: 'UGX' } },
    { type: 'leave', canApproveFor: 'team' },
  ],
  taskCapabilities: [
    {
      eventType: 'production.job_started',
      taskTypes: ['verify_materials', 'update_customer'],
      canInitiate: true,
      canExecute: true,
      canApprove: true,
      canDelegate: true,
    },
    {
      eventType: 'production.milestone_reached',
      taskTypes: ['update_customer_milestone'],
      canInitiate: false,
      canExecute: true,
      canApprove: true,
      canDelegate: true,
    },
    {
      eventType: 'production.quality_issue',
      taskTypes: ['investigate_issue', 'resolve_issue'],
      canInitiate: true,
      canExecute: true,
      canApprove: true,
      canDelegate: true,
    },
    {
      eventType: 'customer.order_placed',
      taskTypes: ['confirm_order', 'schedule_production'],
      canInitiate: false,
      canExecute: true,
      canApprove: true,
      canDelegate: true,
    },
  ],
  typicalTaskLoad: { daily: 30, weekly: 120, maxConcurrent: 40 },
  aiContext: {
    briefingPriorities: ['project-deadlines', 'client-communications', 'team-blockers', 'milestones'],
    taskSortingWeights: { 'client': 1.5, 'deadline': 1.4, 'team': 1.3 },
    communicationStyle: 'casual',
  },
};

/**
 * Finance Officer Role Profile
 */
export const FINANCE_OFFICER_PROFILE: Partial<RoleProfile> = {
  title: 'Finance Officer',
  slug: 'finance-officer',
  description: 'Handles day-to-day financial operations, transaction processing, and reconciliation',
  shortDescription: 'Finance Officer',
  jobLevel: 'SENIOR',
  employmentTypes: ['full-time'],
  reportsTo: ['finance-manager', 'cfo'],
  supervises: [],
  skills: [
    { category: 'financial', name: 'Bookkeeping', requiredLevel: 'advanced', isCore: true },
    { category: 'financial', name: 'Reconciliation', requiredLevel: 'advanced', isCore: true },
    { category: 'administrative', name: 'Documentation', requiredLevel: 'intermediate', isCore: true },
  ],
  approvalAuthorities: [
    { type: 'expense', canApproveFor: 'self', maxAmount: { amount: 500000, currency: 'UGX' } },
  ],
  taskCapabilities: [
    {
      eventType: 'financial.payment_received',
      taskTypes: ['reconcile_payment', 'send_receipt'],
      canInitiate: false,
      canExecute: true,
      canApprove: false,
      canDelegate: false,
    },
    {
      eventType: 'customer.order_placed',
      taskTypes: ['create_invoice'],
      canInitiate: false,
      canExecute: true,
      canApprove: false,
      canDelegate: false,
    },
  ],
  typicalTaskLoad: { daily: 40, weekly: 160, maxConcurrent: 50 },
  aiContext: {
    briefingPriorities: ['pending-reconciliations', 'payment-deadlines', 'discrepancies', 'bank-updates'],
    taskSortingWeights: { 'deadline': 1.5, 'accuracy': 1.4, 'amount': 1.2 },
    communicationStyle: 'formal',
  },
};

/**
 * Sales Representative Role Profile
 */
export const SALES_REP_PROFILE: Partial<RoleProfile> = {
  title: 'Sales Representative',
  slug: 'sales-rep',
  description: 'Handles customer inquiries, quotes, and sales activities',
  shortDescription: 'Sales Rep',
  jobLevel: 'SENIOR',
  employmentTypes: ['full-time', 'contract'],
  reportsTo: ['sales-manager'],
  supervises: [],
  skills: [
    { category: 'customer', name: 'Customer Service', requiredLevel: 'advanced', isCore: true },
    { category: 'customer', name: 'Sales Techniques', requiredLevel: 'intermediate', isCore: true },
    { category: 'administrative', name: 'Documentation', requiredLevel: 'intermediate', isCore: false },
  ],
  approvalAuthorities: [],
  taskCapabilities: [
    {
      eventType: 'customer.inquiry_received',
      taskTypes: ['respond_inquiry', 'create_lead'],
      canInitiate: true,
      canExecute: true,
      canApprove: false,
      canDelegate: false,
    },
    {
      eventType: 'customer.quote_requested',
      taskTypes: ['prepare_quote'],
      canInitiate: true,
      canExecute: true,
      canApprove: false,
      canDelegate: false,
    },
    {
      eventType: 'customer.order_placed',
      taskTypes: ['confirm_order'],
      canInitiate: true,
      canExecute: true,
      canApprove: false,
      canDelegate: false,
    },
  ],
  typicalTaskLoad: { daily: 35, weekly: 140, maxConcurrent: 45 },
  aiContext: {
    briefingPriorities: ['pending-inquiries', 'quote-follow-ups', 'customer-callbacks', 'targets'],
    taskSortingWeights: { 'customer': 1.5, 'deadline': 1.4, 'value': 1.3 },
    communicationStyle: 'casual',
  },
};

/**
 * Production Supervisor Role Profile
 */
export const PRODUCTION_SUPERVISOR_PROFILE: Partial<RoleProfile> = {
  title: 'Production Supervisor',
  slug: 'production-supervisor',
  description: 'Supervises production activities, quality control, and team coordination on the floor',
  shortDescription: 'Production Supervisor',
  jobLevel: 'LEAD',
  employmentTypes: ['full-time'],
  reportsTo: ['production-manager', 'project-manager'],
  supervises: ['production-staff'],
  skills: [
    { category: 'operational', name: 'Production Management', requiredLevel: 'advanced', isCore: true },
    { category: 'technical', name: 'Quality Control', requiredLevel: 'advanced', isCore: true },
    { category: 'management', name: 'Team Leadership', requiredLevel: 'intermediate', isCore: true },
  ],
  approvalAuthorities: [
    { type: 'operational', canApproveFor: 'team' },
  ],
  taskCapabilities: [
    {
      eventType: 'production.job_started',
      taskTypes: ['verify_materials'],
      canInitiate: false,
      canExecute: true,
      canApprove: false,
      canDelegate: true,
    },
    {
      eventType: 'production.quality_issue',
      taskTypes: ['resolve_issue'],
      canInitiate: true,
      canExecute: true,
      canApprove: false,
      canDelegate: true,
    },
  ],
  typicalTaskLoad: { daily: 40, weekly: 160, maxConcurrent: 50 },
  aiContext: {
    briefingPriorities: ['daily-production-schedule', 'quality-alerts', 'material-status', 'team-attendance'],
    taskSortingWeights: { 'quality': 1.5, 'deadline': 1.4, 'safety': 1.3 },
    communicationStyle: 'casual',
  },
};

// ============================================
// All Standard Profiles Map
// ============================================

export const STANDARD_ROLE_PROFILES: Record<string, Partial<RoleProfile>> = {
  'ceo': CEO_PROFILE,
  'cfo': CFO_PROFILE,
  'hr-manager': HR_MANAGER_PROFILE,
  'project-manager': PROJECT_MANAGER_PROFILE,
  'finance-officer': FINANCE_OFFICER_PROFILE,
  'sales-rep': SALES_REP_PROFILE,
  'production-supervisor': PRODUCTION_SUPERVISOR_PROFILE,
};

// ============================================
// Role Templates by Category
// ============================================

export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    id: 'template-executive',
    name: 'Executive Role',
    category: 'executive',
    description: 'Template for C-suite and executive positions',
    baseProfile: {
      jobLevel: 'EXECUTIVE',
      subsidiaryId: 'all',
      typicalTaskLoad: { daily: 15, weekly: 50, maxConcurrent: 20 },
      aiContext: {
        briefingPriorities: ['strategic-updates', 'key-decisions'],
        taskSortingWeights: { 'strategic': 1.5, 'urgent': 1.4 },
        communicationStyle: 'formal',
      },
    },
    customizations: [
      { field: 'title', label: 'Role Title', description: 'Executive title', type: 'text' },
      { field: 'approvalAuthorities', label: 'Approval Authority', description: 'Financial approval limits', type: 'select', options: [
        { value: 'unlimited', label: 'Unlimited' },
        { value: 'high', label: 'Up to UGX 100M' },
        { value: 'medium', label: 'Up to UGX 50M' },
      ]},
    ],
  },
  {
    id: 'template-manager',
    name: 'Manager Role',
    category: 'management',
    description: 'Template for departmental and team managers',
    baseProfile: {
      jobLevel: 'MANAGER',
      typicalTaskLoad: { daily: 25, weekly: 100, maxConcurrent: 35 },
      aiContext: {
        briefingPriorities: ['team-tasks', 'approvals-pending', 'deadlines'],
        taskSortingWeights: { 'team': 1.4, 'deadline': 1.3 },
        communicationStyle: 'casual',
      },
    },
    customizations: [
      { field: 'title', label: 'Role Title', description: 'Manager title', type: 'text' },
      { field: 'departmentId', label: 'Department', description: 'Primary department', type: 'select' },
    ],
  },
  {
    id: 'template-professional',
    name: 'Professional Role',
    category: 'professional',
    description: 'Template for skilled professional positions',
    baseProfile: {
      jobLevel: 'SENIOR',
      typicalTaskLoad: { daily: 35, weekly: 140, maxConcurrent: 45 },
      aiContext: {
        briefingPriorities: ['assigned-tasks', 'deadlines'],
        taskSortingWeights: { 'deadline': 1.4, 'priority': 1.3 },
        communicationStyle: 'casual',
      },
    },
    customizations: [
      { field: 'title', label: 'Role Title', description: 'Professional title', type: 'text' },
      { field: 'skills', label: 'Core Skills', description: 'Required skill categories', type: 'multi-select', options: [
        { value: 'technical', label: 'Technical' },
        { value: 'financial', label: 'Financial' },
        { value: 'customer', label: 'Customer Service' },
        { value: 'operational', label: 'Operations' },
      ]},
    ],
  },
  {
    id: 'template-operational',
    name: 'Operational Role',
    category: 'operational',
    description: 'Template for operational and production roles',
    baseProfile: {
      jobLevel: 'LEAD',
      typicalTaskLoad: { daily: 40, weekly: 160, maxConcurrent: 50 },
      aiContext: {
        briefingPriorities: ['daily-schedule', 'urgent-tasks'],
        taskSortingWeights: { 'deadline': 1.5, 'priority': 1.3 },
        communicationStyle: 'casual',
      },
    },
    customizations: [
      { field: 'title', label: 'Role Title', description: 'Operational role title', type: 'text' },
      { field: 'departmentId', label: 'Department', description: 'Primary department', type: 'select' },
    ],
  },
  {
    id: 'template-support',
    name: 'Support Role',
    category: 'support',
    description: 'Template for administrative and support positions',
    baseProfile: {
      jobLevel: 'JUNIOR',
      typicalTaskLoad: { daily: 45, weekly: 180, maxConcurrent: 60 },
      aiContext: {
        briefingPriorities: ['assigned-tasks', 'deadlines'],
        taskSortingWeights: { 'deadline': 1.4, 'priority': 1.3 },
        communicationStyle: 'casual',
      },
    },
    customizations: [
      { field: 'title', label: 'Role Title', description: 'Support role title', type: 'text' },
      { field: 'departmentId', label: 'Department', description: 'Primary department', type: 'select' },
    ],
  },
];

// ============================================
// Skill Definitions
// ============================================

export const SKILL_CATEGORIES: Record<SkillCategory, { label: string; description: string }> = {
  technical: { label: 'Technical', description: 'Technical and domain-specific expertise' },
  management: { label: 'Management', description: 'People and team management skills' },
  financial: { label: 'Financial', description: 'Financial handling and analysis' },
  customer: { label: 'Customer', description: 'Customer-facing and relationship skills' },
  operational: { label: 'Operational', description: 'Operations and logistics management' },
  strategic: { label: 'Strategic', description: 'Strategy and planning capabilities' },
  compliance: { label: 'Compliance', description: 'Legal and regulatory compliance' },
  administrative: { label: 'Administrative', description: 'Administrative and organizational' },
  creative: { label: 'Creative', description: 'Creative and design capabilities' },
};

export const AUTHORITY_TYPES: Record<AuthorityType, { label: string; description: string }> = {
  financial: { label: 'Financial', description: 'Approve financial transactions' },
  procurement: { label: 'Procurement', description: 'Approve procurement requests' },
  hr: { label: 'HR', description: 'Approve HR actions' },
  leave: { label: 'Leave', description: 'Approve leave requests' },
  expense: { label: 'Expense', description: 'Approve expense claims' },
  contract: { label: 'Contract', description: 'Approve contracts' },
  policy: { label: 'Policy', description: 'Approve policies' },
  operational: { label: 'Operational', description: 'Approve operational decisions' },
};

// ============================================
// Default Escalation Paths
// ============================================

export const DEFAULT_ESCALATION_PATHS: Record<string, string[]> = {
  'staff': ['team-lead', 'manager', 'department-head'],
  'team-lead': ['manager', 'department-head', 'director'],
  'manager': ['department-head', 'director', 'coo'],
  'department-head': ['director', 'coo', 'ceo'],
  'director': ['coo', 'ceo'],
  'coo': ['ceo'],
  'cfo': ['ceo'],
  'cto': ['ceo'],
};

// ============================================
// Job Level Hierarchy
// ============================================

export const JOB_LEVEL_HIERARCHY: Record<string, number> = {
  'intern': 1,
  'associate': 2,
  'professional': 3,
  'team-lead': 4,
  'manager': 5,
  'department-head': 6,
  'director': 7,
  'vp': 8,
  'c-suite': 9,
  'ceo': 10,
};
