/**
 * Investment Layout - Navigation shell for investment module
 */

import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Kanban, 
  List, 
  PlusCircle,
  Settings,
  BarChart3
} from 'lucide-react';

const navItems = [
  { path: '/advisory/investment', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/advisory/investment/pipeline', label: 'Pipeline', icon: Kanban },
  { path: '/advisory/investment/deals', label: 'Deal List', icon: List },
  { path: '/advisory/investment/deals/new', label: 'New Deal', icon: PlusCircle },
  { path: '/advisory/investment/reports', label: 'Reports', icon: BarChart3 },
];

export function InvestmentLayout() {
  const location = useLocation();

  return (
    <div className="flex h-full">
      {/* Sidebar Navigation */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-lg text-gray-900">Investment</h2>
          <p className="text-xs text-gray-500">Deal Pipeline & Portfolio</p>
        </div>
        
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact 
              ? location.pathname === item.path 
              : location.pathname.startsWith(item.path);
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <NavLink
            to="/advisory/investment/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          >
            <Settings className="w-4 h-4" />
            Settings
          </NavLink>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}

export default InvestmentLayout;
