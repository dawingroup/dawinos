/**
 * Dawin Advisory Module
 * Main entry point for Advisory subsidiary
 * Enhanced with Capital Hub-style UI patterns
 */

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Layout Components
import { AdvisoryLayout } from './components/AdvisoryLayout';

// MatFlow Routes
import { MatFlowRoutes } from './matflow/routes';

// Delivery Routes
import { DeliveryRoutes } from './delivery/routes';

// Advisory Pages (lazy loaded)
const AdvisoryDashboardPage = lazy(() => import('./pages/AdvisoryDashboardPage'));

// Investment Pages (lazy loaded)
const InvestmentDashboard = lazy(() => import('./investment/pages/InvestmentDashboard'));
const PipelineKanban = lazy(() => import('./investment/pages/PipelineKanban'));
const DealDetail = lazy(() => import('./investment/pages/DealDetail'));
const DealList = lazy(() => import('./investment/pages/DealList'));
const NewDeal = lazy(() => import('./investment/pages/NewDeal'));
const Reports = lazy(() => import('./investment/pages/Reports'));
const InvestmentLayout = lazy(() => import('./investment/components/InvestmentLayout'));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
  </div>
);

// Main Advisory Routes
export const AdvisoryRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AdvisoryLayout />}>
        <Route index element={
          <Suspense fallback={<PageLoader />}>
            <AdvisoryDashboardPage />
          </Suspense>
        } />
        {/* Investment Module with nested layout */}
        <Route path="investment" element={
          <Suspense fallback={<PageLoader />}>
            <InvestmentLayout />
          </Suspense>
        }>
          <Route index element={
            <Suspense fallback={<PageLoader />}>
              <InvestmentDashboard />
            </Suspense>
          } />
          <Route path="pipeline" element={
            <Suspense fallback={<PageLoader />}>
              <PipelineKanban />
            </Suspense>
          } />
          <Route path="deals" element={
            <Suspense fallback={<PageLoader />}>
              <DealList />
            </Suspense>
          } />
          <Route path="deals/new" element={
            <Suspense fallback={<PageLoader />}>
              <NewDeal />
            </Suspense>
          } />
          <Route path="deals/:dealId" element={
            <Suspense fallback={<PageLoader />}>
              <DealDetail />
            </Suspense>
          } />
          <Route path="reports" element={
            <Suspense fallback={<PageLoader />}>
              <Reports />
            </Suspense>
          } />
        </Route>
        <Route path="matflow/*" element={<MatFlowRoutes />} />
        <Route path="delivery/*" element={<DeliveryRoutes />} />
        <Route path="*" element={<Navigate to="/advisory" replace />} />
      </Route>
    </Routes>
  );
};

export default AdvisoryRoutes;
