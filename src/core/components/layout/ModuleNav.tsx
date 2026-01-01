/**
 * ModuleNav Component
 * Navigation between modules (sidebar)
 */

import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileSpreadsheet, Palette, Package, Factory, Wrench, Layers, Rocket } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: 'Cutlist Processor',
    href: '/cutlist',
    icon: <FileSpreadsheet className="w-5 h-5" />,
  },
  {
    label: 'Design Manager',
    href: '/design',
    icon: <Palette className="w-5 h-5" />,
  },
  {
    label: 'Asset Registry',
    href: '/assets',
    icon: <Wrench className="w-5 h-5" />,
  },
  {
    label: 'Feature Library',
    href: '/features',
    icon: <Layers className="w-5 h-5" />,
  },
  {
    label: 'Launch Pipeline',
    href: '/launch-pipeline',
    icon: <Rocket className="w-5 h-5" />,
    badge: 'New',
  },
  {
    label: 'Procurement',
    href: '/procurement',
    icon: <Package className="w-5 h-5" />,
    disabled: true,
    badge: 'Soon',
  },
  {
    label: 'Production',
    href: '/production',
    icon: <Factory className="w-5 h-5" />,
    disabled: true,
    badge: 'Soon',
  },
];

export interface ModuleNavProps {
  collapsed?: boolean;
}

export function ModuleNav({ collapsed = false }: ModuleNavProps) {
  return (
    <nav className="flex flex-col gap-1 p-2">
      {navItems.map((item) => (
        <NavLink
          key={item.href}
          to={item.disabled ? '#' : item.href}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              isActive && !item.disabled
                ? 'bg-[#872E5C] text-white'
                : 'text-gray-700 hover:bg-gray-100',
              item.disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent'
            )
          }
          onClick={(e) => item.disabled && e.preventDefault()}
        >
          {item.icon}
          {!collapsed && (
            <>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">
                  {item.badge}
                </span>
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export default ModuleNav;
