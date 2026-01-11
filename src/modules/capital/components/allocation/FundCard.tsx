// ============================================================================
// FUND CARD COMPONENT
// DawinOS v2.0 - Capital Hub Module
// Display fund summary with key metrics
// ============================================================================

import React from 'react';
import {
  Users,
  DollarSign,
  MoreVertical,
  ArrowRight,
  Target,
} from 'lucide-react';
import { AllocationFund } from '../../types/allocation.types';
import {
  FUND_TYPE_LABELS,
  FUND_TYPE_COLORS,
  ALLOCATION_FUND_STATUS_LABELS,
  ALLOCATION_FUND_STATUS_COLORS,
  CURRENCY_SYMBOLS,
  FundType,
  AllocationFundStatus,
  FundCurrency,
} from '../../constants/allocation.constants';

interface FundCardProps {
  fund: AllocationFund;
  onSelect?: (fund: AllocationFund) => void;
  onManageLPs?: (fund: AllocationFund) => void;
  onCreateCall?: (fund: AllocationFund) => void;
}

export const FundCard: React.FC<FundCardProps> = ({
  fund,
  onSelect,
  onManageLPs,
  onCreateCall,
}) => {
  const metrics = fund.metrics;
  const currencySymbol = CURRENCY_SYMBOLS[fund.currency as FundCurrency] || '$';
  
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) {
      return `${currencySymbol}${(amount / 1000000000).toFixed(1)}B`;
    }
    if (amount >= 1000000) {
      return `${currencySymbol}${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${currencySymbol}${(amount / 1000).toFixed(0)}K`;
    }
    return `${currencySymbol}${amount.toFixed(0)}`;
  };
  
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;
  const formatMultiple = (value: number) => `${value.toFixed(2)}x`;
  
  const capitalProgress = metrics 
    ? (metrics.capitalCalled / fund.targetSize) * 100 
    : 0;
  
  const commitmentProgress = metrics 
    ? (metrics.totalCommitments / fund.targetSize) * 100 
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: FUND_TYPE_COLORS[fund.fundType as FundType] }}
              />
              <span className="text-xs font-medium text-gray-500">
                {FUND_TYPE_LABELS[fund.fundType as FundType]}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900">{fund.name}</h3>
            <p className="text-sm text-gray-500">{fund.shortName}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-1 text-xs font-medium rounded-full"
              style={{
                backgroundColor: `${ALLOCATION_FUND_STATUS_COLORS[fund.status as AllocationFundStatus]}20`,
                color: ALLOCATION_FUND_STATUS_COLORS[fund.status as AllocationFundStatus],
              }}
            >
              {ALLOCATION_FUND_STATUS_LABELS[fund.status as AllocationFundStatus]}
            </span>
            <button className="p-1 hover:bg-gray-100 rounded">
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Fund Size & Progress */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">Target Size</span>
          <span className="font-semibold">{formatCurrency(fund.targetSize)}</span>
        </div>
        
        {/* Commitment Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">Commitments</span>
            <span className="font-medium">
              {metrics ? formatCurrency(metrics.totalCommitments) : '-'}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${Math.min(commitmentProgress, 100)}%` }}
            />
          </div>
        </div>
        
        {/* Called Progress */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">Capital Called</span>
            <span className="font-medium">
              {metrics ? formatCurrency(metrics.capitalCalled) : '-'}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${Math.min(capitalProgress, 100)}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="p-4 grid grid-cols-4 gap-3">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">
            {metrics ? formatMultiple(metrics.tvpi) : '-'}
          </div>
          <div className="text-xs text-gray-500">TVPI</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">
            {metrics ? formatPercent(metrics.irr) : '-'}
          </div>
          <div className="text-xs text-gray-500">IRR</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">
            {metrics ? formatMultiple(metrics.dpi) : '-'}
          </div>
          <div className="text-xs text-gray-500">DPI</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">
            {metrics ? metrics.activeInvestments : '-'}
          </div>
          <div className="text-xs text-gray-500">Investments</div>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="px-4 pb-4 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">{metrics?.lpCount || 0} LPs</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Target className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">
            {fund.strategy.targetInvestmentCount} target
          </span>
        </div>
      </div>
      
      {/* Actions */}
      <div className="p-4 border-t border-gray-100 flex gap-2">
        <button
          onClick={() => onSelect?.(fund)}
          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
        >
          View Details
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onManageLPs?.(fund)}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Users className="w-4 h-4" />
        </button>
        <button
          onClick={() => onCreateCall?.(fund)}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <DollarSign className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default FundCard;
