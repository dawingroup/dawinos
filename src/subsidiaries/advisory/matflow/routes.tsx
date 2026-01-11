/**
 * MatFlow Routes Configuration
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MatFlowLayout } from './components/layout/MatFlowLayout';

// Pages (lazy loaded)
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ProjectList = React.lazy(() => import('./pages/ProjectList'));
const ProjectDetail = React.lazy(() => import('./pages/ProjectDetail'));
const ProjectCreate = React.lazy(() => import('./pages/ProjectCreate'));
const BOQManagement = React.lazy(() => import('./pages/BOQManagement'));
const BOQImport = React.lazy(() => import('./pages/BOQImport'));
const ProcurementPage = React.lazy(() => import('./pages/ProcurementPage'));
const SuppliersPage = React.lazy(() => import('./pages/SuppliersPage'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Settings = React.lazy(() => import('./pages/Settings'));
const AdminSeed = React.lazy(() => import('./pages/AdminSeed'));
const MaterialLibrary = React.lazy(() => import('./pages/MaterialLibrary'));
const FormulaDatabase = React.lazy(() => import('./pages/FormulaDatabase'));

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
  </div>
);

export const MatFlowRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<MatFlowLayout />}>
        {/* Dashboard */}
        <Route 
          index 
          element={
            <React.Suspense fallback={<PageLoader />}>
              <Dashboard />
            </React.Suspense>
          } 
        />
        
        {/* Projects */}
        <Route path="projects">
          <Route 
            index 
            element={
              <React.Suspense fallback={<PageLoader />}>
                <ProjectList />
              </React.Suspense>
            } 
          />
          <Route 
            path="new" 
            element={
              <React.Suspense fallback={<PageLoader />}>
                <ProjectCreate />
              </React.Suspense>
            } 
          />
          <Route 
            path=":projectId" 
            element={
              <React.Suspense fallback={<PageLoader />}>
                <ProjectDetail />
              </React.Suspense>
            } 
          />
          <Route 
            path=":projectId/import" 
            element={
              <React.Suspense fallback={<PageLoader />}>
                <BOQImport />
              </React.Suspense>
            } 
          />
        </Route>
        
        {/* BOQ Management */}
        <Route 
          path="boq" 
          element={
            <React.Suspense fallback={<PageLoader />}>
              <BOQManagement />
            </React.Suspense>
          } 
        />
        
        {/* Procurement */}
        <Route 
          path="procurement" 
          element={
            <React.Suspense fallback={<PageLoader />}>
              <ProcurementPage />
            </React.Suspense>
          } 
        />
        
        {/* Suppliers */}
        <Route 
          path="suppliers" 
          element={
            <React.Suspense fallback={<PageLoader />}>
              <SuppliersPage />
            </React.Suspense>
          } 
        />
        
        {/* Material Library */}
        <Route 
          path="materials" 
          element={
            <React.Suspense fallback={<PageLoader />}>
              <MaterialLibrary />
            </React.Suspense>
          } 
        />
        
        {/* Formula Database */}
        <Route 
          path="formulas" 
          element={
            <React.Suspense fallback={<PageLoader />}>
              <FormulaDatabase />
            </React.Suspense>
          } 
        />
        
        {/* Reports */}
        <Route 
          path="reports" 
          element={
            <React.Suspense fallback={<PageLoader />}>
              <Reports />
            </React.Suspense>
          } 
        />
        
        {/* Settings */}
        <Route 
          path="settings" 
          element={
            <React.Suspense fallback={<PageLoader />}>
              <Settings />
            </React.Suspense>
          } 
        />
        
        {/* Admin */}
        <Route 
          path="admin/seed" 
          element={
            <React.Suspense fallback={<PageLoader />}>
              <AdminSeed />
            </React.Suspense>
          } 
        />
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/advisory/matflow" replace />} />
      </Route>
    </Routes>
  );
};

export default MatFlowRoutes;
