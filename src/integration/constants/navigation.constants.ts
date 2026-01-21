// =============================================================================
// NAVIGATION CONSTANTS - Cross-Module Integration
// =============================================================================

import { ModuleId } from './modules.constants';

// ----------------------------------------------------------------------------
// NAVIGATION STRUCTURE
// ----------------------------------------------------------------------------
export interface NavItem {
  id: string;
  label: string;
  icon?: string;
  path?: string;
  module?: ModuleId;
  children?: NavItem[];
  badge?: {
    type: 'count' | 'dot' | 'new';
    value?: number;
    color?: string;
  };
  permissions?: string[];
  dividerAfter?: boolean;
}

export const MAIN_NAVIGATION: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    path: '/dashboard',
    permissions: [],
  },
  {
    id: 'intelligence',
    label: 'Smart Staff',
    icon: 'Brain',
    module: 'intelligence',
    children: [
      { id: 'tasks', label: 'My Tasks', path: '/intelligence/tasks' },
      { id: 'events', label: 'Business Events', path: '/intelligence/events' },
      { id: 'grey_areas', label: 'Grey Areas', path: '/intelligence/grey-areas', badge: { type: 'dot', color: 'warning' } },
    ],
    permissions: ['view:intelligence'],
    dividerAfter: true,
  },
  {
    id: 'hr',
    label: 'HR Central',
    icon: 'Users',
    module: 'hr_central',
    children: [
      { id: 'employees', label: 'Employees', path: '/hr/employees' },
      { id: 'performance', label: 'Performance', path: '/hr/performance/reviews' },
      { id: 'contracts', label: 'Contracts', path: '/hr/contracts' },
      { id: 'payroll', label: 'Payroll', path: '/hr/payroll' },
      { id: 'leave', label: 'Leave Management', path: '/hr/leave' },
      { id: 'organization', label: 'Organization', path: '/hr/organization' },
    ],
    permissions: ['view:hr'],
  },
  {
    id: 'strategy',
    label: 'CEO Strategy',
    icon: 'Target',
    module: 'strategy',
    children: [
      { id: 'overview', label: 'Executive Dashboard', path: '/strategy/dashboard' },
      { id: 'plans', label: 'Strategy Plans', path: '/strategy/plans' },
      { id: 'okrs', label: 'OKRs', path: '/strategy/okrs' },
      { id: 'kpis', label: 'KPIs', path: '/strategy/kpis' },
      { id: 'analytics', label: 'Analytics', path: '/strategy/analytics' },
    ],
    permissions: ['view:strategy'],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: 'DollarSign',
    module: 'financial',
    children: [
      { id: 'dashboard', label: 'Financial Dashboard', path: '/finance/dashboard' },
      { id: 'accounts', label: 'Chart of Accounts', path: '/finance/accounts' },
      { id: 'budgets', label: 'Budgets', path: '/finance/budgets' },
      { id: 'reports', label: 'Reports', path: '/finance/reports' },
      { id: 'cashflow', label: 'Cash Flow', path: '/finance/cashflow' },
    ],
    permissions: ['view:finance'],
  },
  {
    id: 'capital',
    label: 'Capital Hub',
    icon: 'Building2',
    module: 'capital_hub',
    children: [
      { id: 'dashboard', label: 'Capital Dashboard', path: '/capital/dashboard' },
      { id: 'fundraising', label: 'Fundraising', path: '/capital/fundraising' },
      { id: 'investors', label: 'Investors', path: '/capital/investors' },
      { id: 'deals', label: 'Deal Pipeline', path: '/capital/deals' },
      { id: 'allocation', label: 'Capital Allocation', path: '/capital/allocation' },
    ],
    permissions: ['view:capital'],
  },
  {
    id: 'market',
    label: 'Market Intelligence',
    icon: 'Globe',
    module: 'market_intelligence',
    children: [
      { id: 'dashboard', label: 'Intelligence Dashboard', path: '/market-intelligence' },
      { id: 'competitors', label: 'Competitors', path: '/market-intelligence/competitors' },
      { id: 'research', label: 'Market Research', path: '/market-intelligence/research' },
      { id: 'scanning', label: 'Environment Scanning', path: '/market-intelligence/scanning' },
      { id: 'insights', label: 'Insights', path: '/market-intelligence/insights' },
    ],
    permissions: ['view:market'],
  },
];

// ----------------------------------------------------------------------------
// BREADCRUMB CONFIGURATIONS
// ----------------------------------------------------------------------------
export interface BreadcrumbConfig {
  pattern: RegExp;
  crumbs: Array<{
    label: string | ((params: RegExpMatchArray) => string);
    path: string | ((params: RegExpMatchArray) => string);
  }>;
}

export const BREADCRUMB_CONFIGS: BreadcrumbConfig[] = [
  // HR Central
  {
    pattern: /^\/hr\/employees$/,
    crumbs: [
      { label: 'HR Central', path: '/hr' },
      { label: 'Employees', path: '/hr/employees' },
    ],
  },
  {
    pattern: /^\/hr\/employees\/([^/]+)$/,
    crumbs: [
      { label: 'HR Central', path: '/hr' },
      { label: 'Employees', path: '/hr/employees' },
      { label: 'Employee Details', path: (p) => `/hr/employees/${p[0]}` },
    ],
  },
  // Strategy
  {
    pattern: /^\/strategy\/okrs$/,
    crumbs: [
      { label: 'CEO Strategy', path: '/strategy' },
      { label: 'OKRs', path: '/strategy/okrs' },
    ],
  },
  {
    pattern: /^\/strategy\/okrs\/([^/]+)$/,
    crumbs: [
      { label: 'CEO Strategy', path: '/strategy' },
      { label: 'OKRs', path: '/strategy/okrs' },
      { label: 'OKR Details', path: (p) => `/strategy/okrs/${p[0]}` },
    ],
  },
  // Finance
  {
    pattern: /^\/finance\/budgets$/,
    crumbs: [
      { label: 'Finance', path: '/finance' },
      { label: 'Budgets', path: '/finance/budgets' },
    ],
  },
  // Market Intelligence
  {
    pattern: /^\/market-intelligence\/competitors\/([^/]+)$/,
    crumbs: [
      { label: 'Market Intelligence', path: '/market-intelligence' },
      { label: 'Competitors', path: '/market-intelligence/competitors' },
      { label: 'Competitor Details', path: (p) => `/market-intelligence/competitors/${p[0]}` },
    ],
  },
];

// ----------------------------------------------------------------------------
// SEARCH CONFIGURATIONS
// ----------------------------------------------------------------------------
export interface SearchConfig {
  module: ModuleId;
  type: string;
  label: string;
  collection: string;
  searchFields: string[];
  displayField: string;
  subtitleField?: string;
  icon: string;
  urlTemplate: string;
}

export const SEARCH_CONFIGS: SearchConfig[] = [
  {
    module: 'hr_central',
    type: 'employee',
    label: 'Employees',
    collection: 'employees',
    searchFields: ['firstName', 'lastName', 'email', 'employeeId'],
    displayField: 'firstName',
    subtitleField: 'department',
    icon: 'User',
    urlTemplate: '/hr/employees/{id}',
  },
  {
    module: 'hr_central',
    type: 'department',
    label: 'Departments',
    collection: 'departments',
    searchFields: ['name', 'code'],
    displayField: 'name',
    subtitleField: 'parentDepartment',
    icon: 'Building',
    urlTemplate: '/hr/organization/departments/{id}',
  },
  {
    module: 'ceo_strategy',
    type: 'okr',
    label: 'OKRs',
    collection: 'strategy_okrs',
    searchFields: ['title', 'owner'],
    displayField: 'title',
    subtitleField: 'period',
    icon: 'Target',
    urlTemplate: '/strategy/okrs/{id}',
  },
  {
    module: 'ceo_strategy',
    type: 'strategy_document',
    label: 'Strategy Documents',
    collection: 'strategy_documents',
    searchFields: ['title', 'type'],
    displayField: 'title',
    subtitleField: 'version',
    icon: 'FileText',
    urlTemplate: '/strategy/documents/{id}',
  },
  {
    module: 'financial',
    type: 'budget',
    label: 'Budgets',
    collection: 'budgets',
    searchFields: ['name', 'department'],
    displayField: 'name',
    subtitleField: 'fiscalYear',
    icon: 'PieChart',
    urlTemplate: '/finance/budgets/{id}',
  },
  {
    module: 'financial',
    type: 'account',
    label: 'Accounts',
    collection: 'chart_of_accounts',
    searchFields: ['name', 'code', 'number'],
    displayField: 'name',
    subtitleField: 'code',
    icon: 'BookOpen',
    urlTemplate: '/finance/accounts/{id}',
  },
  {
    module: 'capital_hub',
    type: 'investor',
    label: 'Investors',
    collection: 'investors',
    searchFields: ['name', 'type', 'contactEmail'],
    displayField: 'name',
    subtitleField: 'type',
    icon: 'Building2',
    urlTemplate: '/capital/investors/{id}',
  },
  {
    module: 'capital_hub',
    type: 'deal',
    label: 'Deals',
    collection: 'deals',
    searchFields: ['name', 'stage'],
    displayField: 'name',
    subtitleField: 'stage',
    icon: 'Handshake',
    urlTemplate: '/capital/deals/{id}',
  },
  {
    module: 'market_intelligence',
    type: 'competitor',
    label: 'Competitors',
    collection: 'competitors',
    searchFields: ['name', 'industry'],
    displayField: 'name',
    subtitleField: 'industry',
    icon: 'Users',
    urlTemplate: '/market-intelligence/competitors/{id}',
  },
  {
    module: 'market_intelligence',
    type: 'insight',
    label: 'Insights',
    collection: 'market_intelligence_insights',
    searchFields: ['title', 'type'],
    displayField: 'title',
    subtitleField: 'type',
    icon: 'Lightbulb',
    urlTemplate: '/market-intelligence/insights/{id}',
  },
];

// ----------------------------------------------------------------------------
// KEYBOARD SHORTCUTS
// ----------------------------------------------------------------------------
export interface KeyboardShortcut {
  id: string;
  keys: string;
  description: string;
  action: string;
  global: boolean;
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { id: 'global_search', keys: 'Ctrl+K', description: 'Open global search', action: 'openSearch', global: true },
  { id: 'quick_actions', keys: 'Ctrl+Shift+A', description: 'Open quick actions', action: 'openQuickActions', global: true },
  { id: 'notifications', keys: 'Ctrl+Shift+N', description: 'Open notifications', action: 'openNotifications', global: true },
  { id: 'go_dashboard', keys: 'G D', description: 'Go to dashboard', action: 'navigate:/dashboard', global: true },
  { id: 'go_tasks', keys: 'G T', description: 'Go to tasks', action: 'navigate:/intelligence/tasks', global: true },
  { id: 'go_hr', keys: 'G H', description: 'Go to HR', action: 'navigate:/hr/employees', global: true },
  { id: 'go_strategy', keys: 'G S', description: 'Go to Strategy', action: 'navigate:/strategy/dashboard', global: true },
  { id: 'go_finance', keys: 'G F', description: 'Go to Finance', action: 'navigate:/finance/dashboard', global: true },
  { id: 'toggle_sidebar', keys: 'Ctrl+B', description: 'Toggle sidebar', action: 'toggleSidebar', global: true },
];
