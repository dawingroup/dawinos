/**
 * AppLayout Component
 * Main app shell with sidebar navigation
 */

import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { ModuleNav } from './ModuleNav';

export interface AppLayoutProps {
  children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Header />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-56 bg-white border-r border-gray-200 flex-shrink-0 hidden md:block">
          <ModuleNav />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
