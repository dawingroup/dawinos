/**
 * Design Manager Module Entry Point
 * Internal routing for the Design Manager module
 */

import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';

// Lazy load pages for code splitting
const DesignManagerPageNew = lazy(() => import('./components/dashboard/DesignManagerPageNew'));
const ProjectView = lazy(() => import('./components/project/ProjectView'));
const DesignItemDetail = lazy(() => import('./components/design-item/DesignItemDetail'));
const MaterialsPage = lazy(() => import('./pages/MaterialsPage'));
const FeatureLibraryPage = lazy(() => import('./components/feature-library/FeatureLibraryPage'));
const StrategyCanvasPage = lazy(() => import('./pages/StrategyCanvasPage'));

/**
 * Loading fallback
 */
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
        <Route index element={<DesignManagerPageNew />} />
        <Route path="materials" element={<MaterialsPage />} />
        <Route path="features" element={<FeatureLibraryPage />} />
        <Route path="project/:projectId" element={<ProjectView />} />
        <Route path="project/:projectId/strategy" element={<StrategyCanvasPage />} />
        <Route path="project/:projectId/item/:itemId" element={<DesignItemDetail />} />
      </Routes>
    </Suspense>
  );
}
