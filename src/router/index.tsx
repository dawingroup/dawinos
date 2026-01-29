/**
 * Router Configuration
 * Main routing setup with lazy loading and guards
 */

import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
} from 'react-router-dom';
import { FullPageLoader } from '@/shared/components/feedback/FullPageLoader';
import { ErrorBoundary } from '@/shared/components/feedback/ErrorBoundary';
import { AppShell } from '@/shared/components/layout/AppShell';
import { AuthGuard } from './guards/AuthGuard';
import { RoleGuard } from './guards/RoleGuard';
import { ModuleGuard } from './guards/ModuleGuard';
import { testRoutes } from './testRoutes';

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
const ClientCreatePage = lazy(() => import('@/pages/clients/ClientCreatePage'));
const ClientDetailPage = lazy(() => import('@/pages/clients/ClientDetailPage'));

// Advisory Module Routes (uses real implementations from subsidiaries)
const AdvisoryRoutes = lazy(() => import('@/subsidiaries/advisory/AdvisoryModule'));

// AI Assistant
const AIAssistantPage = lazy(() => import('@/pages/ai/AIAssistantPage'));

// Module Layouts with Tab Navigation
const HRLayout = lazy(() => import('@/modules/hr/components/HRLayout'));
const PerformanceLayout = lazy(() => import('@/modules/hr-central/performance/components/PerformanceLayout'));
const FinanceLayout = lazy(() => import('@/modules/finance/components/FinanceLayout'));
const CapitalLayout = lazy(() => import('@/modules/capital/components/CapitalLayout'));
const MarketIntelLayout = lazy(() => import('@/modules/intelligence/components/MarketIntelLayout'));

// Admin Pages
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const UserManagementPage = lazy(() => import('@/pages/admin/UserManagementPage'));
const RoleManagementPage = lazy(() => import('@/pages/admin/RoleManagementPage'));
const MigrationDashboardPage = lazy(() => import('@/pages/admin/MigrationDashboardPage'));
const AuditLogPage = lazy(() => import('@/pages/admin/AuditLogPage'));
const SystemSettingsPage = lazy(() => import('@/pages/admin/SystemSettingsPage'));
const SettingsPage = lazy(() => import('@/app/pages/SettingsPage'));

// Finishes Dashboard
const FinishesDashboard = lazy(() => import('@/app/pages/DawinOSDashboard'));

// Finishes Modules
const DesignManagerModule = lazy(() => import('@/modules/design-manager/DesignManagerModule'));
const CustomerHubModule = lazy(() => import('@/modules/customer-hub/CustomerHubModule'));
const LaunchPipelineModule = lazy(() => import('@/modules/launch-pipeline/LaunchPipelineModule'));
const AssetRegistryPage = lazy(() => import('@/modules/assets').then(module => ({ default: module.AssetRegistryPage })));
const ClipperPage = lazy(() => import('@/app/pages/ClipperPage'));
const InventoryPage = lazy(() => import('@/modules/inventory/pages/InventoryPage'));
const FeatureLibraryPage = lazy(() => import('@/modules/design-manager/components/feature-library/FeatureLibraryPage'));

// Client Portal (Public)
const ClientPortalPage = lazy(() => import('@/modules/design-manager/components/client-portal/ClientPortalPage'));

// CD Portal (Public - Country Director Portal for Advisory)
const CDPortalPage = lazy(() => import('@/subsidiaries/advisory/delivery/pages/CDPortalPage').then(m => ({ default: m.CDPortalPage })));

// Market Intelligence Pages
const IntelligenceDashboardPage = lazy(() =>
  import('@/modules/market-intelligence/intelligence-dashboard/pages/IntelligenceDashboardPage')
);
const IntelligenceInsightsPage = lazy(() =>
  import('@/modules/market-intelligence/intelligence-dashboard/pages/IntelligenceInsightsPage')
);
const IntelligenceReportsPage = lazy(() =>
  import('@/modules/market-intelligence/intelligence-dashboard/pages/IntelligenceReportsPage')
);
const IntelligenceAnalyticsPage = lazy(() =>
  import('@/modules/market-intelligence/intelligence-dashboard/pages/IntelligenceAnalyticsPage')
);

// Profile Pages
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'));
const NotificationSettingsPage = lazy(() => import('@/pages/profile/NotificationSettingsPage'));

// HR Central Pages (dashboard removed - direct to content)
const EmployeeListPage = lazy(() => import('@/pages/hr/EmployeeListPage'));
const EmployeeCreatePage = lazy(() => import('@/pages/hr/EmployeeCreatePage'));
const EmployeeDetailPage = lazy(() => import('@/pages/hr/EmployeeDetailPage'));
const EmployeeEditPage = lazy(() => import('@/pages/hr/EmployeeEditPage'));
const LeaveManagementPage = lazy(() => import('@/pages/hr/LeaveManagementPage'));
const PayrollPage = lazy(() => import('@/pages/hr/PayrollPage'));
const OrgStructurePage = lazy(() => import('@/pages/hr/OrgStructurePage'));

// Finance Pages (dashboard removed - direct to content)
const BudgetListPage = lazy(() => import('@/pages/finance/BudgetListPage'));
const ExpenseListPage = lazy(() => import('@/pages/finance/ExpenseListPage'));
const FinancialReportsPage = lazy(() => import('@/pages/finance/FinancialReportsPage'));

// Performance Pages (dashboard removed - direct to content)
const GoalListPage = lazy(() => import('@/pages/performance/GoalListPage'));
const ReviewListPage = lazy(() => import('@/pages/performance/ReviewListPage'));
const CompetencyListPage = lazy(() => import('@/pages/performance/CompetencyListPage'));
const DevelopmentPlanListPage = lazy(() => import('@/pages/performance/DevelopmentPlanListPage'));
const TrainingCatalogPage = lazy(() => import('@/pages/performance/TrainingCatalogPage'));
const TrainingCourseFormPage = lazy(() => import('@/pages/performance/TrainingCourseFormPage'));
const TrainingCourseDetailPage = lazy(() => import('@/pages/performance/TrainingCourseDetailPage'));
const CompetencyFormPage = lazy(() => import('@/pages/performance/CompetencyFormPage'));
const CompetencyDetailPage = lazy(() => import('@/pages/performance/CompetencyDetailPage'));
const DevelopmentPlanFormPage = lazy(() => import('@/pages/performance/DevelopmentPlanFormPage'));

// Capital Hub Pages (dashboard removed - direct to content)
const CapitalDealListPage = lazy(() => import('@/modules/capital/pages/DealListPage'));
const CapitalDealDetailPage = lazy(() => import('@/modules/capital/pages/DealDetailPage'));
const PortfolioListPage = lazy(() => import('@/modules/capital/pages/PortfolioListPage'));
const InvestorReportsPage = lazy(() => import('@/modules/capital/pages/InvestorReportsPage'));
const FinancialModelsPage = lazy(() => import('@/modules/capital/pages/FinancialModelsPage'));
const TaxCompliancePage = lazy(() => import('@/modules/capital/pages/TaxCompliancePage'));

// Market Intelligence Module Pages (dashboard removed - direct to content)
const MarketCompetitorListPage = lazy(() => import('@/modules/intelligence/pages/CompetitorListPage'));
const MarketCompetitorDetailPage = lazy(() => import('@/modules/intelligence/pages/CompetitorDetailPage'));
const MarketCompetitorComparisonPage = lazy(() => import('@/modules/intelligence/pages/CompetitorComparisonPage'));
const MarketNewsFeedPage = lazy(() => import('@/modules/intelligence/pages/NewsFeedPage'));
const MarketAnalysisPage = lazy(() => import('@/modules/intelligence/pages/MarketAnalysisPage'));
const MarketInsightsPage = lazy(() => import('@/modules/intelligence/pages/InsightsPage'));

// Intelligence Layer Module Pages
const IntelligenceLayout = lazy(() => import('@/modules/intelligence-layer/components/IntelligenceLayout'));
const IntelligenceLayerDashboard = lazy(() => import('@/modules/intelligence-layer/pages/IntelligenceLayerDashboardPage'));
const IntelligenceAdminPage = lazy(() => import('@/modules/intelligence-layer/pages/IntelligenceAdminPage'));
const EmployeeTaskInboxPage = lazy(() => import('@/modules/intelligence-layer/pages/EmployeeTaskInboxPage'));
const ManagerDashboardPage = lazy(() => import('@/modules/intelligence-layer/pages/ManagerDashboardPage'));

// Strategy Module Pages
const ExecutiveDashboard = lazy(() => import('@/modules/strategy/pages/ExecutiveDashboard').then(m => ({ default: m.ExecutiveDashboard })));
const StrategyOverview = lazy(() => import('@/modules/strategy/pages/StrategyOverview').then(m => ({ default: m.StrategyOverview })));
const OKRDashboard = lazy(() => import('@/modules/strategy/pages/OKRDashboard').then(m => ({ default: m.OKRDashboard })));
const KPIDashboard = lazy(() => import('@/modules/strategy/pages/KPIDashboard').then(m => ({ default: m.KPIDashboard })));
const PerformanceDeepDive = lazy(() => import('@/modules/strategy/pages/PerformanceDeepDive').then(m => ({ default: m.PerformanceDeepDive })));

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

  // Client Portal (Public - no auth required)
  {
    path: '/client-portal/:token',
    element: <PageWrapper><ClientPortalPage /></PageWrapper>,
  },

  // CD Portal (Public - Country Director Portal, no auth required)
  // Uses /cd-portal path to avoid conflict with /advisory/* protected route
  {
    path: '/cd-portal',
    element: <PageWrapper><CDPortalPage /></PageWrapper>,
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
      // ========================================
      // DAWIN FINISHES ROUTES
      // ========================================
      {
        index: true,
        element: <PageWrapper><FinishesDashboard /></PageWrapper>,
      },
      {
        path: 'clipper',
        element: <PageWrapper><ClipperPage /></PageWrapper>,
      },
      {
        path: 'design/*',
        element: <PageWrapper><DesignManagerModule /></PageWrapper>,
      },
      {
        path: 'customers/*',
        element: <PageWrapper><CustomerHubModule /></PageWrapper>,
      },
      {
        path: 'assets',
        element: <PageWrapper><AssetRegistryPage /></PageWrapper>,
      },
      {
        path: 'inventory',
        element: <PageWrapper><InventoryPage /></PageWrapper>,
      },
      {
        path: 'launch-pipeline/*',
        element: <PageWrapper><LaunchPipelineModule /></PageWrapper>,
      },
      {
        path: 'features',
        element: <PageWrapper><FeatureLibraryPage /></PageWrapper>,
      },

      // ========================================
      // DAWIN ADVISORY ROUTES
      // ========================================
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

      // Clients (shared across all subsidiaries)
      {
        path: 'clients',
        children: [
          { index: true, element: <PageWrapper><ClientListPage /></PageWrapper> },
          { path: 'new', element: <PageWrapper><ClientCreatePage /></PageWrapper> },
          { path: ':clientId', element: <PageWrapper><ClientDetailPage /></PageWrapper> },
        ],
      },

      // ========================================
      // DAWIN ADVISORY MODULE (Complete Implementation)
      // Includes: Investment, MatFlow, Delivery sub-modules
      // ========================================
      {
        path: 'advisory/*',
        element: (
          <ModuleGuard module="investment_advisory">
            <PageWrapper>
              <AdvisoryRoutes />
            </PageWrapper>
          </ModuleGuard>
        ),
      },

      // Market Intelligence Module
      {
        path: 'market-intelligence',
        element: <ModuleGuard module="market_intelligence"><Outlet /></ModuleGuard>,
        children: [
          { index: true, element: <PageWrapper><IntelligenceDashboardPage /></PageWrapper> },
          { path: 'insights', element: <PageWrapper><IntelligenceInsightsPage /></PageWrapper> },
          { path: 'reports', element: <PageWrapper><IntelligenceReportsPage /></PageWrapper> },
          { path: 'analytics', element: <PageWrapper><IntelligenceAnalyticsPage /></PageWrapper> },
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
          { path: 'settings', element: <PageWrapper><SettingsPage /></PageWrapper> },
        ],
      },

      // Profile
      {
        path: 'profile',
        element: <PageWrapper><ProfilePage /></PageWrapper>,
      },

      // ========================================
      // HR CENTRAL ROUTES - with Tab Navigation
      // ========================================
      {
        path: 'hr',
        element: <PageWrapper><HRLayout /></PageWrapper>,
        children: [
          { index: true, element: <Navigate to="/hr/employees" replace /> },
          { path: 'employees', element: <EmployeeListPage /> },
          { path: 'employees/new', element: <EmployeeCreatePage /> },
          { path: 'employees/:employeeId', element: <EmployeeDetailPage /> },
          { path: 'employees/:employeeId/edit', element: <EmployeeEditPage /> },
          { path: 'leave', element: <LeaveManagementPage /> },
          { path: 'payroll', element: <PayrollPage /> },
          { path: 'org-structure', element: <OrgStructurePage /> },
          // Performance sub-module with its own layout
          {
            path: 'performance',
            element: <PageWrapper><PerformanceLayout /></PageWrapper>,
            children: [
              { index: true, element: <Navigate to="/hr/performance/reviews" replace /> },
              { path: 'reviews', element: <ReviewListPage /> },
              { path: 'reviews/:reviewId', element: <ReviewListPage /> },
              { path: 'goals', element: <GoalListPage /> },
              { path: 'goals/:goalId', element: <GoalListPage /> },
              { path: 'competencies', element: <CompetencyListPage /> },
              { path: 'competencies/new', element: <CompetencyFormPage /> },
              { path: 'competencies/:competencyId/edit', element: <CompetencyFormPage /> },
              { path: 'competencies/:competencyId', element: <CompetencyDetailPage /> },
              { path: 'development', element: <DevelopmentPlanListPage /> },
              { path: 'development/new', element: <DevelopmentPlanFormPage /> },
              { path: 'development/:planId/edit', element: <DevelopmentPlanFormPage /> },
              { path: 'training', element: <TrainingCatalogPage /> },
              { path: 'training/new', element: <TrainingCourseFormPage /> },
              { path: 'training/:courseId', element: <TrainingCourseDetailPage /> },
              { path: 'training/:courseId/edit', element: <TrainingCourseFormPage /> },
            ],
          },
        ],
      },

      // ========================================
      // FINANCE ROUTES - with Tab Navigation
      // ========================================
      {
        path: 'finance',
        element: <PageWrapper><FinanceLayout /></PageWrapper>,
        children: [
          { index: true, element: <Navigate to="/finance/budgets" replace /> },
          { path: 'budgets', element: <BudgetListPage /> },
          { path: 'expenses', element: <ExpenseListPage /> },
          { path: 'reports', element: <FinancialReportsPage /> },
        ],
      },

      // ========================================
      // PERFORMANCE ROUTES - DEPRECATED (Redirects to HR)
      // Performance is now part of HR Central
      // ========================================
      {
        path: 'performance',
        children: [
          { index: true, element: <Navigate to="/hr/performance/reviews" replace /> },
          { path: 'goals', element: <Navigate to="/hr/performance/goals" replace /> },
          { path: 'goals/:goalId', element: <Navigate to="/hr/performance/goals" replace /> },
          { path: 'reviews', element: <Navigate to="/hr/performance/reviews" replace /> },
          { path: 'reviews/:reviewId', element: <Navigate to="/hr/performance/reviews" replace /> },
          { path: 'competencies', element: <Navigate to="/hr/performance/competencies" replace /> },
          { path: 'development', element: <Navigate to="/hr/performance/development" replace /> },
        ],
      },

      // ========================================
      // CAPITAL HUB ROUTES - with Tab Navigation
      // ========================================
      {
        path: 'capital',
        element: <PageWrapper><CapitalLayout /></PageWrapper>,
        children: [
          { index: true, element: <Navigate to="/capital/deals" replace /> },
          { path: 'deals', element: <CapitalDealListPage /> },
          { path: 'deals/:dealId', element: <CapitalDealDetailPage /> },
          { path: 'portfolio', element: <PortfolioListPage /> },
          { path: 'reports', element: <InvestorReportsPage /> },
          { path: 'models', element: <FinancialModelsPage /> },
          { path: 'tax', element: <TaxCompliancePage /> },
        ],
      },

      // ========================================
      // MARKET INTELLIGENCE ROUTES - with Tab Navigation
      // ========================================
      {
        path: 'market-intel',
        element: <PageWrapper><MarketIntelLayout /></PageWrapper>,
        children: [
          { index: true, element: <Navigate to="/market-intel/competitors" replace /> },
          { path: 'competitors', element: <MarketCompetitorListPage /> },
          { path: 'competitors/compare', element: <MarketCompetitorComparisonPage /> },
          { path: 'competitors/:competitorId', element: <MarketCompetitorDetailPage /> },
          { path: 'news', element: <MarketNewsFeedPage /> },
          { path: 'market', element: <MarketAnalysisPage /> },
          { path: 'insights', element: <MarketInsightsPage /> },
        ],
      },

      // ========================================
      // INTELLIGENCE LAYER ROUTES (with tab navigation)
      // ========================================
      {
        path: 'ai',
        element: <PageWrapper><IntelligenceLayout /></PageWrapper>,
        children: [
          { index: true, element: <IntelligenceLayerDashboard /> },
          { path: 'team', element: <ManagerDashboardPage /> },
          { path: 'admin', element: <IntelligenceAdminPage /> },
        ],
      },

      // Employee Task Inbox (direct access for employees, also uses layout)
      {
        path: 'my-tasks',
        element: <PageWrapper><IntelligenceLayout /></PageWrapper>,
        children: [
          { index: true, element: <EmployeeTaskInboxPage /> },
        ],
      },

      // ========================================
      // STRATEGY MODULE ROUTES
      // ========================================
      {
        path: 'strategy',
        element: (
          <ModuleGuard module="strategy">
            <PageWrapper><Outlet /></PageWrapper>
          </ModuleGuard>
        ),
        children: [
          { index: true, element: <ExecutiveDashboard /> },
          { path: 'dashboard', element: <ExecutiveDashboard /> },
          { path: 'plans', element: <StrategyOverview /> },
          { path: 'plans/:planId', element: <StrategyOverview /> },
          { path: 'okrs', element: <OKRDashboard /> },
          { path: 'okrs/new', element: <OKRDashboard /> },
          { path: 'okrs/:objectiveId', element: <OKRDashboard /> },
          { path: 'kpis', element: <KPIDashboard /> },
          { path: 'kpis/new', element: <KPIDashboard /> },
          { path: 'kpis/:kpiId', element: <KPIDashboard /> },
          { path: 'analytics', element: <PerformanceDeepDive /> },
          { path: 'entity/:entityId', element: <PerformanceDeepDive /> },
          { path: 'reports', element: <PerformanceDeepDive /> },
          { path: 'reviews', element: <PerformanceDeepDive /> },
          { path: 'settings', element: <PerformanceDeepDive /> },
        ],
      },
    ],
  },

  // Test routes (DawinOS v2.0 Testing Suite)
  ...testRoutes,

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
