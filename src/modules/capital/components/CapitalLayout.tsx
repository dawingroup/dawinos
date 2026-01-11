/**
 * Capital Hub Layout
 * Tab-based navigation for Capital module sub-pages
 * Coordinates with main header for sticky positioning
 */

import { Outlet } from 'react-router-dom';
import { ModuleTabNav, TabNavItem } from '@/core/components/navigation/ModuleTabNav';

const CAPITAL_TABS: TabNavItem[] = [
  {
    id: 'deals',
    label: 'Deals',
    path: '/capital/deals',
    icon: 'Handshake',
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    path: '/capital/portfolio',
    icon: 'Briefcase',
  },
  {
    id: 'reports',
    label: 'Investor Reports',
    path: '/capital/reports',
    icon: 'FileBarChart',
  },
  {
    id: 'models',
    label: 'Financial Models',
    path: '/capital/models',
    icon: 'Calculator',
  },
  {
    id: 'tax',
    label: 'Tax Compliance',
    path: '/capital/tax',
    icon: 'FileCheck',
  },
];

export function CapitalLayout() {
  return (
    <div className="flex flex-col min-h-full">
      <ModuleTabNav
        title="Capital Hub"
        subtitle="Investments & Portfolio Management"
        tabs={CAPITAL_TABS}
        accentColor="amber"
        className="lg:top-12"
      />
      <div className="flex-1 p-6">
        <Outlet />
      </div>
    </div>
  );
}

export default CapitalLayout;
