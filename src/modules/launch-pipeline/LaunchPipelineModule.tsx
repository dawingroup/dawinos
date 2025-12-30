/**
 * Launch Pipeline Module Entry Point
 * Internal routing for the Launch Pipeline module
 */

import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';

// Lazy load pages for code splitting
const PipelineDashboard = lazy(() => import('./pages/LaunchPipelinePage'));
const ProductDetail = lazy(() => import('./pages/ProductDetailPage'));
const AuditPage = lazy(() => import('./pages/AuditPage'));

/**
 * Loading fallback
 */
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#872E5C]"></div>
    </div>
  );
}

/**
 * Launch Pipeline Module with internal routing
 */
export function LaunchPipelineModule() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route index element={<PipelineDashboard />} />
        <Route path="product/:productId" element={<ProductDetail />} />
        <Route path="audit" element={<AuditPage />} />
      </Routes>
    </Suspense>
  );
}

export { LaunchPipelineModule as default };
