// ============================================================================
// ALLOCATION DASHBOARD COMPONENT
// DawinOS v2.0 - Capital Hub Module
// Main dashboard for fund allocation management
// ============================================================================

import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  Briefcase,
  PieChart,
  FileText,
  Plus,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { AllocationFund, FundMetrics, LPCommitment, CapitalCall, Distribution, PortfolioInvestment } from '../../types/allocation.types';
import { FundCard } from './FundCard';
import {
  CURRENCY_SYMBOLS,
  FundCurrency,
} from '../../constants/allocation.constants';

interface AllocationDashboardProps {
  funds: AllocationFund[];
  selectedFund: AllocationFund | null;
  fundMetrics: FundMetrics | null;
  lpCommitments: LPCommitment[];
  capitalCalls: CapitalCall[];
  distributions: Distribution[];
  portfolioInvestments: PortfolioInvestment[];
  isLoading: boolean;
  error: string | null;
  onSelectFund: (fund: AllocationFund) => void;
  onCreateFund: () => void;
  onRefreshMetrics: () => void;
  onManageLPs: (fund: AllocationFund) => void;
  onCreateCapitalCall: (fund: AllocationFund) => void;
}

export const AllocationDashboard: React.FC<AllocationDashboardProps> = ({
  funds,
  selectedFund,
  fundMetrics: _fundMetrics,
  lpCommitments: _lpCommitments,
  capitalCalls,
  distributions,
  portfolioInvestments,
  isLoading,
  error,
  onSelectFund,
  onCreateFund,
  onRefreshMetrics,
  onManageLPs,
  onCreateCapitalCall,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'funds' | 'portfolio' | 'calls' | 'reports'>('overview');

  const formatCurrency = (amount: number, currency: FundCurrency = 'USD') => {
    const symbol = CURRENCY_SYMBOLS[currency] || '$';
    if (amount >= 1000000000) {
      return `${symbol}${(amount / 1000000000).toFixed(1)}B`;
    }
    if (amount >= 1000000) {
      return `${symbol}${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${symbol}${(amount / 1000).toFixed(0)}K`;
    }
    return `${symbol}${amount.toFixed(0)}`;
  };

  // Aggregate metrics across all funds
  const aggregateMetrics = React.useMemo(() => {
    return funds.reduce((acc, fund) => {
      const metrics = fund.metrics;
      if (metrics) {
        acc.totalAUM += metrics.totalValue;
        acc.totalCommitments += metrics.totalCommitments;
        acc.totalInvested += metrics.totalInvested;
        acc.totalDistributions += metrics.distributionsPaid;
        acc.lpCount += metrics.lpCount;
        acc.investmentCount += metrics.totalInvestments;
      }
      return acc;
    }, {
      totalAUM: 0,
      totalCommitments: 0,
      totalInvested: 0,
      totalDistributions: 0,
      lpCount: 0,
      investmentCount: 0,
    });
  }, [funds]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'funds', label: 'Funds', icon: Briefcase },
    { id: 'portfolio', label: 'Portfolio', icon: PieChart },
    { id: 'calls', label: 'Capital Calls', icon: DollarSign },
    { id: 'reports', label: 'LP Reports', icon: FileText },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Capital Allocation</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage fund structures, LP commitments, and portfolio investments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRefreshMetrics}
            disabled={isLoading}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={onCreateFund}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Fund
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-900">Error</h4>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">Total AUM</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {formatCurrency(aggregateMetrics.totalAUM)}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-medium">Commitments</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {formatCurrency(aggregateMetrics.totalCommitments)}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Briefcase className="w-4 h-4" />
            <span className="text-xs font-medium">Invested</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {formatCurrency(aggregateMetrics.totalInvested)}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-medium">Distributions</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {formatCurrency(aggregateMetrics.totalDistributions)}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Users className="w-4 h-4" />
            <span className="text-xs font-medium">LPs</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {aggregateMetrics.lpCount}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <PieChart className="w-4 h-4" />
            <span className="text-xs font-medium">Investments</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {aggregateMetrics.investmentCount}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Fund Cards Grid */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Funds</h2>
              {funds.length === 0 ? (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                  <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <h3 className="font-medium text-gray-900 mb-1">No funds yet</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Create your first fund to start managing capital allocations
                  </p>
                  <button
                    onClick={onCreateFund}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Create Fund
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {funds.map(fund => (
                    <FundCard
                      key={fund.id}
                      fund={fund}
                      onSelect={onSelectFund}
                      onManageLPs={onManageLPs}
                      onCreateCall={onCreateCapitalCall}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Capital Calls */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Recent Capital Calls</h3>
                  <button className="text-sm text-blue-600 hover:text-blue-700">View All</button>
                </div>
                <div className="divide-y divide-gray-100">
                  {capitalCalls.slice(0, 5).map(call => (
                    <div key={call.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Call #{call.callNumber}</p>
                        <p className="text-sm text-gray-500">{call.purpose}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {formatCurrency(call.totalCallAmount)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {call.percentFunded.toFixed(0)}% funded
                        </p>
                      </div>
                    </div>
                  ))}
                  {capitalCalls.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      No capital calls yet
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Distributions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Recent Distributions</h3>
                  <button className="text-sm text-blue-600 hover:text-blue-700">View All</button>
                </div>
                <div className="divide-y divide-gray-100">
                  {distributions.slice(0, 5).map(dist => (
                    <div key={dist.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Distribution #{dist.distributionNumber}</p>
                        <p className="text-sm text-gray-500">{dist.sourceDescription}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {formatCurrency(dist.totalDistributionAmount)}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          dist.status === 'paid' ? 'bg-green-100 text-green-700' :
                          dist.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {dist.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {distributions.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      No distributions yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'funds' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {funds.map(fund => (
              <FundCard
                key={fund.id}
                fund={fund}
                onSelect={onSelectFund}
                onManageLPs={onManageLPs}
                onCreateCall={onCreateCapitalCall}
              />
            ))}
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Portfolio Investments</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sector</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Invested</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Value</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">MOIC</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {portfolioInvestments.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{inv.companyName}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{inv.sector}</td>
                      <td className="px-4 py-3 text-right text-sm">{formatCurrency(inv.totalInvested)}</td>
                      <td className="px-4 py-3 text-right text-sm">{formatCurrency(inv.currentValuation)}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium">{inv.moic.toFixed(2)}x</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          inv.status === 'active' ? 'bg-green-100 text-green-700' :
                          inv.status === 'realized' ? 'bg-blue-100 text-blue-700' :
                          inv.status === 'impaired' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {portfolioInvestments.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No portfolio investments yet
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'calls' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Capital Calls</h3>
              <button
                onClick={() => selectedFund && onCreateCapitalCall(selectedFund)}
                disabled={!selectedFund}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                New Call
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {capitalCalls.map(call => (
                <div key={call.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">Call #{call.callNumber}</h4>
                      <p className="text-sm text-gray-500">{call.purpose}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      call.status === 'fully_funded' ? 'bg-green-100 text-green-700' :
                      call.status === 'partially_funded' ? 'bg-amber-100 text-amber-700' :
                      call.status === 'issued' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {call.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">
                      {formatCurrency(call.amountReceived)} / {formatCurrency(call.totalCallAmount)}
                    </span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${call.percentFunded}%` }}
                      />
                    </div>
                    <span className="text-gray-600">{call.percentFunded.toFixed(0)}%</span>
                  </div>
                </div>
              ))}
              {capitalCalls.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No capital calls yet
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <h3 className="font-medium text-gray-900 mb-1">LP Reports</h3>
            <p className="text-sm text-gray-500">
              Generate and distribute quarterly, annual, and custom reports to LPs
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllocationDashboard;
