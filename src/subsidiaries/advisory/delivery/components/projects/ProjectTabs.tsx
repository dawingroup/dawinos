/**
 * Project Tabs - Tab navigation for project sections
 */

import { 
  LayoutDashboard, 
  Target, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Users, 
  FileText,
  Receipt,
  MapPin,
  Wallet,
} from 'lucide-react';

export type ProjectTabId = 
  | 'overview' 
  | 'scope' 
  | 'budget' 
  | 'progress' 
  | 'timeline' 
  | 'team' 
  | 'documents'
  | 'payments'
  | 'requisitions'
  | 'visits'
  | 'boq';

interface Tab {
  id: ProjectTabId;
  label: string;
  icon: typeof LayoutDashboard;
}

const TABS: Tab[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'boq', label: 'Control BOQ', icon: FileText },
  { id: 'scope', label: 'Scope', icon: Target },
  { id: 'budget', label: 'Budget', icon: DollarSign },
  { id: 'payments', label: 'Payments', icon: Receipt },
  { id: 'requisitions', label: 'Requisitions', icon: Wallet },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'visits', label: 'Site Visits', icon: MapPin },
  { id: 'timeline', label: 'Timeline', icon: Calendar },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'documents', label: 'Documents', icon: FileText },
];

interface ProjectTabsProps {
  activeTab: ProjectTabId;
  onTabChange: (tabId: ProjectTabId) => void;
}

export function ProjectTabs({ activeTab, onTabChange }: ProjectTabsProps) {
  return (
    <div className="border-b bg-white">
      <nav className="flex overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap
                transition-colors
                ${isActive 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

interface MobileTabSelectorProps {
  activeTab: ProjectTabId;
  onTabChange: (tabId: ProjectTabId) => void;
}

export function MobileTabSelector({ activeTab, onTabChange }: MobileTabSelectorProps) {
  return (
    <div className="md:hidden">
      <select
        value={activeTab}
        onChange={(e) => onTabChange(e.target.value as ProjectTabId)}
        className="w-full px-4 py-3 border rounded-lg bg-white text-gray-900"
      >
        {TABS.map(tab => (
          <option key={tab.id} value={tab.id}>
            {tab.label}
          </option>
        ))}
      </select>
    </div>
  );
}
