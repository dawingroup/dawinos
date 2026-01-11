import { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { UnifiedSidebar } from './UnifiedSidebar';
import { TopNavBar } from './TopNavBar';
import { BreadcrumbNav } from './BreadcrumbNav';
import { NotificationCenter } from '@/core/components/notifications/NotificationCenter';
import { GlobalSearch } from '@/core/components/search/GlobalSearch';
import { useKeyboardShortcuts } from '@/core/hooks/useKeyboardShortcuts';
import { useSidebar, useSearch, useAuth } from '@/integration/store';
import { cn } from '@/shared/lib/utils';
import { Sheet, SheetContent } from '@/core/components/ui/sheet';

export interface MainLayoutProps {
  children?: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isOpen: sidebarOpen, isPinned, setSidebarOpen } = useSidebar();
  const { openSearch } = useSearch();
  const { userId } = useAuth();

  // Register keyboard shortcuts
  useKeyboardShortcuts();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle sidebar hover for auto-expand (when not pinned)
  const handleSidebarMouseEnter = useCallback(() => {
    if (!isPinned && !sidebarOpen) {
      setSidebarOpen(true);
    }
  }, [isPinned, sidebarOpen, setSidebarOpen]);

  const handleSidebarMouseLeave = useCallback(() => {
    if (!isPinned && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [isPinned, sidebarOpen, setSidebarOpen]);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <div
        className={cn(
          'hidden md:block shrink-0 transition-all duration-200',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
      >
        <UnifiedSidebar collapsed={!sidebarOpen} />
      </div>

      {/* Mobile Sidebar Drawer */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <UnifiedSidebar onNavigate={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <TopNavBar
          onMenuClick={() => setMobileMenuOpen(true)}
          onOpenNotifications={() => setNotificationsOpen(true)}
          onOpenSearch={openSearch}
        />
        <div className="px-4 py-3 border-b bg-muted/30">
          <BreadcrumbNav />
        </div>
        <main className="flex-1 p-4 overflow-auto">
          {children || <Outlet />}
        </main>
      </div>

      {/* Global Search */}
      {userId && (
        <GlobalSearch organizationId={userId} />
      )}

      {/* Notification Center */}
      <NotificationCenter open={notificationsOpen} onOpenChange={setNotificationsOpen} />
    </div>
  );
}
