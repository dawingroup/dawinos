/**
 * Manufacturing Module Router
 * Nested routes for manufacturing orders, purchase orders, and dashboard
 */

import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';

// Lazy-load pages
const ManufacturingDashboardPage = lazy(() => import('./pages/ManufacturingDashboardPage'));
const ManufacturingOrdersPage = lazy(() => import('./pages/ManufacturingOrdersPage'));
const ManufacturingOrderDetailPage = lazy(() => import('./pages/ManufacturingOrderDetailPage'));
const PurchaseOrdersPage = lazy(() => import('./pages/PurchaseOrdersPage'));
const PurchaseOrderDetailPage = lazy(() => import('./pages/PurchaseOrderDetailPage'));
const ProcurementDashboardPage = lazy(() => import('./pages/ProcurementDashboardPage'));

const LoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
    <CircularProgress />
  </Box>
);

export default function ManufacturingModule() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route index element={<ManufacturingDashboardPage />} />
        <Route path="orders" element={<ManufacturingOrdersPage />} />
        <Route path="orders/:moId" element={<ManufacturingOrderDetailPage />} />
        <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
        <Route path="purchase-orders/:poId" element={<PurchaseOrderDetailPage />} />
        <Route path="procurement" element={<ProcurementDashboardPage />} />
        <Route path="*" element={<Navigate to="/manufacturing" replace />} />
      </Routes>
    </Suspense>
  );
}
