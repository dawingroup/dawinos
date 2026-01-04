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
      { id: 'projects', label: 'Projects', href: '/delivery/projects', icon: FolderOpen },
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
      { id: 'deals', label: 'Deal Pipeline', href: '/investment/deals', icon: Kanban },
      { id: 'committee', label: 'Investment Committee', href: '/investment/committee', icon: Scale },
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
      { id: 'boq', label: 'Bills of Quantities', href: '/matflow/boq', icon: FileText },
      { id: 'materials', label: 'Material Catalog', href: '/matflow/materials', icon: Boxes },
      { id: 'procurement', label: 'Procurement', href: '/matflow/procurement', icon: ShoppingCart },
      { id: 'suppliers', label: 'Suppliers', href: '/matflow/suppliers', icon: Truck },
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
