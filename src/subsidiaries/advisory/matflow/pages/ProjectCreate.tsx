/**
 * Project Create Page
 */

import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';

const ProjectCreate: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Create Project"
        description="Set up a new construction project"
        breadcrumbs={[
          { label: 'MatFlow', href: '/advisory/matflow' },
          { label: 'Projects', href: '/advisory/matflow/projects' },
          { label: 'New Project' },
        ]}
      />
      
      <div className="p-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-500">Project creation form will be implemented here.</p>
        </div>
      </div>
    </div>
  );
};

export default ProjectCreate;
