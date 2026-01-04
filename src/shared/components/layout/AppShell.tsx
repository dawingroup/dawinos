/**
 * AppShell Component
 * Main application layout with sidebar and header
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  ChevronDown,
  LogOut,
  User,
} from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { ScrollArea } from '@/core/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import { useAuth } from '@/shared/hooks';
import { useUIStore } from '@/shared/stores/uiStore';
import { OfflineBanner } from '@/shared/components/offline/OfflineBanner';
import { 
  mainNavItems, 
  moduleNavItems, 
  utilityNavItems,
  adminNavItems,
  NavItem,
} from '@/config/navigation';
import { cn } from '@/shared/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Auto-expand navigation groups based on active route
  useEffect(() => {
    const allItems = [...mainNavItems, ...moduleNavItems, ...utilityNavItems, ...adminNavItems];
    const activeParents = allItems.filter(item => 
      item.children?.some(child => 
        location.pathname === child.href || 
        (child.href !== '/' && location.pathname.startsWith(child.href))
      )
    );
    
    if (activeParents.length > 0) {
      setExpandedItems(prev => {
        const newIds = activeParents.map(p => p.id).filter(id => !prev.includes(id));
        return newIds.length > 0 ? [...prev, ...newIds] : prev;
      });
    }
  }, [location.pathname]);

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname === href || (href !== '/' && location.pathname.startsWith(href));
  };

  const hasPermission = (item: NavItem) => {
    if (!user) return false;
    
    // Check roles
    if (item.roles && item.roles.length > 0) {
      const userRoles = (user as any).roles || [];
      const hasRole = item.roles.some(role => userRoles.includes(role));
      if (!hasRole) return false;
    }

    // Check module access
    if (item.module) {
      const userModules = (user as any).modules || [];
      const userRoles = (user as any).roles || [];
      const hasModule = userModules.includes(item.module) || 
                       userRoles.includes('admin') || 
                       userRoles.includes('super_admin');
      if (!hasModule) return false;
    }

    return true;
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    if (!hasPermission(item)) return null;

    const active = isActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);

    return (
      <div key={item.id}>
        <div
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer select-none',
            active 
              ? 'bg-primary text-primary-foreground' 
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            depth > 0 && 'ml-4'
          )}
          onClick={(e) => {
            if (hasChildren) {
              e.preventDefault();
              toggleExpanded(item.id);
            }
          }}
        >
          {hasChildren ? (
            <>
              <item.icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              <ChevronDown className={cn(
                'h-4 w-4 transition-transform',
                isExpanded && 'rotate-180'
              )} />
            </>
          ) : (
            <Link to={item.href} className="flex items-center gap-3 flex-1">
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <OfflineBanner />
      
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <div className="flex-1">
          <span className="font-semibold">Dawin Advisory</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transition-transform lg:translate-x-0 lg:static',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          <div className="flex h-14 items-center px-4 border-b">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#872E5C] to-[#E18425] flex items-center justify-center">
                <span className="text-white font-bold">D</span>
              </div>
              <span className="font-semibold">Dawin Advisory</span>
            </Link>
          </div>

          <ScrollArea className="flex-1 h-[calc(100vh-3.5rem)]">
            <div className="p-4 space-y-6">
              {/* Main Navigation */}
              <div className="space-y-1">
                {mainNavItems.map(item => renderNavItem(item))}
              </div>

              {/* Module Navigation */}
              <div>
                <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Modules
                </p>
                <div className="space-y-1">
                  {moduleNavItems.map(item => renderNavItem(item))}
                </div>
              </div>

              {/* Utility Navigation */}
              <div className="space-y-1">
                {utilityNavItems.map(item => renderNavItem(item))}
              </div>

              {/* Admin Navigation */}
              <div>
                <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Administration
                </p>
                <div className="space-y-1">
                  {adminNavItems.map(item => renderNavItem(item))}
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* User Menu */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium truncate">
                      {user?.displayName || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={toggleSidebar}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
