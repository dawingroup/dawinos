/**
 * Advisory Layout
 * Tab-based navigation for Advisory module
 * Follows Capital Hub UI patterns
 */

import { Outlet } from 'react-router-dom';
import { ModuleTabNav, TabNavItem } from '@/core/components/navigation/ModuleTabNav';

const ADVISORY_TABS: TabNavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    path: '/advisory',
    icon: 'LayoutDashboard',
    exact: true,
  },
  {
    id: 'investment',
    label: 'Investment',
    path: '/advisory/investment',
    icon: 'Briefcase',
  },
  {
    id: 'matflow',
    label: 'MatFlow',
    path: '/advisory/matflow',
    icon: 'HardHat',
  },
  {
    id: 'delivery',
    label: 'Delivery',
    path: '/advisory/delivery',
    icon: 'Building2',
  },
];

export function AdvisoryLayout() {
  return (
    <div className="flex flex-col min-h-full">
      <ModuleTabNav
        title="Dawin Advisory"
        subtitle="Construction Consulting & Project Management"
        tabs={ADVISORY_TABS}
        accentColor="amber"
        className="lg:top-12"
      />
      <div className="flex-1 bg-gray-50">
        <Outlet />
      </div>
    </div>
  );
}

export default AdvisoryLayout;
