/**
 * App Routes
 * Route definitions and configuration for the application
 */

import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { AppLayout } from '@/shared/components/layout';

// Lazy load pages for code splitting
const DawinOSDashboard = lazy(() => import('../pages/DawinOSDashboard'));
const CutlistProcessorPage = lazy(() => import('../pages/CutlistProcessorPage'));
const DesignManagerPage = lazy(() => import('../pages/DesignManagerPage'));
const AssetRegistryPage = lazy(() => import('../pages/AssetRegistryPage'));
const FeatureLibraryPage = lazy(() => import('../pages/FeatureLibraryPage'));
const LaunchPipelineModule = lazy(() => import('@/modules/launch-pipeline/LaunchPipelineModule'));
const ClipperPage = lazy(() => import('../pages/ClipperPage'));
// AI tools are now embedded in Strategy Canvas and Design Item Detail pages
// const AIToolsPage = lazy(() => import('@/modules/design-manager/pages/AIToolsPage'));

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
  CLIPPER: '/clipper',
  CUTLIST: '/cutlist',
  DESIGN: '/design',
  ASSETS: '/assets',
  FEATURES: '/features',
  LAUNCH_PIPELINE: '/launch-pipeline',
  AI_TOOLS: '/ai-tools',
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
        element: withSuspense(DawinOSDashboard),
      },
      {
        path: 'clipper',
        element: withSuspense(ClipperPage),
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
      {
        path: 'launch-pipeline/*',
        element: withSuspense(LaunchPipelineModule),
      },
      // AI tools embedded in existing pages - see Strategy Canvas and Design Item Detail
      // {
      //   path: 'ai-tools',
      //   element: withSuspense(AIToolsPage),
      // },
    ],
  },
];

/**
 * Create the browser router instance
 */
export const router = createBrowserRouter(routeConfig);
