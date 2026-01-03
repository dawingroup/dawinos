/**
 * BOQ Import Page
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Upload } from 'lucide-react';

const BOQImport: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  
  return (
    <div>
      <PageHeader
        title="Import BOQ"
        description="Upload and parse Bill of Quantities from Excel or PDF"
        breadcrumbs={[
          { label: 'MatFlow', href: '/advisory/matflow' },
          { label: 'Projects', href: '/advisory/matflow/projects' },
          { label: 'Project', href: `/advisory/matflow/projects/${projectId}` },
          { label: 'Import BOQ' },
        ]}
      />
      
      <div className="p-6">
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Upload className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Upload BOQ File</h3>
          <p className="text-gray-500 mb-4">Drag and drop or click to upload an Excel or PDF file.</p>
          <p className="text-sm text-gray-400">Supported formats: .xlsx, .xls, .pdf, .csv</p>
        </div>
      </div>
    </div>
  );
};

export default BOQImport;
