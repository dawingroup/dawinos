/**
 * Delivery Module Routes
 * With tab-based layout navigation
 */

import { Route, Routes } from 'react-router-dom';
import { DeliveryLayout } from './components/DeliveryLayout';
import { DeliveryDashboard } from './pages/DeliveryDashboard';
import { ProjectList } from './pages/ProjectList';
import { ProjectDetail } from './pages/ProjectDetail';
import { ProgramList } from './pages/ProgramList';
import { ProgramDetail } from './pages/ProgramDetail';
import { NewProgram } from './pages/NewProgram';
import { NewProject } from './pages/NewProject';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { SiteVisitsPage } from './pages/SiteVisitsPage';

export function DeliveryRoutes() {
  return (
    <Routes>
      <Route element={<DeliveryLayout />}>
        <Route index element={<DeliveryDashboard />} />
        <Route path="programs" element={<ProgramList />} />
        <Route path="programs/new" element={<NewProgram />} />
        <Route path="programs/:programId" element={<ProgramDetail />} />
        <Route path="projects" element={<ProjectList />} />
        <Route path="projects/new" element={<NewProject />} />
        <Route path="projects/:projectId" element={<ProjectDetail />} />
        <Route path="projects/:projectId/payments" element={<PaymentsPage />} />
        <Route path="projects/:projectId/visits" element={<SiteVisitsPage />} />
        <Route path="approvals" element={<ApprovalsPage />} />
      </Route>
    </Routes>
  );
}
