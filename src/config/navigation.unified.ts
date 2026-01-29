/**
 * Unified Navigation Configuration
 * Single source of truth for all navigation items across DawinOS
 * Consolidates: config/navigation.ts + integration/constants/navigation.constants.ts
 */

import type { CommandItem } from '@/core/components/navigation/CommandPalette';

// ============================================================================
// TYPES
// ============================================================================

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  description?: string;
  module?: string;
  roles?: string[];
  children?: NavItem[];
  badge?: number | string;
  keywords?: string[];
}

export interface SubsidiaryConfig {
  id: string;
  name: string;
  shortName: string;
  color: string;
  icon: string;
  defaultPath: string;
  navigation: NavItem[];
}

// ============================================================================
// DAWIN FINISHES NAVIGATION
// ============================================================================

export const FINISHES_NAVIGATION: NavItem[] = [
  {
    id: 'clipper',
    label: 'Clip Library',
    href: '/clipper',
    icon: 'Sparkles',
    description: 'Design inspiration clips',
    keywords: ['inspiration', 'clips', 'images'],
  },
  {
    id: 'design',
    label: 'Design Manager',
    href: '/design',
    icon: 'FolderOpen',
    description: 'Manage design projects',
    keywords: ['projects', 'design', 'items'],
    children: [
      { id: 'design-projects', label: 'Projects', href: '/design', icon: 'FolderOpen' },
      { id: 'design-materials', label: 'Materials', href: '/design/materials', icon: 'Boxes' },
      { id: 'design-features', label: 'Features', href: '/design/features', icon: 'Layers' },
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    href: '/customers',
    icon: 'Users',
    description: 'Customer management',
    keywords: ['clients', 'contacts'],
  },
  {
    id: 'assets',
    label: 'Assets',
    href: '/assets',
    icon: 'Wrench',
    description: 'Asset registry',
    keywords: ['equipment', 'tools', 'machines'],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    href: '/inventory',
    icon: 'Package',
    description: 'Stock management',
    keywords: ['stock', 'materials'],
  },
  {
    id: 'launch-pipeline',
    label: 'Launch Pipeline',
    href: '/launch-pipeline',
    icon: 'Rocket',
    description: 'Product launches',
    keywords: ['launch', 'products', 'pipeline'],
  },
];

// ============================================================================
// DAWIN ADVISORY NAVIGATION
// ============================================================================

export const ADVISORY_NAVIGATION: NavItem[] = [
  {
    id: 'investment',
    label: 'Investment',
    href: '/advisory/investment',
    icon: 'Briefcase',
    description: 'Deal pipeline & portfolio',
    keywords: ['deals', 'pipeline', 'portfolio'],
  },
  {
    id: 'matflow',
    label: 'MatFlow',
    href: '/advisory/matflow',
    icon: 'HardHat',
    description: 'Material flow management',
    keywords: ['boq', 'procurement', 'materials'],
  },
  {
    id: 'delivery',
    label: 'Delivery',
    href: '/advisory/delivery',
    icon: 'Building2',
    description: 'Infrastructure delivery',
    keywords: ['projects', 'programs', 'infrastructure'],
  },
];

// ============================================================================
// SHARED/UTILITY NAVIGATION
// ============================================================================

export const UTILITY_NAVIGATION: NavItem[] = [
  {
    id: 'intelligence',
    label: 'AI Intelligence',
    href: '/ai',
    icon: 'Brain',
    description: 'Smart guidance for daily tasks & workflows',
    keywords: ['ai', 'intelligence', 'guidance', 'tasks', 'workflows', 'smart'],
    children: [
      {
        id: 'my-tasks',
        label: 'My Tasks',
        href: '/my-tasks',
        icon: 'ClipboardList',
        description: 'Your assigned tasks and to-dos',
        keywords: ['tasks', 'my tasks', 'inbox', 'todo'],
      },
      {
        id: 'team-dashboard',
        label: 'Team Dashboard',
        href: '/ai/team',
        icon: 'Users',
        description: 'Team workload and task overview',
        keywords: ['team', 'dashboard', 'workload', 'manager'],
        roles: ['manager', 'admin', 'owner', 'super_admin'],
      },
      {
        id: 'intelligence-admin',
        label: 'Admin Console',
        href: '/ai/admin',
        icon: 'Settings',
        description: 'System configuration and monitoring',
        keywords: ['admin', 'settings', 'configuration', 'monitoring'],
        roles: ['admin', 'owner', 'super_admin'],
      },
    ],
  },
  {
    id: 'assistant',
    label: 'AI Assistant',
    href: '/assistant',
    icon: 'Bot',
    description: 'AI-powered help',
    keywords: ['ai', 'help', 'assistant', 'chat'],
  },
];

// ============================================================================
// ADMIN NAVIGATION
// ============================================================================

export const ADMIN_NAVIGATION: NavItem[] = [
  {
    id: 'admin',
    label: 'Administration',
    href: '/admin',
    icon: 'Settings',
    roles: ['admin', 'super_admin'],
    children: [
      { id: 'admin-users', label: 'Users', href: '/admin/users', icon: 'Users' },
      { id: 'admin-roles', label: 'Roles', href: '/admin/roles', icon: 'Shield' },
      { id: 'admin-settings', label: 'Settings', href: '/admin/settings', icon: 'Settings' },
    ],
  },
];

// ============================================================================
// CORPORATE MODULES (Available across subsidiaries)
// ============================================================================

export const CORPORATE_NAVIGATION: NavItem[] = [
  {
    id: 'strategy',
    label: 'CEO Strategy',
    href: '/strategy',
    icon: 'Target',
    description: 'Strategic planning & OKRs',
    keywords: ['strategy', 'okrs', 'kpis', 'objectives', 'goals', 'performance'],
    children: [
      { id: 'strategy-dashboard', label: 'Executive Dashboard', href: '/strategy/dashboard', icon: 'LayoutDashboard' },
      { id: 'strategy-plans', label: 'Strategy Plans', href: '/strategy/plans', icon: 'FileText' },
      { id: 'strategy-okrs', label: 'OKRs', href: '/strategy/okrs', icon: 'Target' },
      { id: 'strategy-kpis', label: 'KPIs', href: '/strategy/kpis', icon: 'BarChart3' },
      { id: 'strategy-analytics', label: 'Analytics', href: '/strategy/analytics', icon: 'Activity' },
    ],
  },
  {
    id: 'hr',
    label: 'HR Central',
    href: '/hr/employees',
    icon: 'Users',
    description: 'Human resources & performance',
    keywords: ['employees', 'staff', 'payroll', 'leave', 'performance', 'reviews', 'goals'],
    children: [
      { id: 'hr-employees', label: 'Employees', href: '/hr/employees', icon: 'Users' },
      { id: 'hr-performance', label: 'Performance', href: '/hr/performance', icon: 'TrendingUp' },
      { id: 'hr-leave', label: 'Leave', href: '/hr/leave', icon: 'Calendar' },
      { id: 'hr-payroll', label: 'Payroll', href: '/hr/payroll', icon: 'DollarSign' },
      { id: 'hr-organization', label: 'Organization', href: '/hr/organization', icon: 'Sitemap' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    href: '/finance/budgets',
    icon: 'DollarSign',
    description: 'Financial management',
    keywords: ['budgets', 'expenses', 'reports'],
  },
  {
    id: 'capital',
    label: 'Capital Hub',
    href: '/capital/deals',
    icon: 'Briefcase',
    description: 'Investment management',
    keywords: ['deals', 'portfolio', 'investors'],
  },
  {
    id: 'market-intel',
    label: 'Market Intelligence',
    href: '/market-intel/competitors',
    icon: 'Globe',
    description: 'Market research',
    keywords: ['competitors', 'market', 'research', 'insights'],
  },
];

// ============================================================================
// SUBSIDIARY CONFIGURATIONS
// ============================================================================

export const SUBSIDIARIES: SubsidiaryConfig[] = [
  {
    id: 'dawin-finishes',
    name: 'Dawin Finishes',
    shortName: 'Finishes',
    color: '#872E5C',
    icon: 'Palette',
    defaultPath: '/',
    navigation: FINISHES_NAVIGATION,
  },
  {
    id: 'dawin-advisory',
    name: 'Dawin Advisory',
    shortName: 'Advisory',
    color: '#D97706',
    icon: 'HardHat',
    defaultPath: '/advisory',
    navigation: ADVISORY_NAVIGATION,
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Flatten navigation tree into a list of command items for the command palette
 */
export function flattenNavigation(
  items: NavItem[],
  _parentPath?: string
): CommandItem[] {
  const result: CommandItem[] = [];

  for (const item of items) {
    result.push({
      id: item.id,
      label: item.label,
      description: item.description,
      path: item.href,
      icon: item.icon,
      category: 'navigation',
      keywords: item.keywords,
    });

    if (item.children) {
      result.push(...flattenNavigation(item.children, item.href));
    }
  }

  return result;
}

/**
 * Get all command items for the command palette
 */
export function getAllCommandItems(): CommandItem[] {
  return [
    ...flattenNavigation(FINISHES_NAVIGATION),
    ...flattenNavigation(ADVISORY_NAVIGATION),
    ...flattenNavigation(CORPORATE_NAVIGATION),
    ...flattenNavigation(UTILITY_NAVIGATION),
    ...flattenNavigation(ADMIN_NAVIGATION),
  ];
}

/**
 * Get navigation for a specific subsidiary
 */
export function getSubsidiaryNavigation(subsidiaryId: string): NavItem[] {
  const subsidiary = SUBSIDIARIES.find(s => s.id === subsidiaryId);
  return subsidiary?.navigation || FINISHES_NAVIGATION;
}

/**
 * Get the active navigation section based on current path
 */
export function getActiveSection(pathname: string): string | null {
  const allItems = [
    ...FINISHES_NAVIGATION,
    ...ADVISORY_NAVIGATION,
    ...CORPORATE_NAVIGATION,
  ];

  for (const item of allItems) {
    if (pathname === item.href || pathname.startsWith(item.href + '/')) {
      return item.id;
    }
    if (item.children) {
      for (const child of item.children) {
        if (pathname === child.href || pathname.startsWith(child.href + '/')) {
          return item.id;
        }
      }
    }
  }

  return null;
}
