/**
 * Delivery Module Routes
 */

import { Route, Routes } from 'react-router-dom';
import { DeliveryDashboard } from './pages/DeliveryDashboard';
import { ProjectList } from './pages/ProjectList';
import { ProjectDetail } from './pages/ProjectDetail';
import { ProgramList } from './pages/ProgramList';
import { NewProgram } from './pages/NewProgram';
import { NewProject } from './pages/NewProject';

export function DeliveryRoutes() {
  return (
    <Routes>
      <Route index element={<DeliveryDashboard />} />
      <Route path="programs" element={<ProgramList />} />
      <Route path="programs/new" element={<NewProgram />} />
      <Route path="projects" element={<ProjectList />} />
      <Route path="projects/new" element={<NewProject />} />
      <Route path="projects/:projectId" element={<ProjectDetail />} />
    </Routes>
  );
}
