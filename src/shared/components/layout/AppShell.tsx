/**
 * AppShell Component
 * Main application layout with sidebar and header
 * Enhanced with command palette and improved navigation UX
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  ChevronDown,
  LogOut,
  User,
  Check,
  Star,
  LucideIcon,
  Building2,
  Settings,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
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
import { useCurrentDawinUser } from '@/core/settings';
import { useUIStore } from '@/shared/stores/uiStore';
import { OfflineBanner } from '@/shared/components/offline/OfflineBanner';
import { useSubsidiary } from '@/contexts/SubsidiaryContext';
import { useNavigationStore } from '@/shared/stores/navigationStore';
import { CommandPalette } from '@/core/components/navigation/CommandPalette';
import { 
  getAllCommandItems,
  FINISHES_NAVIGATION,
  ADVISORY_NAVIGATION,
  CORPORATE_NAVIGATION,
  UTILITY_NAVIGATION,
  ADMIN_NAVIGATION,
  type NavItem,
} from '@/config/navigation.unified';
import { cn } from '@/shared/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { dawinUser } = useCurrentDawinUser();
  const { sidebarOpen, toggleSidebar, sidebarAutoClose } = useUIStore();
  const { currentSubsidiary, subsidiaries, setCurrentSubsidiary } = useSubsidiary();
  const { 
    favoriteItems, 
    recentItems, 
    addFavorite, 
    removeFavorite,
    addRecentItem,
    expandedSections,
    toggleSection,
    setExpandedSections,
  } = useNavigationStore();

  // Scroll detection for header shadow
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 5);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get navigation items based on current subsidiary
  const isAdvisory = currentSubsidiary?.id === 'dawin-advisory';
  
  const mainNavItems = useMemo(() => {
    return isAdvisory ? ADVISORY_NAVIGATION : FINISHES_NAVIGATION;
  }, [isAdvisory]);

  // Corporate modules available to all
  const corporateNavItems = CORPORATE_NAVIGATION;
  const utilityNavItems = UTILITY_NAVIGATION;
  
  // Filter admin navigation based on user roles
  const adminNavItems = useMemo(() => {
    // Fallback admin emails for immediate access
    const adminEmails = ['onzimai@dawin.group'];
    const isAdminEmail = user?.email && adminEmails.includes(user.email);
    
    // Check if user has admin or super_admin global role from DawinUser profile
    let hasAdminRole = false;
    if (dawinUser) {
      hasAdminRole = ['admin', 'owner', 'super_admin'].includes(dawinUser.globalRole);
    }
    
    // Allow access if user has admin role OR is admin email
    if (!hasAdminRole && !isAdminEmail) return [];
    
    return ADMIN_NAVIGATION.filter(item => 
      !item.roles || item.roles.some(role => 
        role === 'admin' || role === 'super_admin' || role === dawinUser?.globalRole
      )
    );
  }, [dawinUser, user?.email]);

  // Command palette items
  const commandItems = useMemo(() => getAllCommandItems(), []);

  // Get subsidiary display name and color
  const subsidiaryName = currentSubsidiary?.name || 'Dawin Finishes';
  const subsidiaryColor = currentSubsidiary?.color || '#872E5C';

  // Auto-expand navigation groups based on active route
  useEffect(() => {
    const allItems = [...mainNavItems, ...corporateNavItems, ...utilityNavItems, ...adminNavItems];
    const activeParents = allItems.filter(item => 
      item.children?.some((child: NavItem) => 
        location.pathname === child.href || 
        (child.href !== '/' && location.pathname.startsWith(child.href))
      )
    );
    
    if (activeParents.length > 0) {
      const newIds = activeParents.map(p => p.id).filter(id => !expandedSections.includes(id));
      if (newIds.length > 0) {
        setExpandedSections([...expandedSections, ...newIds]);
      }
    }
  }, [location.pathname]);

  // Track recent navigation
  useEffect(() => {
    const currentItem = commandItems.find(item => 
      location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    );
    if (currentItem) {
      addRecentItem(currentItem.id);
    }
  }, [location.pathname]);

  const isActive = (href: string) => {
    if (href === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname === href || (href !== '/' && location.pathname.startsWith(href));
  };

  const getIcon = (iconName: string): LucideIcon | null => {
    const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[iconName];
    return Icon || null;
  };

  const handleSubsidiarySwitch = (sub: typeof subsidiaries[0]) => {
    setCurrentSubsidiary(sub);
    // Use React Router navigation instead of full page reload
    const targetPath = sub.id === 'dawin-advisory' ? '/advisory' : '/';
    navigate(targetPath);
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const active = isActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections.includes(item.id);
    const isFavorite = favoriteItems.includes(item.id);
    const IconComponent = getIcon(item.icon);

    return (
      <div key={item.id}>
        <div
          className={cn(
            'group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer select-none',
            active 
              ? 'bg-primary text-primary-foreground' 
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            depth > 0 && 'ml-4'
          )}
          onClick={(e) => {
            if (hasChildren) {
              e.preventDefault();
              toggleSection(item.id);
            }
          }}
        >
          {hasChildren ? (
            <>
              {IconComponent && <IconComponent className="h-4 w-4" />}
              <span className="flex-1">{item.label}</span>
              <ChevronDown className={cn(
                'h-4 w-4 transition-transform',
                isExpanded && 'rotate-180'
              )} />
            </>
          ) : (
            <Link 
              to={item.href} 
              className="flex items-center gap-3 flex-1"
              onClick={() => {
                // Auto-close sidebar on mobile after navigation if enabled
                if (sidebarAutoClose && window.innerWidth < 1024) {
                  setTimeout(() => toggleSidebar(), 100);
                }
              }}
            >
              {IconComponent && <IconComponent className="h-4 w-4" />}
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          )}
          {/* Favorite toggle - only for non-parent items */}
          {!hasChildren && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                isFavorite ? removeFavorite(item.id) : addFavorite(item.id);
              }}
              className={cn(
                'p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity',
                isFavorite ? 'text-yellow-500 opacity-100' : 'hover:text-yellow-500',
                active && 'text-primary-foreground/70 hover:text-primary-foreground'
              )}
            >
              <Star className={cn('h-3 w-3', isFavorite && 'fill-current')} />
            </button>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map((child: NavItem) => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Render corporate nav item for header dropdown
  const renderCorporateMenuItem = (item: NavItem) => {
    const IconComponent = getIcon(item.icon);
    return (
      <DropdownMenuItem
        key={item.id}
        onClick={() => navigate(item.href)}
        className="gap-2 cursor-pointer"
      >
        {IconComponent && <IconComponent className="h-4 w-4" />}
        <div className="flex-1">
          <div className="font-medium">{item.label}</div>
          {item.description && (
            <div className="text-xs text-muted-foreground">{item.description}</div>
          )}
        </div>
      </DropdownMenuItem>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <OfflineBanner />
      
      {/* Desktop Header - Shared Services */}
      <header className={cn(
        "hidden lg:flex sticky top-0 z-40 h-12 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 transition-shadow duration-200",
        isScrolled && "shadow-sm"
      )}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span className="font-medium">Dawin Group</span>
        </div>
        
        <nav className="flex items-center gap-1 ml-4">
          {corporateNavItems.map((item: NavItem) => {
            const IconComponent = getIcon(item.icon);
            const active = isActive(item.href);
            return (
              <Link
                key={item.id}
                to={item.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {IconComponent && <IconComponent className="h-4 w-4" />}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* Command Palette in header */}
        <CommandPalette
          items={commandItems}
          recentItems={recentItems}
          favoriteItems={favoriteItems}
          onAddFavorite={addFavorite}
          onRemoveFavorite={removeFavorite}
        />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                <User className="h-3 w-3" />
              </div>
              <span className="text-sm">{user?.displayName?.split(' ')[0] || 'User'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/profile">Profile</Link>
            </DropdownMenuItem>
            {/* Admin Dashboard - Only show if user has admin role */}
            {adminNavItems.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/admin">
                    <Settings className="mr-2 h-4 w-4" />
                    Admin Dashboard
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Mobile Header */}
      <header className={cn(
        "lg:hidden sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 transition-shadow duration-200",
        isScrolled && "shadow-sm"
      )}>
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <div className="flex-1">
          <CommandPalette
            items={commandItems}
            recentItems={recentItems}
            favoriteItems={favoriteItems}
            onAddFavorite={addFavorite}
            onRemoveFavorite={removeFavorite}
            onSelect={() => {
              // Auto-close sidebar when selecting from command palette on mobile
              if (sidebarAutoClose && window.innerWidth < 1024) {
                setTimeout(() => toggleSidebar(), 100);
              }
            }}
          />
        </div>
        {/* Dawin Group dropdown for mobile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Building2 className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Dawin Group Services
            </div>
            {corporateNavItems.map(renderCorporateMenuItem)}
          </DropdownMenuContent>
        </DropdownMenu>
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
            {/* Admin Dashboard - Only show if user has admin role */}
            {adminNavItems.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/admin">
                    <Settings className="mr-2 h-4 w-4" />
                    Admin Dashboard
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className={cn(
          // Mobile: Start below header (top-14 = 56px), Desktop: sticky below desktop header
          // Use z-[60] to be above Radix UI portaled dropdowns (z-50)
          'fixed left-0 z-[60] w-64 bg-background border-r',
          'top-14 bottom-0', // Mobile: below header
          'lg:sticky lg:top-12 lg:h-[calc(100vh-3rem)] lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          // Add slide-in animation for mobile
          'transition-transform duration-300 ease-in-out'
        )}>
          <div className="flex h-14 items-center px-4 border-b lg:border-b-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 px-2">
                  <div 
                    className="h-8 w-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: subsidiaryColor }}
                  >
                    <span className="text-white font-bold">{subsidiaryName.charAt(0)}</span>
                  </div>
                  <span className="font-semibold flex-1 text-left">{subsidiaryName}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                className="w-56"
                sideOffset={5}
                // Ensure dropdown appears above sidebar (z-[60]) and other elements
                style={{ zIndex: 70 }}
              >
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Switch Subsidiary
                </div>
                {subsidiaries.filter(s => s.status === 'active').map((sub) => (
                  <DropdownMenuItem
                    key={sub.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSubsidiarySwitch(sub);
                    }}
                    className="gap-2 cursor-pointer"
                  >
                    <div 
                      className="h-6 w-6 rounded flex items-center justify-center"
                      style={{ backgroundColor: sub.color }}
                    >
                      <span className="text-white text-xs font-bold">{sub.shortName.charAt(0)}</span>
                    </div>
                    <span className="flex-1">{sub.name}</span>
                    {currentSubsidiary?.id === sub.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                {subsidiaries.filter(s => s.status === 'coming-soon').map((sub) => (
                  <DropdownMenuItem
                    key={sub.id}
                    disabled
                    className="gap-2 opacity-50"
                  >
                    <div 
                      className="h-6 w-6 rounded flex items-center justify-center bg-muted"
                    >
                      <span className="text-muted-foreground text-xs font-bold">{sub.shortName.charAt(0)}</span>
                    </div>
                    <span className="flex-1">{sub.name}</span>
                    <span className="text-xs text-muted-foreground">Soon</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <ScrollArea className="flex-1 h-[calc(100vh-3.5rem-3.5rem-4rem)] lg:h-[calc(100vh-3rem-3.5rem)]">
            <div className="p-4 space-y-6">
              {/* Main Navigation - Subsidiary specific */}
              <div className="space-y-1">
                {mainNavItems.map(item => renderNavItem(item))}
              </div>

              {/* Utility Navigation */}
              <div className="space-y-1">
                {utilityNavItems.map((item: NavItem) => renderNavItem(item))}
              </div>

              {/* Admin Navigation - Only show if user has admin permissions */}
              {adminNavItems.length > 0 && (
                <div>
                  <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Administration
                  </p>
                  <div className="space-y-1">
                    {adminNavItems.map((item: NavItem) => renderNavItem(item))}
                  </div>
                </div>
              )}
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
                    <div className="text-sm text-gray-600">
                      {dawinUser?.displayName || user?.displayName}
                    </div>
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
            className="fixed inset-0 top-14 z-[55] bg-black/50 lg:hidden transition-opacity duration-300"
            onClick={toggleSidebar}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-0 lg:ml-0">
          {children}
        </main>
      </div>
    </div>
  );
}
