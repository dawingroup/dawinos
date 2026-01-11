// =============================================================================
// MODULE CONSTANTS - Cross-Module Integration
// =============================================================================

// ----------------------------------------------------------------------------
// MODULE DEFINITIONS
// ----------------------------------------------------------------------------
export const DAWINOS_MODULES = {
  INTELLIGENCE: 'intelligence',
  HR_CENTRAL: 'hr_central',
  CEO_STRATEGY: 'ceo_strategy',
  FINANCIAL: 'financial',
  STAFF_PERFORMANCE: 'staff_performance',
  CAPITAL_HUB: 'capital_hub',
  MARKET_INTELLIGENCE: 'market_intelligence',
  SETTINGS: 'settings',
} as const;

export type ModuleId = typeof DAWINOS_MODULES[keyof typeof DAWINOS_MODULES];

export interface ModuleDefinition {
  id: ModuleId;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  color: string;
  basePath: string;
  permissions: string[];
  features: string[];
  order: number;
}

export const MODULE_DEFINITIONS: ModuleDefinition[] = [
  {
    id: 'intelligence',
    name: 'Smart Staff Intelligence',
    shortName: 'Intelligence',
    description: 'AI-powered task generation and business event tracking',
    icon: 'Brain',
    color: '#6366F1',
    basePath: '/intelligence',
    permissions: ['view:intelligence', 'manage:intelligence'],
    features: ['task_generation', 'grey_area_detection', 'event_tracking'],
    order: 1,
  },
  {
    id: 'hr_central',
    name: 'HR Central',
    shortName: 'HR',
    description: 'Employee management, payroll, contracts, and leave',
    icon: 'Users',
    color: '#10B981',
    basePath: '/hr',
    permissions: ['view:hr', 'manage:hr', 'approve:hr'],
    features: ['employees', 'contracts', 'payroll', 'leave', 'organization'],
    order: 2,
  },
  {
    id: 'ceo_strategy',
    name: 'CEO Strategy Command',
    shortName: 'Strategy',
    description: 'Strategic planning, OKRs, and executive dashboard',
    icon: 'Target',
    color: '#F59E0B',
    basePath: '/strategy',
    permissions: ['view:strategy', 'manage:strategy', 'approve:strategy'],
    features: ['strategy_docs', 'okrs', 'kpis', 'executive_dashboard'],
    order: 3,
  },
  {
    id: 'financial',
    name: 'Financial Management',
    shortName: 'Finance',
    description: 'Accounting, budgets, reporting, and cash flow',
    icon: 'DollarSign',
    color: '#059669',
    basePath: '/finance',
    permissions: ['view:finance', 'manage:finance', 'approve:finance'],
    features: ['chart_of_accounts', 'budgets', 'reports', 'cash_flow'],
    order: 4,
  },
  {
    id: 'staff_performance',
    name: 'Staff Performance',
    shortName: 'Performance',
    description: 'Performance reviews, goals, compensation, and succession',
    icon: 'Award',
    color: '#8B5CF6',
    basePath: '/performance',
    permissions: ['view:performance', 'manage:performance', 'approve:performance'],
    features: ['reviews', 'goals', 'compensation', 'succession'],
    order: 5,
  },
  {
    id: 'capital_hub',
    name: 'Capital Hub',
    shortName: 'Capital',
    description: 'Fundraising, investor relations, and capital allocation',
    icon: 'Building2',
    color: '#EC4899',
    basePath: '/capital',
    permissions: ['view:capital', 'manage:capital', 'approve:capital'],
    features: ['fundraising', 'investors', 'deals', 'allocation'],
    order: 6,
  },
  {
    id: 'market_intelligence',
    name: 'Market Intelligence',
    shortName: 'Market Intel',
    description: 'Competitor analysis, market research, and environment scanning',
    icon: 'Globe',
    color: '#0EA5E9',
    basePath: '/market-intelligence',
    permissions: ['view:market', 'manage:market'],
    features: ['competitors', 'research', 'scanning', 'dashboard'],
    order: 7,
  },
  {
    id: 'settings',
    name: 'Settings',
    shortName: 'Settings',
    description: 'System configuration and user preferences',
    icon: 'Settings',
    color: '#6B7280',
    basePath: '/settings',
    permissions: ['view:settings', 'manage:settings'],
    features: ['profile', 'organization', 'integrations', 'security'],
    order: 8,
  },
];

// ----------------------------------------------------------------------------
// MODULE RELATIONSHIPS
// ----------------------------------------------------------------------------
export interface ModuleRelationship {
  sourceModule: ModuleId;
  targetModule: ModuleId;
  relationshipType: 'data_flow' | 'reference' | 'dependency';
  description: string;
  dataPoints: string[];
}

export const MODULE_RELATIONSHIPS: ModuleRelationship[] = [
  // HR -> Strategy
  {
    sourceModule: 'hr_central',
    targetModule: 'ceo_strategy',
    relationshipType: 'data_flow',
    description: 'Employee data flows into strategy execution tracking',
    dataPoints: ['employee_count', 'department_structure', 'headcount_budget'],
  },
  // HR -> Performance
  {
    sourceModule: 'hr_central',
    targetModule: 'staff_performance',
    relationshipType: 'data_flow',
    description: 'Employee profiles feed into performance management',
    dataPoints: ['employee_profiles', 'job_grades', 'reporting_lines'],
  },
  // HR -> Finance
  {
    sourceModule: 'hr_central',
    targetModule: 'financial',
    relationshipType: 'data_flow',
    description: 'Payroll data integrates with financial accounting',
    dataPoints: ['payroll_totals', 'benefits_costs', 'leave_accruals'],
  },
  // Strategy -> Performance
  {
    sourceModule: 'ceo_strategy',
    targetModule: 'staff_performance',
    relationshipType: 'data_flow',
    description: 'OKRs cascade to individual performance goals',
    dataPoints: ['okrs', 'kpis', 'strategic_initiatives'],
  },
  // Finance -> Strategy
  {
    sourceModule: 'financial',
    targetModule: 'ceo_strategy',
    relationshipType: 'data_flow',
    description: 'Financial metrics feed executive dashboard',
    dataPoints: ['revenue', 'expenses', 'cash_position', 'budget_variance'],
  },
  // Capital -> Finance
  {
    sourceModule: 'capital_hub',
    targetModule: 'financial',
    relationshipType: 'data_flow',
    description: 'Capital raises impact financial planning',
    dataPoints: ['funding_rounds', 'investor_commitments', 'capital_deployment'],
  },
  // Market Intel -> Strategy
  {
    sourceModule: 'market_intelligence',
    targetModule: 'ceo_strategy',
    relationshipType: 'data_flow',
    description: 'Market insights inform strategic decisions',
    dataPoints: ['competitor_moves', 'market_trends', 'regulatory_changes'],
  },
  // Intelligence -> All
  {
    sourceModule: 'intelligence',
    targetModule: 'hr_central',
    relationshipType: 'dependency',
    description: 'AI generates tasks from HR events',
    dataPoints: ['new_hires', 'terminations', 'contract_expirations'],
  },
];

// ----------------------------------------------------------------------------
// CROSS-MODULE ENTITIES
// ----------------------------------------------------------------------------
export const CROSS_MODULE_ENTITIES = {
  EMPLOYEE: {
    id: 'employee',
    primaryModule: 'hr_central',
    linkedModules: ['staff_performance', 'financial', 'ceo_strategy'],
    searchFields: ['name', 'email', 'employeeId', 'department'],
  },
  DEPARTMENT: {
    id: 'department',
    primaryModule: 'hr_central',
    linkedModules: ['financial', 'ceo_strategy'],
    searchFields: ['name', 'code'],
  },
  OKR: {
    id: 'okr',
    primaryModule: 'ceo_strategy',
    linkedModules: ['staff_performance'],
    searchFields: ['title', 'owner'],
  },
  BUDGET: {
    id: 'budget',
    primaryModule: 'financial',
    linkedModules: ['hr_central', 'ceo_strategy', 'capital_hub'],
    searchFields: ['name', 'department', 'fiscalYear'],
  },
  INVESTOR: {
    id: 'investor',
    primaryModule: 'capital_hub',
    linkedModules: ['financial'],
    searchFields: ['name', 'type', 'contactEmail'],
  },
  COMPETITOR: {
    id: 'competitor',
    primaryModule: 'market_intelligence',
    linkedModules: ['ceo_strategy'],
    searchFields: ['name', 'industry'],
  },
} as const;

// ----------------------------------------------------------------------------
// QUICK ACTIONS BY MODULE
// ----------------------------------------------------------------------------
export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  module: ModuleId;
  path: string;
  shortcut?: string;
  permissions: string[];
}

export const QUICK_ACTIONS: QuickAction[] = [
  // HR Actions
  { id: 'add_employee', label: 'Add Employee', icon: 'UserPlus', module: 'hr_central', path: '/hr/employees/new', shortcut: 'Alt+E', permissions: ['manage:hr'] },
  { id: 'run_payroll', label: 'Run Payroll', icon: 'Calculator', module: 'hr_central', path: '/hr/payroll/run', permissions: ['approve:hr'] },
  { id: 'approve_leave', label: 'Approve Leave', icon: 'Calendar', module: 'hr_central', path: '/hr/leave/approvals', permissions: ['approve:hr'] },

  // Strategy Actions
  { id: 'create_okr', label: 'Create OKR', icon: 'Target', module: 'ceo_strategy', path: '/strategy/okrs/new', shortcut: 'Alt+O', permissions: ['manage:strategy'] },
  { id: 'update_kpi', label: 'Update KPI', icon: 'TrendingUp', module: 'ceo_strategy', path: '/strategy/kpis', permissions: ['manage:strategy'] },

  // Finance Actions
  { id: 'journal_entry', label: 'Journal Entry', icon: 'FileText', module: 'financial', path: '/finance/journal/new', shortcut: 'Alt+J', permissions: ['manage:finance'] },
  { id: 'approve_expense', label: 'Approve Expense', icon: 'Receipt', module: 'financial', path: '/finance/expenses/approvals', permissions: ['approve:finance'] },

  // Performance Actions
  { id: 'start_review', label: 'Start Review', icon: 'ClipboardCheck', module: 'staff_performance', path: '/performance/reviews/new', permissions: ['manage:performance'] },

  // Capital Actions
  { id: 'log_interaction', label: 'Log Investor Interaction', icon: 'MessageSquare', module: 'capital_hub', path: '/capital/interactions/new', permissions: ['manage:capital'] },

  // Market Intel Actions
  { id: 'add_insight', label: 'Add Insight', icon: 'Lightbulb', module: 'market_intelligence', path: '/market-intelligence/insights/new', shortcut: 'Alt+I', permissions: ['manage:market'] },
];

// ----------------------------------------------------------------------------
// NOTIFICATION TYPES BY MODULE
// ----------------------------------------------------------------------------
export const MODULE_NOTIFICATION_TYPES = {
  hr_central: [
    'contract_expiring',
    'leave_request',
    'payroll_pending',
    'onboarding_task',
    'probation_ending',
  ],
  ceo_strategy: [
    'okr_due',
    'kpi_threshold',
    'strategy_review',
    'initiative_milestone',
  ],
  financial: [
    'budget_warning',
    'approval_pending',
    'reconciliation_needed',
    'report_ready',
  ],
  staff_performance: [
    'review_due',
    'goal_deadline',
    'feedback_requested',
    'compensation_review',
  ],
  capital_hub: [
    'investor_followup',
    'deal_milestone',
    'allocation_due',
    'round_closing',
  ],
  market_intelligence: [
    'insight_critical',
    'competitor_alert',
    'regulatory_change',
    'report_published',
  ],
} as const;
