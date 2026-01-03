/**
 * BOQ Management Page
 */

import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { ClipboardList } from 'lucide-react';

const BOQManagement: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="BOQ Management"
        description="Bill of Quantities overview across all projects"
        breadcrumbs={[
          { label: 'MatFlow', href: '/advisory/matflow' },
          { label: 'BOQ Management' },
        ]}
      />
      
      <div className="p-6">
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No BOQ items</h3>
          <p className="text-gray-500">Create a project and import BOQ items to get started.</p>
        </div>
      </div>
    </div>
  );
};

export default BOQManagement;
