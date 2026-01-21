/**
 * Delivery Module Routes
 * With nested routing for persistent project navigation
 *
 * Includes integrated MatFlow features (BOQ, Materials, Formulas, etc.)
 * And Manual Requisition Backlog for legacy data migration
 */

import { Route, Routes, Navigate } from 'react-router-dom';
import { DeliveryLayout } from './components/DeliveryLayout';
import { DeliveryDashboard } from './pages/DeliveryDashboard';
import { ProjectList } from './pages/ProjectList';
import { ProgramList } from './pages/ProgramList';
import { ProgramDetail } from './pages/ProgramDetail';
import { NewProgram } from './pages/NewProgram';
import { NewProject } from './pages/NewProject';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { NewBOQRequisitionPage } from './pages/NewBOQRequisitionPage';
// ADD-FIN-001 Enhanced Forms
import { RequisitionFormEnhanced } from './components/forms/RequisitionFormEnhanced';
import { AccountabilityFormEnhanced } from './components/forms/AccountabilityFormEnhanced';

// Project Layout and Pages
import { ProjectLayout } from './components/projects/ProjectLayout';
import { ProjectOverview } from './pages/ProjectOverview';
import { ProjectProgressPage } from './pages/ProjectProgressPage';
import { ProjectBudgetPage } from './pages/ProjectBudgetPage';
import { ProjectTimelinePage } from './pages/ProjectTimelinePage';
import { ProjectTeamPage } from './pages/ProjectTeamPage';
import { ProjectScopePage } from './pages/ProjectScopePage';
import { ProjectDocumentsPage } from './pages/ProjectDocumentsPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { SiteVisitsPage } from './pages/SiteVisitsPage';
import { RequisitionsPage } from './pages/RequisitionsPage';
import { RequisitionDetailPage } from './pages/RequisitionDetailPage';
import { AccountabilityDetailPage } from './pages/AccountabilityDetailPage';
import { AccountabilityOverviewPage } from './pages/AccountabilityOverviewPage';
import { RequisitionTrackerPage } from './pages/RequisitionTrackerPage';

// Manual Requisition Backlog pages (legacy data migration)
import { ManualRequisitionListPage } from './pages/ManualRequisitionListPage';
import { ManualRequisitionFormPage } from './pages/ManualRequisitionFormPage';
import { ManualRequisitionDetailPage } from './pages/ManualRequisitionDetailPage';

// MatFlow feature imports (integrated) - all use default exports
import BOQImport from '../matflow/pages/BOQImport';
import BOQImportReview from '../matflow/pages/BOQImportReview';
import BOQManagement from '../matflow/pages/BOQManagement';
import MaterialLibrary from '../matflow/pages/MaterialLibrary';
import MaterialForecast from '../matflow/pages/MaterialForecast';
import FormulaDatabase from '../matflow/pages/FormulaDatabase';
import MatFlowProcurement from '../matflow/pages/ProcurementPage';
import SuppliersPage from '../matflow/pages/SuppliersPage';
import MatFlowReports from '../matflow/pages/Reports';

export function DeliveryRoutes() {
  return (
    <Routes>
      <Route element={<DeliveryLayout />}>
        <Route index element={<DeliveryDashboard />} />

        {/* Programs */}
        <Route path="programs" element={<ProgramList />} />
        <Route path="programs/new" element={<NewProgram />} />
        <Route path="programs/:programId" element={<ProgramDetail />} />

        {/* Projects List */}
        <Route path="projects" element={<ProjectList />} />
        <Route path="projects/new" element={<NewProject />} />

        {/* Project Detail with Nested Routes - All routes under ProjectLayout */}
        <Route path="projects/:projectId" element={<ProjectLayout />}>
          {/* Index route - Overview */}
          <Route index element={<ProjectOverview />} />

          {/* BOQ with sub-routes for view modes */}
          <Route path="boq">
            <Route index element={<Navigate to="summary" replace />} />
            <Route path="summary" element={<BOQManagement />} />
            <Route path="details" element={<BOQManagement />} />
            <Route path="materials" element={<BOQManagement />} />
            <Route path="import" element={<BOQImport />} />
            <Route path="review/:jobId" element={<BOQImportReview />} />
          </Route>

          {/* Project Sections */}
          <Route path="scope" element={<ProjectScopePage />} />
          <Route path="budget" element={<ProjectBudgetPage />} />
          <Route path="progress" element={<ProjectProgressPage />} />
          <Route path="timeline" element={<ProjectTimelinePage />} />
          <Route path="team" element={<ProjectTeamPage />} />
          <Route path="documents" element={<ProjectDocumentsPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="visits" element={<SiteVisitsPage />} />
          <Route path="procurement" element={<MatFlowProcurement />} />
          <Route path="tracker" element={<RequisitionTrackerPage />} />

          {/* Requisitions with nested detail routes */}
          <Route path="requisitions">
            <Route index element={<RequisitionsPage />} />
            <Route path="new" element={<NewBOQRequisitionPage />} />
            <Route path="new/manual" element={<RequisitionFormEnhanced />} />
            <Route path=":requisitionId" element={<RequisitionDetailPage />} />
            <Route path=":requisitionId/edit" element={<RequisitionFormEnhanced />} />
            <Route path=":requisitionId/accountability/new" element={<AccountabilityFormEnhanced />} />
          </Route>

          {/* Accountabilities under project context */}
          <Route path="accountabilities/:accountabilityId" element={<AccountabilityDetailPage />} />
        </Route>

        {/* Module-Level Routes (not project-specific) */}
        <Route path="approvals" element={<ApprovalsPage />} />

        {/* Accountability Overview (module-level) */}
        <Route path="accountability" element={<AccountabilityOverviewPage />} />

        {/* Manual Requisition Backlog (legacy data migration) */}
        <Route path="backlog" element={<ManualRequisitionListPage />} />
        <Route path="backlog/new" element={<ManualRequisitionFormPage />} />
        <Route path="backlog/:requisitionId" element={<ManualRequisitionDetailPage />} />
        <Route path="backlog/:requisitionId/edit" element={<ManualRequisitionFormPage />} />

        {/* MatFlow Integration - Material Library */}
        <Route path="materials">
          <Route index element={<MaterialLibrary />} />
          <Route path="forecast" element={<MaterialForecast />} />
        </Route>

        {/* MatFlow Integration - Formula Database */}
        <Route path="formulas" element={<FormulaDatabase />} />

        {/* MatFlow Integration - Suppliers */}
        <Route path="suppliers" element={<SuppliersPage />} />

        {/* MatFlow Integration - Reports */}
        <Route path="reports" element={<MatFlowReports />} />
      </Route>
    </Routes>
  );
}
