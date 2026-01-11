// ============================================================================
// DEAL PIPELINE BOARD
// DawinOS v2.0 - Capital Hub Module
// Kanban-style deal pipeline with drag-and-drop
// ============================================================================

import React, { useState, useMemo, DragEvent } from 'react';
import {
  MoreVertical,
  Building2,
  DollarSign,
  Calendar,
  Plus,
  GripVertical,
} from 'lucide-react';
import { Deal } from '../types/capital.types';
import {
  DEAL_STAGE_LABELS,
  DEAL_STAGE_COLORS,
  DEAL_STAGE_PROBABILITY,
  INVESTMENT_TYPE_LABELS,
  ACTIVE_DEAL_STAGES,
  DealStage,
} from '../constants/capital.constants';

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

interface DealPipelineBoardProps {
  deals: Deal[];
  onDealMove: (dealId: string, newStage: DealStage) => Promise<void>;
  onDealClick: (deal: Deal) => void;
  onDealEdit?: (deal: Deal) => void;
  onAddDeal?: (stage: DealStage) => void;
  currency?: string;
}

interface DealCardDraggableProps {
  deal: Deal;
  onDealClick: (deal: Deal) => void;
  onDealEdit?: (deal: Deal) => void;
  onDragStart: (e: DragEvent<HTMLDivElement>, deal: Deal) => void;
}

interface PipelineColumnProps {
  stage: DealStage;
  deals: Deal[];
  totals: { count: number; value: number; weighted: number };
  currency: string;
  onDealClick: (deal: Deal) => void;
  onDealEdit?: (deal: Deal) => void;
  onDragStart: (e: DragEvent<HTMLDivElement>, deal: Deal) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: (e: DragEvent<HTMLDivElement>, stage: DealStage) => void;
  isDragOver: boolean;
  onAddDeal?: () => void;
}

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------

const formatCurrency = (amount: number, currency: string): string => {
  if (currency === 'UGX') {
    if (amount >= 1000000000) return `UGX ${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `UGX ${(amount / 1000000).toFixed(1)}M`;
    return `UGX ${(amount / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
};

const formatDate = (date: Date | undefined): string => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ----------------------------------------------------------------------------
// DEAL CARD DRAGGABLE
// ----------------------------------------------------------------------------

const DealCardDraggable: React.FC<DealCardDraggableProps> = ({
  deal,
  onDealClick,
  onDealEdit,
  onDragStart,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const progress = (deal.amountCommitted / deal.targetAmount) * 100;
  const isOverdue = deal.expectedCloseDate && new Date(deal.expectedCloseDate) < new Date();

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, deal)}
      className="bg-white rounded-lg border border-gray-200 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <div className="p-3">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
            <h4 
              className="font-medium text-sm text-gray-900 truncate cursor-pointer hover:text-indigo-600"
              onClick={() => onDealClick(deal)}
            >
              {deal.name}
            </h4>
          </div>
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)} 
                />
                <div className="absolute right-0 top-6 w-36 bg-white rounded-md shadow-lg border border-gray-200 z-20 py-1">
                  <button
                    onClick={() => { onDealClick(deal); setShowMenu(false); }}
                    className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    View Details
                  </button>
                  {onDealEdit && (
                    <button
                      onClick={() => { onDealEdit(deal); setShowMenu(false); }}
                      className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Edit Deal
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Target Entity */}
        <div className="flex items-center gap-1.5 mb-2">
          <Building2 className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-500 truncate">{deal.targetEntityName}</span>
        </div>

        {/* Amount */}
        <div className="flex items-center gap-1.5 mb-2">
          <DollarSign className="w-3.5 h-3.5 text-green-500" />
          <span className="text-sm font-semibold text-gray-900">
            {formatCurrency(deal.targetAmount, deal.currency)}
          </span>
        </div>

        {/* Progress (if has commitments) */}
        {deal.amountCommitted > 0 && (
          <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Committed</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-green-500 h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center">
          <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
            {INVESTMENT_TYPE_LABELS[deal.investmentType].split(' ')[0]}
          </span>
          <div className="flex items-center gap-1.5" title={deal.leadAdvisorName}>
            <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-xs font-medium text-indigo-600">
                {deal.leadAdvisorName.charAt(0)}
              </span>
            </div>
          </div>
        </div>

        {/* Due Date */}
        {deal.expectedCloseDate && (
          <div className="flex items-center gap-1 mt-2">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
              {formatDate(deal.expectedCloseDate)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// PIPELINE COLUMN
// ----------------------------------------------------------------------------

const PipelineColumn: React.FC<PipelineColumnProps> = ({
  stage,
  deals,
  totals,
  currency,
  onDealClick,
  onDealEdit,
  onDragStart,
  onDragOver,
  onDrop,
  isDragOver,
  onAddDeal,
}) => {
  const probability = DEAL_STAGE_PROBABILITY[stage];

  return (
    <div
      className={`flex-shrink-0 w-72 rounded-lg transition-colors ${
        isDragOver ? 'bg-indigo-50 ring-2 ring-indigo-300' : 'bg-gray-50'
      }`}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, stage)}
    >
      {/* Column Header */}
      <div className={`p-3 border-b-4 ${DEAL_STAGE_COLORS[stage].replace('text-', 'border-').replace('bg-', 'border-')}`}>
        <div className="flex justify-between items-center mb-1">
          <span className={`px-2 py-0.5 text-xs font-semibold rounded ${DEAL_STAGE_COLORS[stage]}`}>
            {DEAL_STAGE_LABELS[stage]}
          </span>
          <span className="w-6 h-6 flex items-center justify-center bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
            {totals.count}
          </span>
        </div>
        <div className="text-xs text-gray-600">
          {formatCurrency(totals.value, currency)}
        </div>
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-500 mb-0.5">
            <span>Probability</span>
            <span>{probability}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div
              className="bg-indigo-500 h-1 rounded-full"
              style={{ width: `${probability}%` }}
            />
          </div>
        </div>
      </div>

      {/* Deals */}
      <div className="p-2 space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto">
        {deals.map((deal) => (
          <DealCardDraggable
            key={deal.id}
            deal={deal}
            onDealClick={onDealClick}
            onDealEdit={onDealEdit}
            onDragStart={onDragStart}
          />
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
            className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-gray-500 hover:text-indigo-600 hover:bg-white rounded-md transition-colors"
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
// DEAL PIPELINE BOARD
// ----------------------------------------------------------------------------

export const DealPipelineBoard: React.FC<DealPipelineBoardProps> = ({
  deals,
  onDealMove,
  onDealClick,
  onDealEdit,
  onAddDeal,
  currency = 'UGX',
}) => {
  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null);
  const [draggingDeal, setDraggingDeal] = useState<Deal | null>(null);

  // Group deals by stage
  const dealsByStage = useMemo(() => {
    const grouped: Record<DealStage, Deal[]> = {} as Record<DealStage, Deal[]>;
    ACTIVE_DEAL_STAGES.forEach(stage => {
      grouped[stage] = deals.filter(d => d.stage === stage);
    });
    return grouped;
  }, [deals]);

  // Calculate stage totals
  const stageTotals = useMemo(() => {
    const totals: Record<DealStage, { count: number; value: number; weighted: number }> = {} as Record<DealStage, { count: number; value: number; weighted: number }>;
    Object.entries(dealsByStage).forEach(([stage, stageDeals]) => {
      totals[stage as DealStage] = {
        count: stageDeals.length,
        value: stageDeals.reduce((sum, d) => sum + d.targetAmount, 0),
        weighted: stageDeals.reduce((sum, d) => sum + (d.targetAmount * d.probability / 100), 0),
      };
    });
    return totals;
  }, [dealsByStage]);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, deal: Deal) => {
    setDraggingDeal(deal);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', deal.id);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>, targetStage: DealStage) => {
    e.preventDefault();
    setDragOverStage(null);

    if (draggingDeal && draggingDeal.stage !== targetStage) {
      await onDealMove(draggingDeal.id, targetStage);
    }
    setDraggingDeal(null);
  };

  const handleDragEnter = (stage: DealStage) => {
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {ACTIVE_DEAL_STAGES.map((stage) => (
        <div
          key={stage}
          onDragEnter={() => handleDragEnter(stage)}
          onDragLeave={handleDragLeave}
        >
          <PipelineColumn
            stage={stage}
            deals={dealsByStage[stage] || []}
            totals={stageTotals[stage] || { count: 0, value: 0, weighted: 0 }}
            currency={currency}
            onDealClick={onDealClick}
            onDealEdit={onDealEdit}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            isDragOver={dragOverStage === stage}
            onAddDeal={onAddDeal ? () => onAddDeal(stage) : undefined}
          />
        </div>
      ))}
    </div>
  );
};
