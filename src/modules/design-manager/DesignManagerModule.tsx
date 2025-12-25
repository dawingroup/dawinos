/**
 * Design Manager Module Entry Point
 * Internal routing for the Design Manager module
 */

import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';

// Lazy load pages for code splitting
const DesignDashboard = lazy(() => import('./components/dashboard/DesignDashboard'));
const ProjectView = lazy(() => import('./components/project/ProjectView'));
const DesignItemDetail = lazy(() => import('./components/design-item/DesignItemDetail'));

/**
 * Loading fallback
 */
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A7C8E]"></div>
    </div>
  );
}

/**
 * Design Manager Module with internal routing
 */
export default function DesignManagerModule() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route index element={<DesignDashboard />} />
        <Route path="project/:projectId" element={<ProjectView />} />
        <Route path="project/:projectId/item/:itemId" element={<DesignItemDetail />} />
      </Routes>
    </Suspense>
  );
}
