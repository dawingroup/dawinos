/**
 * Dawin Advisory Module
 * Main entry point for Advisory subsidiary
 */

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate, Outlet } from 'react-router-dom';
import {
  HardHat,
  FolderKanban,
  FileSpreadsheet,
  TrendingUp,
  Receipt,
  ChevronRight,
  Building2,
  Briefcase,
  Loader2,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';

// MatFlow Routes
import { MatFlowRoutes } from './matflow/routes';

// Delivery Routes
import { DeliveryRoutes } from './delivery/routes';

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
    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
  </div>
);

// Navigation items for Advisory
const advisoryModules = [
  {
    id: 'investment',
    name: 'Investment',
    description: 'Deal pipeline & portfolio management',
    icon: Briefcase,
    path: '/advisory/investment',
    color: 'bg-emerald-600',
  },
  {
    id: 'matflow',
    name: 'MatFlow',
    description: 'Material flow & project tracking',
    icon: HardHat,
    path: '/advisory/matflow',
    color: 'bg-amber-500',
  },
  {
    id: 'delivery',
    name: 'Delivery',
    description: 'Infrastructure delivery management',
    icon: Building2,
    path: '/advisory/delivery',
    color: 'bg-blue-600',
  },
];

// Advisory Dashboard
const AdvisoryDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dawin Advisory</h1>
        <p className="text-gray-500 mt-2">Construction consulting and project management tools</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {advisoryModules.map((module) => {
          const Icon = module.icon;
          return (
            <button
              key={module.id}
              onClick={() => navigate(module.path)}
              className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all text-left group"
            >
              <div className={cn('p-3 rounded-lg', module.color)}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">
                    {module.name}
                  </h3>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-amber-500 transition-colors" />
                </div>
                <p className="text-sm text-gray-500 mt-1">{module.description}</p>
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Quick Stats */}
      <div className="mt-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <FolderKanban className="h-4 w-4" />
              <span className="text-sm">Active Projects</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">--</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="text-sm">BOQ Items</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">--</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Receipt className="h-4 w-4" />
              <span className="text-sm">Deliveries</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">--</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Compliance</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">--%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Advisory Layout - no sidebar, content rendered directly
const AdvisoryLayout: React.FC = () => {
  return (
    <div className="min-h-full bg-gray-50">
      <Outlet />
    </div>
  );
};

// Main Advisory Routes
export const AdvisoryRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AdvisoryLayout />}>
        <Route index element={<AdvisoryDashboard />} />
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
