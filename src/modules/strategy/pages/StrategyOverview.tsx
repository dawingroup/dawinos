// ============================================================================
// StrategyOverview PAGE
// DawinOS v2.0 - CEO Strategy Command Module
// Strategic plans overview and management
// ============================================================================

import React from 'react';
import { FileText, Construction } from 'lucide-react';

export const StrategyOverview: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Strategic Plans
          </h1>
          <p className="text-gray-600">
            View and manage your organization's strategic plans, pillars, and objectives.
          </p>
        </div>

        {/* Coming Soon Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="bg-gray-100 rounded-full p-6 mb-4">
              <Construction className="w-16 h-16 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Coming Soon
            </h2>
            <p className="text-gray-600 max-w-md">
              The strategic plans management interface is under development.
              Check back soon for full strategy document management capabilities.
            </p>
          </div>
        </div>

        {/* Info Alert */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FileText className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Strategic Plans Features
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  This page will include strategic plan creation, pillar management,
                  objective tracking, and initiative monitoring.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyOverview;
