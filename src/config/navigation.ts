/**
 * Navigation Configuration
 * Defines navigation structure for the application
 */

import {
  LayoutDashboard,
  Briefcase,
  Building2,
  Users,
  TrendingUp,
  PieChart,
  Package,
  Bot,
  Settings,
  UserCircle,
  Bell,
  Shield,
  Activity,
  FileText,
  HardHat,
  ClipboardList,
  Receipt,
  CheckSquare,
  Kanban,
  Scale,
  Wallet,
  FolderOpen,
  Boxes,
  ShoppingCart,
  Truck,
  LucideIcon,
  Image,
  Wrench,
  Layers,
  Rocket,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  module?: string;
  roles?: string[];
  children?: NavItem[];
  badge?: number | string;
}

export const mainNavItems: NavItem[] = [
  {
    id: 'design',
    label: 'Design Manager',
    href: '/design',
    icon: FolderOpen,
    children: [
      { id: 'design-dashboard', label: 'Dashboard', href: '/design', icon: LayoutDashboard },
      { id: 'design-materials', label: 'Materials', href: '/design/materials', icon: Boxes },
      { id: 'design-katana', label: 'Katana Catalog', href: '/design/katana', icon: Package },
      { id: 'design-features', label: 'Features', href: '/design/features', icon: Layers },
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    href: '/customers',
    icon: Users,
  },
  {
    id: 'assets',
    label: 'Assets',
    href: '/assets',
    icon: Wrench, // Using Wrench icon as seen in GlobalHeader
  },
  {
    id: 'inventory',
    label: 'Inventory',
    href: '/inventory',
    icon: Package,
  },
  {
    id: 'launch-pipeline',
    label: 'Launch Pipeline',
    href: '/launch-pipeline',
    icon: Rocket, // Using Rocket icon
    children: [
      { id: 'launch-dashboard', label: 'Pipeline', href: '/launch-pipeline', icon: Kanban },
      { id: 'launch-audit', label: 'Audit', href: '/launch-pipeline/audit', icon: Activity },
    ],
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'engagements',
    label: 'Engagements',
    href: '/engagements',
    icon: Briefcase,
  },
  {
    id: 'clients',
    label: 'Clients',
    href: '/clients',
    icon: Building2,
  },
];

export const moduleNavItems: NavItem[] = [
  {
    id: 'delivery',
    label: 'Infrastructure Delivery',
    href: '/delivery',
    icon: HardHat,
    module: 'infrastructure_delivery',
    children: [
      { id: 'delivery-dashboard', label: 'Dashboard', href: '/delivery', icon: LayoutDashboard },
      { id: 'programs', label: 'Programs', href: '/delivery/programs', icon: FolderOpen },
      { id: 'projects', label: 'Projects', href: '/delivery/projects', icon: FileText },
      { id: 'ipcs', label: 'Payment Certificates', href: '/delivery/ipcs', icon: Receipt },
      { id: 'requisitions', label: 'Requisitions', href: '/delivery/requisitions', icon: ClipboardList },
      { id: 'accountability', label: 'Accountability', href: '/delivery/accountability', icon: FileText },
      { id: 'approvals', label: 'Approval Queue', href: '/delivery/approvals', icon: CheckSquare },
    ],
  },
  {
    id: 'investment',
    label: 'Investment',
    href: '/investment',
    icon: TrendingUp,
    module: 'infrastructure_investment',
    children: [
      { id: 'investment-dashboard', label: 'Dashboard', href: '/investment', icon: LayoutDashboard },
      { id: 'pipeline', label: 'Pipeline', href: '/investment/pipeline', icon: Kanban },
      { id: 'deals', label: 'Deal List', href: '/investment/deals', icon: FileText },
      { id: 'committee', label: 'Investment Committee', href: '/investment/committee', icon: Scale },
      { id: 'reports', label: 'Reports', href: '/investment/reports', icon: PieChart },
      { id: 'settings', label: 'Settings', href: '/investment/settings', icon: Settings },
    ],
  },
  {
    id: 'advisory',
    label: 'Advisory',
    href: '/advisory',
    icon: PieChart,
    module: 'investment_advisory',
    children: [
      { id: 'advisory-dashboard', label: 'Dashboard', href: '/advisory', icon: LayoutDashboard },
      { id: 'portfolios', label: 'Portfolios', href: '/advisory/portfolios', icon: Wallet },
      { id: 'mandates', label: 'Mandates', href: '/advisory/mandates', icon: FileText },
    ],
  },
  {
    id: 'matflow',
    label: 'MatFlow',
    href: '/matflow',
    icon: Package,
    module: 'matflow',
    children: [
      { id: 'matflow-dashboard', label: 'Dashboard', href: '/matflow', icon: LayoutDashboard },
      { id: 'matflow-projects', label: 'Projects', href: '/matflow/projects', icon: FolderOpen },
      { id: 'boq', label: 'Bills of Quantities', href: '/matflow/boq', icon: FileText },
      { id: 'materials', label: 'Material Catalog', href: '/matflow/materials', icon: Boxes },
      { id: 'procurement', label: 'Procurement', href: '/matflow/procurement', icon: ShoppingCart },
      { id: 'deliveries', label: 'Deliveries', href: '/matflow/deliveries', icon: Truck },
      { id: 'budget', label: 'Budget', href: '/matflow/budget', icon: Wallet },
      { id: 'suppliers', label: 'Suppliers', href: '/matflow/suppliers', icon: Truck },
      { id: 'reports', label: 'Reports', href: '/matflow/reports', icon: PieChart },
      { id: 'settings', label: 'Settings', href: '/matflow/settings', icon: Settings },
    ],
  },
];

export const utilityNavItems: NavItem[] = [
  {
    id: 'assistant',
    label: 'AI Assistant',
    href: '/assistant',
    icon: Bot,
  },
];

export const adminNavItems: NavItem[] = [
  {
    id: 'admin',
    label: 'Administration',
    href: '/admin',
    icon: Settings,
    roles: ['admin', 'super_admin'],
    children: [
      { id: 'admin-dashboard', label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { id: 'users', label: 'User Management', href: '/admin/users', icon: Users },
      { id: 'roles', label: 'Role Management', href: '/admin/roles', icon: Shield },
      { id: 'migration', label: 'Data Migration', href: '/admin/migration', icon: Activity },
      { id: 'audit-log', label: 'Audit Log', href: '/admin/audit-log', icon: FileText },
      { id: 'settings', label: 'System Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

export const userNavItems: NavItem[] = [
  {
    id: 'profile',
    label: 'Profile',
    href: '/profile',
    icon: UserCircle,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    href: '/profile/notifications',
    icon: Bell,
  },
];
