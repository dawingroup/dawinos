// ============================================================================
// COMMITMENT TRACKER
// DawinOS v2.0 - Capital Hub Module
// Commitment progress tracking component
// ============================================================================

import React from 'react';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  User,
  Calendar,
} from 'lucide-react';
import { InvestorCommitment } from '../types/capital.types';
import {
  COMMITMENT_STATUS_LABELS,
  COMMITMENT_STATUS_COLORS,
  INVESTMENT_TYPE_LABELS,
  CommitmentStatus,
} from '../constants/capital.constants';

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

interface CommitmentTrackerProps {
  commitments: InvestorCommitment[];
  targetAmount: number;
  currency: string;
  onCommitmentClick?: (commitment: InvestorCommitment) => void;
  onUpdateStatus?: (commitment: InvestorCommitment) => void;
}

interface CommitmentItemProps {
  commitment: InvestorCommitment;
  onClick?: () => void;
  onUpdateStatus?: () => void;
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

const getStatusIcon = (status: CommitmentStatus) => {
  switch (status) {
    case 'funded':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'documented':
    case 'firm':
      return <Clock className="w-4 h-4 text-amber-500" />;
    case 'cancelled':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    default:
      return <Clock className="w-4 h-4 text-gray-400" />;
  }
};

// ----------------------------------------------------------------------------
// COMMITMENT ITEM
// ----------------------------------------------------------------------------

const CommitmentItem: React.FC<CommitmentItemProps> = ({
  commitment,
  onClick,
  onUpdateStatus,
}) => {
  const fundingProgress = commitment.fundedAmount / commitment.committedAmount * 100;
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-indigo-300 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon(commitment.status)}
          <div>
            <h4 
              className="font-medium text-gray-900 cursor-pointer hover:text-indigo-600"
              onClick={onClick}
            >
              {commitment.investorName}
            </h4>
            <p className="text-xs text-gray-500">{INVESTMENT_TYPE_LABELS[commitment.investmentType]}</p>
          </div>
        </div>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${COMMITMENT_STATUS_COLORS[commitment.status]}`}>
          {COMMITMENT_STATUS_LABELS[commitment.status]}
        </span>
      </div>
      
      {/* Amount */}
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="w-4 h-4 text-gray-400" />
        <span className="text-lg font-semibold text-gray-900">
          {formatCurrency(commitment.committedAmount, commitment.currency)}
        </span>
      </div>
      
      {/* Funding Progress */}
      {commitment.status !== 'cancelled' && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Funded</span>
            <span>{formatCurrency(commitment.fundedAmount, commitment.currency)} ({fundingProgress.toFixed(0)}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                fundingProgress >= 100 ? 'bg-green-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${Math.min(fundingProgress, 100)}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Details */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(commitment.commitmentDate).toLocaleDateString()}
        </span>
        {commitment.equityPercentage && (
          <span>{commitment.equityPercentage}% equity</span>
        )}
        {commitment.interestRate && (
          <span>{commitment.interestRate}% interest</span>
        )}
      </div>
      
      {/* Actions */}
      {onUpdateStatus && commitment.status !== 'funded' && commitment.status !== 'cancelled' && (
        <button
          onClick={onUpdateStatus}
          className="mt-3 w-full py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
        >
          Update Status
        </button>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------------
// COMMITMENT TRACKER
// ----------------------------------------------------------------------------

export const CommitmentTracker: React.FC<CommitmentTrackerProps> = ({
  commitments,
  targetAmount,
  currency,
  onCommitmentClick,
  onUpdateStatus,
}) => {
  const totalCommitted = commitments.reduce((sum, c) => 
    c.status !== 'cancelled' ? sum + c.committedAmount : sum, 0
  );
  const totalFunded = commitments.reduce((sum, c) => sum + c.fundedAmount, 0);
  
  const committedPercent = (totalCommitted / targetAmount) * 100;
  const fundedPercent = (totalFunded / targetAmount) * 100;
  
  // Group by status
  const byStatus = commitments.reduce((acc, c) => {
    if (!acc[c.status]) acc[c.status] = [];
    acc[c.status].push(c);
    return acc;
  }, {} as Record<CommitmentStatus, InvestorCommitment[]>);
  
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Funding Progress</h3>
        
        {/* Target */}
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Target</span>
          <span className="font-medium text-gray-900">{formatCurrency(targetAmount, currency)}</span>
        </div>
        
        {/* Progress Bar */}
        <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden mb-4">
          {/* Funded */}
          <div 
            className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-300"
            style={{ width: `${Math.min(fundedPercent, 100)}%` }}
          />
          {/* Committed but not funded */}
          <div 
            className="absolute top-0 h-full bg-indigo-300 transition-all duration-300"
            style={{ 
              left: `${Math.min(fundedPercent, 100)}%`,
              width: `${Math.min(committedPercent - fundedPercent, 100 - fundedPercent)}%` 
            }}
          />
          {/* Labels */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-white drop-shadow">
              {committedPercent.toFixed(0)}% committed
            </span>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span className="text-gray-600">Funded: {formatCurrency(totalFunded, currency)}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-indigo-300 rounded" />
            <span className="text-gray-600">Committed: {formatCurrency(totalCommitted, currency)}</span>
          </div>
        </div>
      </div>
      
      {/* Commitments List */}
      <div className="space-y-4">
        {/* Funded */}
        {byStatus.funded?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Funded ({byStatus.funded.length})
            </h4>
            <div className="space-y-2">
              {byStatus.funded.map(c => (
                <CommitmentItem
                  key={c.id}
                  commitment={c}
                  onClick={() => onCommitmentClick?.(c)}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* In Progress */}
        {(byStatus.documented?.length > 0 || byStatus.firm?.length > 0 || byStatus.soft?.length > 0) && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              In Progress ({(byStatus.documented?.length || 0) + (byStatus.firm?.length || 0) + (byStatus.soft?.length || 0)})
            </h4>
            <div className="space-y-2">
              {[...(byStatus.documented || []), ...(byStatus.firm || []), ...(byStatus.soft || [])].map(c => (
                <CommitmentItem
                  key={c.id}
                  commitment={c}
                  onClick={() => onCommitmentClick?.(c)}
                  onUpdateStatus={() => onUpdateStatus?.(c)}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Cancelled */}
        {byStatus.cancelled?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              Cancelled ({byStatus.cancelled.length})
            </h4>
            <div className="space-y-2">
              {byStatus.cancelled.map(c => (
                <CommitmentItem
                  key={c.id}
                  commitment={c}
                  onClick={() => onCommitmentClick?.(c)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      
      {commitments.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No commitments yet</p>
        </div>
      )}
    </div>
  );
};
