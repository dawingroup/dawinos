/**
 * MatFlow Layout Component
 * Main layout wrapper with navigation and context providers
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Outlet, NavLink } from 'react-router-dom';
import {
  Menu,
  LayoutDashboard,
  FileText,
  Package,
  ShoppingCart,
  Receipt,
  Truck,
  Wallet,
  Bot,
  Settings,
  Bell,
  WifiOff,
  RefreshCw,
  ChevronRight,
  Building2,
  X,
} from 'lucide-react';
import { cn } from '@/core/lib/utils';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

export const MatFlowLayout: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { isOnline } = useNetworkStatus();
  
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [notificationOpen, setNotificationOpen] = useState(false);
  
  // Check for mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setDrawerOpen(!mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Placeholder for context values - will be connected later
  const currentProject = { name: 'Current Project' };
  const [syncStatus, _setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const pendingChanges = 0;
  const pendingApprovals: Array<{ id: string; number: string; description: string; status: string }> = [];

  // Navigation items with dynamic badges
  const navItems: NavItem[] = [
    { label: 'Dashboard', path: 'dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Bill of Quantities', path: 'boq', icon: <FileText className="w-5 h-5" /> },
    { label: 'Material Library', path: 'materials', icon: <Package className="w-5 h-5" /> },
    { 
      label: 'Requisitions', 
      path: 'requisitions', 
      icon: <ShoppingCart className="w-5 h-5" />,
      badge: pendingApprovals?.length || 0,
    },
    { label: 'Purchase Orders', path: 'purchase-orders', icon: <Receipt className="w-5 h-5" /> },
    { label: 'Deliveries', path: 'deliveries', icon: <Truck className="w-5 h-5" /> },
    { label: 'Budget Tracking', path: 'budget', icon: <Wallet className="w-5 h-5" /> },
    { label: 'Suppliers', path: 'suppliers', icon: <Building2 className="w-5 h-5" /> },
    { label: 'AI Tools', path: 'ai-tools', icon: <Bot className="w-5 h-5" /> },
  ];

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(`/advisory/matflow/${projectId}/${path}`);
    if (isMobile) setDrawerOpen(false);
  };

  const syncNow = async () => {
    console.log('Syncing...');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Overlay for Mobile */}
      {isMobile && drawerOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-72 bg-white border-r border-gray-200 transition-transform duration-300',
          'md:relative md:translate-x-0',
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 bg-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">MatFlow</h1>
                <p className="text-sm opacity-80 truncate">
                  {currentProject?.name}
                </p>
              </div>
              {isMobile && (
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 hover:bg-blue-500 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Offline Status */}
          {!isOnline && (
            <div className="px-4 py-2 bg-yellow-100 flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-yellow-700" />
              <span className="text-xs text-yellow-700">
                Offline Mode • {pendingChanges} pending
              </span>
            </div>
          )}

          {/* Sync Progress */}
          {syncStatus === 'syncing' && (
            <div className="h-1 bg-blue-200">
              <div className="h-full bg-blue-600 animate-pulse w-1/2" />
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={`/advisory/matflow/${projectId}/${item.path}`}
                onClick={() => isMobile && setDrawerOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors',
                    'hover:bg-gray-100',
                    isActive && 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                  )
                }
              >
                <span className="relative">
                  {item.icon}
                  {item.badge ? (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  ) : null}
                </span>
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Settings */}
          <div className="border-t border-gray-200 py-2">
            <button
              onClick={() => handleNavigation('settings')}
              className="flex items-center gap-3 px-4 py-3 mx-2 rounded-lg hover:bg-gray-100 w-full text-left"
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={cn('flex-1 flex flex-col min-h-screen', !isMobile && 'md:ml-0')}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={handleDrawerToggle}
                className="p-2 hover:bg-gray-100 rounded-lg md:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Breadcrumbs */}
              <nav className="flex items-center gap-1 text-sm">
                <button
                  onClick={() => navigate('/advisory')}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Advisory
                </button>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <button
                  onClick={() => navigate(`/advisory/matflow/${projectId}/dashboard`)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  MatFlow
                </button>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900 font-medium">
                  {currentProject?.name}
                </span>
              </nav>
            </div>

            <div className="flex items-center gap-2">
              {/* Sync Button */}
              {pendingChanges > 0 && isOnline && (
                <button
                  onClick={syncNow}
                  disabled={syncStatus === 'syncing'}
                  className="relative p-2 hover:bg-gray-100 rounded-lg"
                >
                  <RefreshCw className={cn('w-5 h-5', syncStatus === 'syncing' && 'animate-spin')} />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {pendingChanges}
                  </span>
                </button>
              )}

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className="relative p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Bell className="w-5 h-5" />
                  {pendingApprovals.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {pendingApprovals.length}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {notificationOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setNotificationOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="p-3 border-b border-gray-200">
                        <h3 className="font-semibold">Pending Approvals</h3>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {pendingApprovals.length > 0 ? (
                          pendingApprovals.slice(0, 5).map((req) => (
                            <button
                              key={req.id}
                              onClick={() => {
                                navigate(`/advisory/matflow/${projectId}/requisitions/${req.id}`);
                                setNotificationOpen(false);
                              }}
                              className="w-full p-3 hover:bg-gray-50 text-left border-b border-gray-100 last:border-0"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-sm">{req.number}</p>
                                  <p className="text-xs text-gray-500 truncate">{req.description}</p>
                                </div>
                                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">
                                  {req.status}
                                </span>
                              </div>
                            </button>
                          ))
                        ) : (
                          <p className="p-4 text-sm text-gray-500 text-center">
                            No pending approvals
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MatFlowLayout;
