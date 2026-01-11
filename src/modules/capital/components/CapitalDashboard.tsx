// ============================================================================
// CAPITAL DASHBOARD
// DawinOS v2.0 - Capital Hub Module
// Main capital management dashboard
// ============================================================================

import React, { useState } from 'react';
import {
  Plus,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  BarChart3,
  Briefcase,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { DealCard } from './DealCard';
import { DealPipelineBoard } from './DealPipelineBoard';
import { InvestorList } from './InvestorList';
import { PipelineChart } from './PipelineChart';
import { Deal, Investor, PipelineSummary } from '../types/capital.types';
import {
  DEAL_STAGE_LABELS,
  ACTIVE_DEAL_STAGES,
} from '../constants/capital.constants';

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

interface CapitalDashboardProps {
  deals: Deal[];
  investors: Investor[];
  pipelineSummary: PipelineSummary | null;
  isLoading: boolean;
  error: string | null;
  onDealClick?: (deal: Deal) => void;
  onInvestorClick?: (investor: Investor) => void;
  onAddDeal?: () => void;
  onAddInvestor?: () => void;
}

type TabValue = 'overview' | 'pipeline' | 'investors' | 'analytics';

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------

const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  if (amount >= 1000000000) {
    return `${currency} ${(amount / 1000000000).toFixed(1)}B`;
  }
  if (amount >= 1000000) {
    return `${currency} ${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${currency} ${(amount / 1000).toFixed(0)}K`;
  }
  return `${currency} ${amount}`;
};

// ----------------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------------

export const CapitalDashboard: React.FC<CapitalDashboardProps> = ({
  deals,
  investors,
  pipelineSummary,
  isLoading,
  error,
  onDealClick,
  onInvestorClick,
  onAddDeal,
  onAddInvestor,
}) => {
  const [activeTab, setActiveTab] = useState<TabValue>('overview');

  const tabs: Array<{ id: TabValue; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'pipeline', label: 'Pipeline', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'investors', label: 'Investors', icon: <Users className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <Target className="w-4 h-4" /> },
  ];

  const activeDeals = deals.filter(d => d.isActive);
  const recentDeals = [...deals].sort((a, b) => 
    new Date(b.updatedAt?.toDate?.() || b.updatedAt).getTime() - 
    new Date(a.updatedAt?.toDate?.() || a.updatedAt).getTime()
  ).slice(0, 6);
  
  const activeInvestors = investors.filter(i => 
    ['interested', 'in_discussion', 'committed', 'invested'].includes(i.status)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Capital Hub</h1>
        <div className="flex gap-2">
          <button
            onClick={onAddDeal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            New Deal
          </button>
          <button
            onClick={onAddInvestor}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium text-sm"
          >
            <Users className="w-4 h-4" />
            Add Investor
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Stats */}
      {pipelineSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Briefcase className="w-4 h-4" />
              <span className="text-sm">Active Deals</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{pipelineSummary.totalDeals}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Pipeline Value</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(pipelineSummary.totalPipelineValue)}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Target className="w-4 h-4" />
              <span className="text-sm">Weighted Pipeline</span>
            </div>
            <p className="text-3xl font-bold text-indigo-600">
              {formatCurrency(pipelineSummary.weightedPipelineValue)}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-sm">Active Investors</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{activeInvestors.length}</p>
          </div>
        </div>
      )}

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
            </button>
          ))}
        </nav>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && !isLoading && (
        <div className="space-y-6">
          {/* Recent Deals */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Deals</h2>
              <button
                onClick={() => setActiveTab('pipeline')}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                View All →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentDeals.map(deal => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  onView={() => onDealClick?.(deal)}
                />
              ))}
              {recentDeals.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <Briefcase className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No deals yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Pipeline Summary by Stage */}
          {pipelineSummary && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pipeline by Stage</h2>
              <div className="space-y-3">
                {ACTIVE_DEAL_STAGES.map(stage => {
                  const stageData = pipelineSummary.byStage[stage];
                  const maxValue = Math.max(...ACTIVE_DEAL_STAGES.map(s => pipelineSummary.byStage[s]?.value || 0));
                  const widthPercent = maxValue > 0 ? (stageData?.value || 0) / maxValue * 100 : 0;
                  
                  return (
                    <div key={stage} className="flex items-center gap-4">
                      <span className="w-28 text-sm text-gray-600">{DEAL_STAGE_LABELS[stage]}</span>
                      <div className="flex-1">
                        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                      </div>
                      <span className="w-16 text-sm text-gray-700 text-right">
                        {stageData?.count || 0} deals
                      </span>
                      <span className="w-24 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(stageData?.value || 0)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pipeline Tab */}
      {activeTab === 'pipeline' && !isLoading && (
        <DealPipelineBoard
          deals={activeDeals}
          onDealMove={async (dealId, newStage) => {
            console.log('Move deal', dealId, 'to', newStage);
          }}
          onDealClick={(deal) => onDealClick?.(deal)}
          onDealEdit={(deal) => console.log('Edit deal', deal.id)}
          onAddDeal={onAddDeal ? () => onAddDeal() : undefined}
        />
      )}

      {/* Investors Tab */}
      {activeTab === 'investors' && !isLoading && (
        <InvestorList
          investors={investors}
          onView={(investor) => onInvestorClick?.(investor)}
          onEdit={(investor) => console.log('Edit investor', investor.id)}
          onAdd={onAddInvestor || (() => {})}
        />
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && !isLoading && pipelineSummary && (
        <PipelineChart summary={pipelineSummary} currency="UGX" />
      )}
    </div>
  );
};
