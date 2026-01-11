/**
 * Performance Layout
 * Tab-based navigation for Performance module sub-pages
 * Coordinates with main header for sticky positioning
 */

import { Outlet } from 'react-router-dom';
import { ModuleTabNav, TabNavItem } from '@/core/components/navigation/ModuleTabNav';

const PERFORMANCE_TABS: TabNavItem[] = [
  {
    id: 'goals',
    label: 'Goals',
    path: '/performance/goals',
    icon: 'Target',
  },
  {
    id: 'reviews',
    label: 'Reviews',
    path: '/performance/reviews',
    icon: 'ClipboardCheck',
  },
  {
    id: 'competencies',
    label: 'Competencies',
    path: '/performance/competencies',
    icon: 'Award',
  },
  {
    id: 'development',
    label: 'Development Plans',
    path: '/performance/development',
    icon: 'TrendingUp',
  },
];

export function PerformanceLayout() {
  return (
    <div className="flex flex-col min-h-full">
      <ModuleTabNav
        title="Performance"
        subtitle="Goals, Reviews & Development"
        tabs={PERFORMANCE_TABS}
        accentColor="purple"
        className="lg:top-12"
      />
      <div className="flex-1 p-6">
        <Outlet />
      </div>
    </div>
  );
}

export default PerformanceLayout;
