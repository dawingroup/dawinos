/**
 * Investment Module Routes
 */

import { lazy, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
  </div>
);

// Lazy load pages
const InvestmentDashboard = lazy(() => import('./pages/InvestmentDashboard'));
const PipelineKanban = lazy(() => import('./pages/PipelineKanban'));
const DealDetail = lazy(() => import('./pages/DealDetail'));

// Wrapper with Suspense
const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const investmentRoutes: RouteObject[] = [
  {
    path: '/investment',
    children: [
      {
        index: true,
        element: withSuspense(InvestmentDashboard)
      },
      {
        path: 'pipeline',
        element: withSuspense(PipelineKanban)
      },
      {
        path: 'deals',
        children: [
          {
            path: ':dealId',
            element: withSuspense(DealDetail)
          }
        ]
      }
    ]
  }
];

export default investmentRoutes;
