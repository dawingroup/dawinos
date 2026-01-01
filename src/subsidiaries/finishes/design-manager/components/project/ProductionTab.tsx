/**
 * ProductionTab Component
 * Production optimization and Katana export for Stage 4+
 */

import React from 'react';
import { 
  Scissors, 
  Lock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { NestingStudio, KatanaExportSection, ShopTravelerSection } from '../production';
import { OptimizationStatusBadge } from '@/shared/components/OptimizationStatusBadge';
import type { Project } from '@/shared/types';
import type { DesignProject, DesignStage } from '../../types';
import type { OptimizationStatus } from '@/shared/services/optimization/changeDetection';

// ============================================
// Types
// ============================================

interface ProductionTabProps {
  project: DesignProject;
  stage?: DesignStage;
  onRefresh?: () => void;
}

// Stages that allow production
const PRODUCTION_STAGES: DesignStage[] = ['pre-production', 'production-ready'];

// ============================================
// Sub-Components
// ============================================

interface StageGateMessageProps {
  currentStage: DesignStage;
  requiredStages: DesignStage[];
}

const StageGateMessage: React.FC<StageGateMessageProps> = ({ currentStage, requiredStages }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Production Not Available
      </h3>
      <p className="text-gray-500 max-w-md">
        Production optimization is available when the project reaches{' '}
        <span className="font-medium">{requiredStages.join(' or ')}</span> stage.
      </p>
      <p className="text-sm text-gray-400 mt-2">
        Current stage: <span className="font-medium">{currentStage}</span>
      </p>
    </div>
  );
};

// ============================================
// Main Component
// ============================================

export function ProductionTab({ project, stage, onRefresh }: ProductionTabProps) {
  const { user } = useAuth();
  
  // Check if stage allows production (default to allowing if no stage provided)
  const currentStage = stage || 'pre-production';
  const canAccessProduction = PRODUCTION_STAGES.includes(currentStage);
  
  if (!canAccessProduction) {
    return <StageGateMessage currentStage={currentStage} requiredStages={PRODUCTION_STAGES} />;
  }

  const projectData = project as unknown as Project;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Scissors className="w-6 h-6 text-purple-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Production Optimization</h2>
            <p className="text-sm text-gray-500">
              Generate optimized cutting layouts and export to manufacturing
            </p>
          </div>
        </div>
        
        {/* Optimization Status Badge */}
        <OptimizationStatusBadge 
          status={(project as unknown as { optimizationStatus?: OptimizationStatus }).optimizationStatus || null}
          onReOptimize={onRefresh ? async () => onRefresh() : undefined}
          size="md"
          showLabel={true}
          showReasons={true}
        />
      </div>

      {/* Nesting Studio */}
      {user?.email && (
        <NestingStudio
          projectId={project.id}
          project={projectData}
          mode="PRODUCTION"
          userId={user.email}
          onRefresh={onRefresh}
        />
      )}

      {/* Shop Traveler */}
      <ShopTravelerSection project={projectData} />

      {/* Katana Export */}
      <KatanaExportSection project={projectData} onExportComplete={onRefresh} />
    </div>
  );
}

export default ProductionTab;
