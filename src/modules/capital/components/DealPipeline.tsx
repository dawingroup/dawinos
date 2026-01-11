// ============================================================================
// DEAL PIPELINE
// DawinOS v2.0 - Capital Hub Module
// Kanban-style pipeline view
// ============================================================================

import React from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import { Deal } from '../types/capital.types';
import { DealCard } from './DealCard';
import {
  DEAL_STAGE_LABELS,
  DEAL_STAGE_COLORS,
  ACTIVE_DEAL_STAGES,
  DealStage,
} from '../constants/capital.constants';

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

interface DealPipelineProps {
  deals: Deal[];
  onDealClick?: (deal: Deal) => void;
  onDealStageChange?: (deal: Deal) => void;
  onAddDeal?: (stage: DealStage) => void;
  compactView?: boolean;
}

interface PipelineColumnProps {
  stage: DealStage;
  deals: Deal[];
  onDealClick?: (deal: Deal) => void;
  onDealStageChange?: (deal: Deal) => void;
  onAddDeal?: () => void;
  compact?: boolean;
}

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------

const formatCurrency = (amount: number): string => {
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(1)}B`;
  }
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount}`;
};

// ----------------------------------------------------------------------------
// PIPELINE COLUMN
// ----------------------------------------------------------------------------

const PipelineColumn: React.FC<PipelineColumnProps> = ({
  stage,
  deals,
  onDealClick,
  onDealStageChange,
  onAddDeal,
  compact = false,
}) => {
  const totalValue = deals.reduce((sum, d) => sum + d.targetAmount, 0);
  const weightedValue = deals.reduce((sum, d) => sum + d.targetAmount * (d.probability / 100), 0);
  
  return (
    <div className="flex-shrink-0 w-72 bg-gray-50 rounded-lg">
      {/* Column Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-1">
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${DEAL_STAGE_COLORS[stage]}`}>
            {DEAL_STAGE_LABELS[stage]}
          </span>
          <span className="text-sm font-semibold text-gray-700">{deals.length}</span>
        </div>
        <div className="text-xs text-gray-500">
          <span className="font-medium">{formatCurrency(totalValue)}</span>
          <span className="mx-1">•</span>
          <span className="text-indigo-600">{formatCurrency(weightedValue)} weighted</span>
        </div>
      </div>
      
      {/* Deals */}
      <div className="p-2 space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
        {deals.map(deal => (
          <div key={deal.id} className={compact ? 'cursor-pointer' : ''}>
            {compact ? (
              <div 
                onClick={() => onDealClick?.(deal)}
                className="bg-white rounded-md border border-gray-200 p-3 hover:border-indigo-300 hover:shadow-sm transition-all"
              >
                <h4 className="font-medium text-sm text-gray-900 truncate">{deal.name}</h4>
                <p className="text-xs text-gray-500 truncate">{deal.targetEntityName}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs font-medium text-indigo-600">
                    {formatCurrency(deal.targetAmount)}
                  </span>
                  <span className="text-xs text-gray-400">{deal.probability}%</span>
                </div>
              </div>
            ) : (
              <DealCard
                deal={deal}
                onView={() => onDealClick?.(deal)}
                onStageChange={() => onDealStageChange?.(deal)}
                showActions={true}
              />
            )}
          </div>
        ))}
        
        {deals.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No deals</p>
          </div>
        )}
      </div>
      
      {/* Add Deal */}
      {onAddDeal && (
        <div className="p-2 border-t border-gray-200">
          <button
            onClick={onAddDeal}
            className="w-full flex items-center justify-center gap-1 py-2 text-sm text-gray-500 hover:text-indigo-600 hover:bg-white rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Deal
          </button>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------------
// PIPELINE VIEW
// ----------------------------------------------------------------------------

export const DealPipeline: React.FC<DealPipelineProps> = ({
  deals,
  onDealClick,
  onDealStageChange,
  onAddDeal,
  compactView = false,
}) => {
  // Group deals by stage
  const dealsByStage = ACTIVE_DEAL_STAGES.reduce((acc, stage) => {
    acc[stage] = deals.filter(d => d.stage === stage);
    return acc;
  }, {} as Record<DealStage, Deal[]>);
  
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {ACTIVE_DEAL_STAGES.map((stage, index) => (
        <React.Fragment key={stage}>
          <PipelineColumn
            stage={stage}
            deals={dealsByStage[stage] || []}
            onDealClick={onDealClick}
            onDealStageChange={onDealStageChange}
            onAddDeal={onAddDeal ? () => onAddDeal(stage) : undefined}
            compact={compactView}
          />
          {index < ACTIVE_DEAL_STAGES.length - 1 && (
            <div className="flex items-center text-gray-300">
              <ChevronRight className="w-5 h-5" />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
