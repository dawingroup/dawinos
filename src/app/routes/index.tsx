import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppLayout } from '@/shared/components/layout';
import { useAuth } from '@/shared/hooks';

// Lazy load pages for code splitting
const DawinOSDashboard = lazy(() => import('../pages/DawinOSDashboard'));
const DesignManagerPage = lazy(() => import('../pages/DesignManagerPage'));
const AssetRegistryPage = lazy(() => import('../pages/AssetRegistryPage'));
const FeatureLibraryPage = lazy(() => import('../pages/FeatureLibraryPage'));
const LaunchPipelineModule = lazy(() => import('@/modules/launch-pipeline/LaunchPipelineModule'));
const ClipperPage = lazy(() => import('../pages/ClipperPage'));
const InventoryPage = lazy(() => import('@/modules/inventory/pages/InventoryPage'));
const CustomerHubModule = lazy(() => import('@/modules/customer-hub/CustomerHubModule'));

/**
 * Loading fallback component
 */
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#872E5C]"></div>
    </div>
  );
}

/**
 * HOC to wrap components with Suspense
 */
function withSuspense(Component: React.ComponentType) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

/**
 * Route paths for navigation
 */
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/',
  CLIPPER: '/clipper',
  DESIGN: '/design',
  CUSTOMERS: '/customers',
  ASSETS: '/assets',
  FEATURES: '/features',
  INVENTORY: '/inventory',
  LAUNCH_PIPELINE: '/launch-pipeline',
  AI_TOOLS: '/ai-tools',
  PROCUREMENT: '/procurement',
  PRODUCTION: '/production',
} as const;

export type RoutePath = typeof ROUTES[keyof typeof ROUTES];

/**
 * Main application router
 */
export function AppRouter() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={withSuspense(DawinOSDashboard)} />
        
        {/* Module Routes */}
        <Route
          path="clipper"
          element={withSuspense(ClipperPage)}
        />
        <Route
          path="customers/*"
          element={withSuspense(CustomerHubModule)}
        />
        <Route
          path="design/*"
          element={withSuspense(DesignManagerPage)}
        />
        <Route
          path="assets"
          element={withSuspense(AssetRegistryPage)}
        />
        <Route
          path="features"
          element={withSuspense(FeatureLibraryPage)}
        />
        <Route
          path="inventory/*"
          element={withSuspense(InventoryPage)}
        />
        <Route
          path="launch-pipeline/*"
          element={withSuspense(LaunchPipelineModule)}
        />

        {/* Legacy redirects */}
        <Route path="projects/*" element={<Navigate to="/design" replace />} />
        
        {/* 404 Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default AppRouter;
