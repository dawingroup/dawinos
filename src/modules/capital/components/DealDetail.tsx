// ============================================================================
// DEAL DETAIL
// DawinOS v2.0 - Capital Hub Module
// Detailed deal view with activities and commitments
// ============================================================================

import React, { useState } from 'react';
import {
  Building2,
  DollarSign,
  MapPin,
  TrendingUp,
  Users,
  FileText,
  MessageSquare,
  Edit,
  ArrowLeft,
  Clock,
  CheckCircle,
  Phone,
  Mail,
  File,
  ChevronRight,
} from 'lucide-react';
import { Deal, DealActivity, InvestorCommitment } from '../types/capital.types';
import { CommitmentTracker } from './CommitmentTracker';
import {
  DEAL_STAGE_LABELS,
  DEAL_STAGE_COLORS,
  INVESTMENT_TYPE_LABELS,
  SECTOR_LABELS,
  ACTIVITY_TYPE_LABELS,
  ActivityType,
} from '../constants/capital.constants';

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

interface DealDetailProps {
  deal: Deal;
  activities?: DealActivity[];
  commitments?: InvestorCommitment[];
  onEdit?: () => void;
  onBack?: () => void;
  onStageChange?: () => void;
  onAddActivity?: () => void;
  onAddCommitment?: () => void;
  onViewInvestor?: (investorId: string) => void;
}

type TabValue = 'overview' | 'commitments' | 'activities' | 'documents';

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
  if (!date) return 'N/A';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatDateTime = (timestamp: { toDate?: () => Date } | Date): string => {
  const date = timestamp && typeof (timestamp as { toDate?: () => Date }).toDate === 'function'
    ? (timestamp as { toDate: () => Date }).toDate()
    : timestamp instanceof Date ? timestamp : new Date();
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case 'call': return <Phone className="w-4 h-4" />;
    case 'meeting': return <Users className="w-4 h-4" />;
    case 'email': return <Mail className="w-4 h-4" />;
    case 'document': return <File className="w-4 h-4" />;
    case 'stage_change': return <TrendingUp className="w-4 h-4" />;
    case 'note': return <MessageSquare className="w-4 h-4" />;
    case 'task': return <CheckCircle className="w-4 h-4" />;
    default: return <Clock className="w-4 h-4" />;
  }
};

// ----------------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------------

export const DealDetail: React.FC<DealDetailProps> = ({
  deal,
  activities = [],
  commitments = [],
  onEdit,
  onBack,
  onStageChange,
  onAddActivity,
  onAddCommitment,
  onViewInvestor,
}) => {
  const [activeTab, setActiveTab] = useState<TabValue>('overview');

  const progressPercent = (deal.amountCommitted / deal.targetAmount) * 100;
  const raisedPercent = (deal.amountRaised / deal.targetAmount) * 100;
  const isOverdue = deal.expectedCloseDate && new Date(deal.expectedCloseDate) < new Date();
  const isClosed = ['closed_won', 'closed_lost'].includes(deal.stage);

  const tabs: Array<{ id: TabValue; label: string; icon: React.ReactNode; count?: number }> = [
    { id: 'overview', label: 'Overview', icon: <FileText className="w-4 h-4" /> },
    { id: 'commitments', label: 'Commitments', icon: <DollarSign className="w-4 h-4" />, count: commitments.length },
    { id: 'activities', label: 'Activities', icon: <MessageSquare className="w-4 h-4" />, count: activities.length },
    { id: 'documents', label: 'Documents', icon: <File className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{deal.name}</h1>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${DEAL_STAGE_COLORS[deal.stage]}`}>
                  {DEAL_STAGE_LABELS[deal.stage]}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {deal.targetEntityName}
                </span>
                {deal.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {deal.location}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isClosed && onStageChange && (
              <button
                onClick={onStageChange}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                <TrendingUp className="w-4 h-4" />
                Update Stage
              </button>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Target Amount</p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(deal.targetAmount, deal.currency)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Committed</p>
            <p className="text-xl font-bold text-indigo-600">
              {formatCurrency(deal.amountCommitted, deal.currency)}
            </p>
            <p className="text-xs text-gray-500">{progressPercent.toFixed(0)}% of target</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Raised</p>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(deal.amountRaised, deal.currency)}
            </p>
            <p className="text-xs text-gray-500">{raisedPercent.toFixed(0)}% funded</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Probability</p>
            <p className="text-xl font-bold text-gray-900">{deal.probability}%</p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div
                className="bg-indigo-600 h-1.5 rounded-full"
                style={{ width: `${deal.probability}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Investment Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Investment Details</h2>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Investment Type</p>
                  <p className="font-medium text-gray-900">{INVESTMENT_TYPE_LABELS[deal.investmentType]}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Sector</p>
                  <p className="font-medium text-gray-900">{SECTOR_LABELS[deal.sector] || deal.sector}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Minimum Ticket</p>
                  <p className="font-medium text-gray-900">{formatCurrency(deal.minimumTicket, deal.currency)}</p>
                </div>
                {deal.maximumTicket && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Maximum Ticket</p>
                    <p className="font-medium text-gray-900">{formatCurrency(deal.maximumTicket, deal.currency)}</p>
                  </div>
                )}
                {deal.preMoneyValuation && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Pre-Money Valuation</p>
                    <p className="font-medium text-gray-900">{formatCurrency(deal.preMoneyValuation, deal.currency)}</p>
                  </div>
                )}
                {deal.equityOffered && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Equity Offered</p>
                    <p className="font-medium text-gray-900">{deal.equityOffered}%</p>
                  </div>
                )}
                {deal.interestRate && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Interest Rate</p>
                    <p className="font-medium text-gray-900">{deal.interestRate}%</p>
                  </div>
                )}
                {deal.tenor && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Tenor</p>
                    <p className="font-medium text-gray-900">{deal.tenor} months</p>
                  </div>
                )}
              </div>

              {deal.description && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-sm text-gray-500 mb-2">Description</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{deal.description}</p>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                {onAddActivity && (
                  <button
                    onClick={onAddActivity}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    + Add Activity
                  </button>
                )}
              </div>
              
              {activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className={`p-2 rounded-full bg-gray-100 text-gray-600 h-fit`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{activity.title}</p>
                        {activity.description && (
                          <p className="text-sm text-gray-500 truncate">{activity.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {activity.performedByName} • {formatDateTime(activity.performedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {activities.length > 5 && (
                    <button
                      onClick={() => setActiveTab('activities')}
                      className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      View all {activities.length} activities
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p>No activities logged yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Deal Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Deal Info</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Lead Advisor</p>
                  <p className="text-sm font-medium text-gray-900">{deal.leadAdvisorName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Deal Start</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(deal.dealStartDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Expected Close</p>
                  <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatDate(deal.expectedCloseDate)}
                  </p>
                </div>
                {deal.closedDate && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Closed Date</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(deal.closedDate)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Investors */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Investors</h3>
                {onAddCommitment && (
                  <button
                    onClick={onAddCommitment}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    + Add
                  </button>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Interested</span>
                  <span className="font-medium text-gray-900">{deal.interestedInvestors.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Committed</span>
                  <span className="font-medium text-indigo-600">{deal.committedInvestors.length}</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            {deal.tags && deal.tags.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {deal.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Commitments Tab */}
      {activeTab === 'commitments' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Investor Commitments</h2>
            {onAddCommitment && (
              <button
                onClick={onAddCommitment}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                + Add Commitment
              </button>
            )}
          </div>
          
          <CommitmentTracker
            commitments={commitments}
            targetAmount={deal.targetAmount}
            currency={deal.currency}
            onCommitmentClick={(c) => onViewInvestor?.(c.investorId)}
          />
        </div>
      )}

      {/* Activities Tab */}
      {activeTab === 'activities' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Activity Timeline</h2>
            {onAddActivity && (
              <button
                onClick={onAddActivity}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                + Log Activity
              </button>
            )}
          </div>
          
          {activities.length > 0 ? (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-6">
                {activities.map((activity) => (
                  <div key={activity.id} className="relative flex gap-4 ml-4">
                    <div className={`absolute -left-4 p-2 rounded-full bg-white border-2 border-gray-200 text-gray-600`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 ml-6 bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-xs font-medium text-indigo-600 uppercase">
                            {ACTIVITY_TYPE_LABELS[activity.type]}
                          </span>
                          <h4 className="font-medium text-gray-900">{activity.title}</h4>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(activity.performedAt)}
                        </span>
                      </div>
                      {activity.description && (
                        <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                      )}
                      {activity.outcome && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Outcome:</span> {activity.outcome}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        by {activity.performedByName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No activities logged yet</p>
              {onAddActivity && (
                <button
                  onClick={onAddActivity}
                  className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Log your first activity
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Documents</h2>
          
          <div className="text-center py-12 text-gray-500">
            <File className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Document management coming soon</p>
          </div>
        </div>
      )}
    </div>
  );
};
