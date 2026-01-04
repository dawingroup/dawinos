/**
 * Router Configuration
 * Main routing setup with lazy loading and guards
 */

import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { FullPageLoader } from '@/shared/components/feedback/FullPageLoader';
import { ErrorBoundary } from '@/shared/components/feedback/ErrorBoundary';
import { AppShell } from '@/shared/components/layout/AppShell';
import { AuthGuard } from './guards/AuthGuard';
import { RoleGuard } from './guards/RoleGuard';
import { ModuleGuard } from './guards/ModuleGuard';

// Lazy load pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage'));

const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));

// Engagement Pages
const EngagementListPage = lazy(() => import('@/pages/engagements/EngagementListPage'));
const EngagementDetailPage = lazy(() => import('@/pages/engagements/EngagementDetailPage'));
const EngagementCreatePage = lazy(() => import('@/pages/engagements/EngagementCreatePage'));

// Client Pages
const ClientListPage = lazy(() => import('@/pages/clients/ClientListPage'));
const ClientDetailPage = lazy(() => import('@/pages/clients/ClientDetailPage'));

// Delivery Pages
const DeliveryDashboardPage = lazy(() => import('@/pages/delivery/DeliveryDashboardPage'));
const ProjectListPage = lazy(() => import('@/pages/delivery/ProjectListPage'));
const ProjectDetailPage = lazy(() => import('@/pages/delivery/ProjectDetailPage'));

// Investment Pages
const InvestmentDashboardPage = lazy(() => import('@/pages/investment/InvestmentDashboardPage'));
const DealPipelinePage = lazy(() => import('@/pages/investment/DealPipelinePage'));

// Advisory Pages
const AdvisoryDashboardPage = lazy(() => import('@/pages/advisory/AdvisoryDashboardPage'));
const PortfolioListPage = lazy(() => import('@/pages/advisory/PortfolioListPage'));

// MatFlow Pages
const MatFlowDashboardPage = lazy(() => import('@/pages/matflow/MatFlowDashboardPage'));
const BOQListPage = lazy(() => import('@/pages/matflow/BOQListPage'));

// AI Assistant
const AIAssistantPage = lazy(() => import('@/pages/ai/AIAssistantPage'));

// Admin Pages
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const UserManagementPage = lazy(() => import('@/pages/admin/UserManagementPage'));

// Profile Pages
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'));

// Error Pages
const NotFoundPage = lazy(() => import('@/pages/errors/NotFoundPage'));
const UnauthorizedPage = lazy(() => import('@/pages/errors/UnauthorizedPage'));
const ServerErrorPage = lazy(() => import('@/pages/errors/ServerErrorPage'));
const OfflinePage = lazy(() => import('@/pages/errors/OfflinePage'));

// Page wrapper with Suspense
const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<FullPageLoader />}>
    <ErrorBoundary>{children}</ErrorBoundary>
  </Suspense>
);

export const router = createBrowserRouter([
  // Public routes
  {
    path: '/auth',
    children: [
      {
        path: 'login',
        element: <PageWrapper><LoginPage /></PageWrapper>,
      },
      {
        path: 'forgot-password',
        element: <PageWrapper><ForgotPasswordPage /></PageWrapper>,
      },
      {
        path: 'reset-password',
        element: <PageWrapper><ResetPasswordPage /></PageWrapper>,
      },
      {
        path: 'verify-email',
        element: <PageWrapper><VerifyEmailPage /></PageWrapper>,
      },
    ],
  },

  // Protected routes
  {
    path: '/',
    element: (
      <AuthGuard>
        <AppShell>
          <Outlet />
        </AppShell>
      </AuthGuard>
    ),
    errorElement: <ServerErrorPage />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <PageWrapper><DashboardPage /></PageWrapper>,
      },

      // Engagements
      {
        path: 'engagements',
        children: [
          { index: true, element: <PageWrapper><EngagementListPage /></PageWrapper> },
          { path: 'new', element: <PageWrapper><EngagementCreatePage /></PageWrapper> },
          { path: ':engagementId', element: <PageWrapper><EngagementDetailPage /></PageWrapper> },
        ],
      },

      // Clients
      {
        path: 'clients',
        children: [
          { index: true, element: <PageWrapper><ClientListPage /></PageWrapper> },
          { path: ':clientId', element: <PageWrapper><ClientDetailPage /></PageWrapper> },
        ],
      },

      // Delivery Module
      {
        path: 'delivery',
        element: <ModuleGuard module="infrastructure_delivery"><Outlet /></ModuleGuard>,
        children: [
          { index: true, element: <PageWrapper><DeliveryDashboardPage /></PageWrapper> },
          { path: 'projects', element: <PageWrapper><ProjectListPage /></PageWrapper> },
          { path: 'projects/:projectId', element: <PageWrapper><ProjectDetailPage /></PageWrapper> },
        ],
      },

      // Investment Module
      {
        path: 'investment',
        element: <ModuleGuard module="infrastructure_investment"><Outlet /></ModuleGuard>,
        children: [
          { index: true, element: <PageWrapper><InvestmentDashboardPage /></PageWrapper> },
          { path: 'deals', element: <PageWrapper><DealPipelinePage /></PageWrapper> },
        ],
      },

      // Advisory Module
      {
        path: 'advisory',
        element: <ModuleGuard module="investment_advisory"><Outlet /></ModuleGuard>,
        children: [
          { index: true, element: <PageWrapper><AdvisoryDashboardPage /></PageWrapper> },
          { path: 'portfolios', element: <PageWrapper><PortfolioListPage /></PageWrapper> },
        ],
      },

      // MatFlow Module
      {
        path: 'matflow',
        element: <ModuleGuard module="matflow"><Outlet /></ModuleGuard>,
        children: [
          { index: true, element: <PageWrapper><MatFlowDashboardPage /></PageWrapper> },
          { path: 'boq', element: <PageWrapper><BOQListPage /></PageWrapper> },
        ],
      },

      // AI Assistant
      {
        path: 'assistant',
        element: <PageWrapper><AIAssistantPage /></PageWrapper>,
      },

      // Admin
      {
        path: 'admin',
        element: <RoleGuard roles={['admin', 'super_admin']}><Outlet /></RoleGuard>,
        children: [
          { index: true, element: <PageWrapper><AdminDashboardPage /></PageWrapper> },
          { path: 'users', element: <PageWrapper><UserManagementPage /></PageWrapper> },
        ],
      },

      // Profile
      {
        path: 'profile',
        element: <PageWrapper><ProfilePage /></PageWrapper>,
      },
    ],
  },

  // Error routes
  {
    path: '/unauthorized',
    element: <PageWrapper><UnauthorizedPage /></PageWrapper>,
  },
  {
    path: '/offline',
    element: <PageWrapper><OfflinePage /></PageWrapper>,
  },
  {
    path: '*',
    element: <PageWrapper><NotFoundPage /></PageWrapper>,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
