/**
 * App Routes
 * Route definitions and configuration for the application
 */

import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { AppLayout } from '@/shared/components/layout';

// Lazy load pages for code splitting
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const CutlistProcessorPage = lazy(() => import('../pages/CutlistProcessorPage'));
const DesignManagerPage = lazy(() => import('../pages/DesignManagerPage'));
const AssetRegistryPage = lazy(() => import('../pages/AssetRegistryPage'));
const FeatureLibraryPage = lazy(() => import('../pages/FeatureLibraryPage'));

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
 * Wrap lazy component with Suspense
 */
function withSuspense(Component: React.LazyExoticComponent<React.ComponentType<unknown>>): ReactNode {
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
  CUTLIST: '/cutlist',
  DESIGN: '/design',
  ASSETS: '/assets',
  FEATURES: '/features',
  PROCUREMENT: '/procurement',
  PRODUCTION: '/production',
} as const;

export type RoutePath = typeof ROUTES[keyof typeof ROUTES];

/**
 * Application routes configuration
 */
export const routeConfig: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: withSuspense(DashboardPage),
      },
      {
        path: 'cutlist/*',
        element: withSuspense(CutlistProcessorPage),
      },
      {
        path: 'design/*',
        element: withSuspense(DesignManagerPage),
      },
      {
        path: 'assets',
        element: withSuspense(AssetRegistryPage),
      },
      {
        path: 'features',
        element: withSuspense(FeatureLibraryPage),
      },
    ],
  },
];

/**
 * Create the browser router instance
 */
export const router = createBrowserRouter(routeConfig);
