/**
 * Delivery Layout Component
 * Tab-based navigation for Infrastructure Delivery module
 */

import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
} from 'lucide-react';
import { ModuleTabNav, type TabNavItem } from '@/core/components/navigation/ModuleTabNav';

const deliveryTabs: TabNavItem[] = [
  { id: 'dashboard', path: '/advisory/delivery', label: 'Overview', icon: LayoutDashboard, exact: true },
  { id: 'programs', path: '/advisory/delivery/programs', label: 'Programs', icon: FolderKanban },
  { id: 'projects', path: '/advisory/delivery/projects', label: 'Projects', icon: FileText },
];

export function DeliveryLayout() {
  return (
    <div className="flex flex-col h-full min-h-0">
      <ModuleTabNav
        title="Infrastructure Delivery"
        subtitle="Program & Project Management"
        tabs={deliveryTabs}
        backPath="/advisory"
        backLabel="Advisory"
        accentColor="blue"
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50 p-6">
        <Outlet />
      </main>
    </div>
  );
}

export default DeliveryLayout;
