/**
 * ModuleTabNav Component
 * Horizontal tab navigation for module sub-pages
 * Replaces nested sidebars with a cleaner UX
 * Sticky positioning with scroll-aware shadow
 */

import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronLeft, LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/core/components/ui/button';

export interface TabNavItem {
  id: string;
  label: string;
  path: string;
  icon?: string | LucideIcon;
  badge?: number | string;
  exact?: boolean;
}

export interface ModuleTabNavProps {
  title: string;
  subtitle?: string;
  tabs: TabNavItem[];
  backPath?: string;
  backLabel?: string;
  accentColor?: string;
  className?: string;
  rightContent?: React.ReactNode;
}

export function ModuleTabNav({
  title,
  subtitle,
  tabs,
  backPath,
  backLabel = 'Back',
  accentColor = 'primary',
  className,
  rightContent,
}: ModuleTabNavProps) {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  // Detect scroll to add shadow effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getIcon = (icon?: string | LucideIcon) => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[icon];
      return Icon ? <Icon className="h-4 w-4" /> : null;
    }
    const IconComponent = icon;
    return <IconComponent className="h-4 w-4" />;
  };

  const isActive = (tab: TabNavItem) => {
    if (tab.exact) {
      return location.pathname === tab.path;
    }
    return location.pathname === tab.path || location.pathname.startsWith(tab.path + '/');
  };

  return (
    <div className={cn(
      'bg-background border-b sticky top-0 z-30 transition-shadow duration-200',
      isScrolled && 'shadow-md',
      className
    )}>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {backPath && (
              <NavLink to={backPath}>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                  <ChevronLeft className="h-4 w-4" />
                  {backLabel}
                </Button>
              </NavLink>
            )}
            <div>
              <h1 className="text-xl font-semibold">{title}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
          {rightContent && (
            <div className="flex items-center gap-3">
              {rightContent}
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {tabs.map((tab) => {
            const active = isActive(tab);
            return (
              <NavLink
                key={tab.id}
                to={tab.path}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  active
                    ? `border-${accentColor} text-${accentColor}`
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                )}
                style={active ? { borderColor: `var(--${accentColor}, hsl(var(--primary)))`, color: `var(--${accentColor}, hsl(var(--primary)))` } : undefined}
              >
                {getIcon(tab.icon)}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={cn(
                    'ml-1 px-1.5 py-0.5 text-xs rounded-full',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {tab.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export default ModuleTabNav;
