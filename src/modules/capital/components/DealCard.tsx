// ============================================================================
// DEAL CARD
// DawinOS v2.0 - Capital Hub Module
// Deal summary card component
// ============================================================================

import React from 'react';
import {
  TrendingUp,
  Calendar,
  User,
  MapPin,
  DollarSign,
} from 'lucide-react';
import { Deal } from '../types/capital.types';
import {
  DEAL_STAGE_LABELS,
  DEAL_STAGE_COLORS,
  INVESTMENT_TYPE_LABELS,
  SECTOR_LABELS,
} from '../constants/capital.constants';

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

interface DealCardProps {
  deal: Deal;
  onView?: () => void;
  onStageChange?: () => void;
  showActions?: boolean;
}

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------

const formatCurrency = (amount: number, currency: string): string => {
  if (currency === 'UGX') {
    return `UGX ${(amount / 1000000).toFixed(1)}M`;
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
  return date instanceof Date ? date.toLocaleDateString() : new Date(date).toLocaleDateString();
};

// ----------------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------------

export const DealCard: React.FC<DealCardProps> = ({
  deal,
  onView,
  onStageChange,
  showActions = true,
}) => {
  const progressPercent = (deal.amountCommitted / deal.targetAmount) * 100;
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{deal.name}</h3>
            <p className="text-sm text-gray-500 truncate">{deal.targetEntityName}</p>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ml-2 ${DEAL_STAGE_COLORS[deal.stage]}`}>
            {DEAL_STAGE_LABELS[deal.stage]}
          </span>
        </div>
        
        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="font-medium">{formatCurrency(deal.targetAmount, deal.currency)}</span>
            <span className="text-gray-400">•</span>
            <span>{INVESTMENT_TYPE_LABELS[deal.investmentType]}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <span>{SECTOR_LABELS[deal.sector] || deal.sector}</span>
          </div>
          
          {deal.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{deal.location}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4 text-gray-400" />
            <span>{deal.leadAdvisorName}</span>
          </div>
        </div>
        
        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Committed</span>
            <span>{formatCurrency(deal.amountCommitted, deal.currency)} / {formatCurrency(deal.targetAmount, deal.currency)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        </div>
        
        {/* Probability & Date */}
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="font-medium text-indigo-600">{deal.probability}%</span>
            probability
          </span>
          {deal.expectedCloseDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(deal.expectedCloseDate)}
            </span>
          )}
        </div>
      </div>
      
      {/* Actions */}
      {showActions && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex gap-2">
          <button
            onClick={onView}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            View Details
          </button>
          {onStageChange && !['closed_won', 'closed_lost'].includes(deal.stage) && (
            <button
              onClick={onStageChange}
              className="ml-auto text-sm text-gray-600 hover:text-gray-800 font-medium"
            >
              Update Stage
            </button>
          )}
        </div>
      )}
    </div>
  );
};
