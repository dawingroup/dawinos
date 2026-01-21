/**
 * MatFlow Routes Configuration
 *
 * DEPRECATION NOTICE:
 * MatFlow has been fully integrated into Infrastructure Delivery.
 * All routes now redirect to the deprecation notice page.
 *
 * Exception: /migrate route for data migration tool
 */

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MatFlowDeprecationPage } from './pages/MatFlowDeprecationPage';
import { MigrationTool } from './pages/MigrationTool';

export const MatFlowRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Data Migration Tool - accessible for admins */}
      <Route path="migrate" element={<MigrationTool />} />
      {/* All other MatFlow routes redirect to deprecation page */}
      <Route path="*" element={<MatFlowDeprecationPage />} />
    </Routes>
  );
};

export default MatFlowRoutes;
