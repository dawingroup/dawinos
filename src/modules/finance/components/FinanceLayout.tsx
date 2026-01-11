/**
 * Finance Layout
 * Tab-based navigation for Finance module sub-pages
 * Coordinates with main header for sticky positioning
 */

import { Outlet } from 'react-router-dom';
import { ModuleTabNav, TabNavItem } from '@/core/components/navigation/ModuleTabNav';

const FINANCE_TABS: TabNavItem[] = [
  {
    id: 'budgets',
    label: 'Budgets',
    path: '/finance/budgets',
    icon: 'PieChart',
  },
  {
    id: 'expenses',
    label: 'Expenses',
    path: '/finance/expenses',
    icon: 'Receipt',
  },
  {
    id: 'reports',
    label: 'Financial Reports',
    path: '/finance/reports',
    icon: 'FileText',
  },
];

export function FinanceLayout() {
  return (
    <div className="flex flex-col min-h-full">
      <ModuleTabNav
        title="Finance"
        subtitle="Financial Management & Reporting"
        tabs={FINANCE_TABS}
        accentColor="green"
        className="lg:top-12"
      />
      <div className="flex-1 p-6">
        <Outlet />
      </div>
    </div>
  );
}

export default FinanceLayout;
