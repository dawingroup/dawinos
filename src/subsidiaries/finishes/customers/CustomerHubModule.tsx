/**
 * CustomerHubModule
 * Routing for Customer Hub module
 */

import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const CustomerListPage = lazy(() => import('./pages/CustomerListPage'));
const CustomerDetailPage = lazy(() => import('./pages/CustomerDetailPage'));

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

export function CustomerHubModule() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route index element={<CustomerListPage />} />
        <Route path=":customerId" element={<CustomerDetailPage />} />
      </Routes>
    </Suspense>
  );
}

export default CustomerHubModule;
