// ============================================================================
// STRATEGY ROUTES
// DawinOS v2.0 - CEO Strategy Command Module
// Route configuration for strategy module
// ============================================================================

import React, { lazy, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

// Layout
import { DashboardLayout } from '../layouts/DashboardLayout';

// Lazy-loaded pages
const ExecutiveDashboard = lazy(() => 
  import('../pages/ExecutiveDashboard').then(m => ({ default: m.ExecutiveDashboard }))
);
const StrategyOverview = lazy(() => 
  import('../pages/StrategyOverview').then(m => ({ default: m.StrategyOverview }))
);
const OKRDashboard = lazy(() => 
  import('../pages/OKRDashboard').then(m => ({ default: m.OKRDashboard }))
);
const KPIDashboard = lazy(() => 
  import('../pages/KPIDashboard').then(m => ({ default: m.KPIDashboard }))
);
const PerformanceDeepDive = lazy(() => 
  import('../pages/PerformanceDeepDive').then(m => ({ default: m.PerformanceDeepDive }))
);

// Loading component
const PageLoader: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '50vh',
    }}
  >
    <CircularProgress />
  </Box>
);

// Suspense wrapper
const withSuspense = (Component: React.LazyExoticComponent<React.FC>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const strategyRoutes: RouteObject[] = [
  {
    path: '/strategy',
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: withSuspense(ExecutiveDashboard),
      },
      {
        path: 'dashboard',
        element: withSuspense(ExecutiveDashboard),
      },
      {
        path: 'plans',
        element: withSuspense(StrategyOverview),
      },
      {
        path: 'plans/:planId',
        element: withSuspense(StrategyOverview),
      },
      {
        path: 'okrs',
        element: withSuspense(OKRDashboard),
      },
      {
        path: 'okrs/new',
        element: withSuspense(OKRDashboard),
      },
      {
        path: 'okrs/:objectiveId',
        element: withSuspense(OKRDashboard),
      },
      {
        path: 'kpis',
        element: withSuspense(KPIDashboard),
      },
      {
        path: 'kpis/new',
        element: withSuspense(KPIDashboard),
      },
      {
        path: 'kpis/:kpiId',
        element: withSuspense(KPIDashboard),
      },
      {
        path: 'analytics',
        element: withSuspense(PerformanceDeepDive),
      },
      {
        path: 'entity/:entityId',
        element: withSuspense(PerformanceDeepDive),
      },
      {
        path: 'reports',
        element: withSuspense(PerformanceDeepDive),
      },
      {
        path: 'reviews',
        element: withSuspense(PerformanceDeepDive),
      },
      {
        path: 'settings',
        element: withSuspense(PerformanceDeepDive),
      },
    ],
  },
];

export default strategyRoutes;
