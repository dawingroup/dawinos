/**
 * Investment Dashboard - Portfolio overview for investment teams
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PipelineSummary,
  DealsFunnel,
  InvestmentMetrics,
  RecentActivity
} from '../components/dashboard';
import { Plus, BarChart3, Kanban, List, Loader2 } from 'lucide-react';
import { usePipelineSummary, usePipeline } from '../hooks/deal-hooks';
import { PipelineSummary as BackendPipelineSummary } from '../services/deal-service';
import { DealSummary } from '../types/deal';

type ViewMode = 'dashboard' | 'kanban' | 'list';
type DateRange = 'ytd' | 'qtd' | '1y' | 'all';

/**
 * Transform backend PipelineSummary to dashboard analytics format
 */
function transformToDashboardAnalytics(summary: BackendPipelineSummary, deals: DealSummary[]) {
  // Calculate additional metrics from deals
  const activeDeals = deals.filter(d => d.currentStage !== 'exit' && d.currentStage !== 'post_closing').length;
  const closedDeals = deals.filter(d => d.currentStage === 'exit' || d.currentStage === 'post_closing').length;

  // Conversion rate: closed / total (placeholder calculation)
  const conversionRate = summary.totalDeals > 0 ? (closedDeals / summary.totalDeals) * 100 : 0;

  // Average deal size
  const averageDealSize = summary.totalDeals > 0
    ? summary.totalValue.amount / summary.totalDeals
    : 0;

  // Transform byStage data - add weighted values and other metrics
  const byStage: Record<string, any> = {};
  Object.entries(summary.stages).forEach(([stage, data]) => {
    byStage[stage] = {
      count: data.count,
      totalValue: data.value,
      // Weighted value = total value * estimated probability (simplified)
      weightedValue: {
        amount: data.value.amount * 0.5, // Using 50% as default probability
        currency: data.value.currency
      },
      averageDaysInStage: 30 // Placeholder - would need historical data
    };
  });

  return {
    totalDeals: summary.totalDeals,
    totalPipelineValue: summary.totalValue,
    weightedPipelineValue: {
      amount: summary.totalValue.amount * 0.5,
      currency: summary.totalValue.currency
    },
    averageDealSize: {
      amount: averageDealSize,
      currency: summary.totalValue.currency
    },
    pipelineChange: 0, // Would need historical data
    dealSizeChange: 0, // Would need historical data
    averageDaysToClose: 145, // Placeholder
    winRate: conversionRate / 100,
    winRateChange: 0, // Would need historical data
    ytdClosings: { amount: 0, currency: summary.totalValue.currency }, // Would need historical data
    ytdClosingsCount: closedDeals,
    totalDeployed: { amount: 0, currency: summary.totalValue.currency }, // Would need financial data
    averageIRR: 0, // Would need financial data
    averageMOIC: 0, // Would need financial data
    activeDeals,
    closedDeals,
    conversionRate,
    byStage,
  };
}

export function InvestmentDashboard() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>('ytd');
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');

  // Use real data hooks
  const { summary, loading: summaryLoading, error: summaryError } = usePipelineSummary();
  const { deals, loading: dealsLoading } = usePipeline();

  const loading = summaryLoading || dealsLoading;

  // Transform backend data to dashboard format
  const analytics = useMemo(() => {
    if (!summary) return null;
    return transformToDashboardAnalytics(summary, deals);
  }, [summary, deals]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (summaryError || !summary || !analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600">Failed to load pipeline summary</p>
          <p className="text-gray-500 text-sm mt-2">{summaryError?.message}</p>
        </div>
      </div>
    );
  }

  const handleCreateDeal = () => {
    navigate('/investment/deals/new');
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Infrastructure Investment</h1>
          <p className="text-gray-500">
            {analytics.totalDeals} deals • ${(analytics.totalPipelineValue.amount / 1000000).toFixed(1)}M pipeline
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              className={`px-3 py-2 ${viewMode === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setViewMode('dashboard')}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              className={`px-3 py-2 border-l ${viewMode === 'kanban' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              onClick={() => navigate('/investment/pipeline')}
            >
              <Kanban className="w-4 h-4" />
            </button>
            <button
              className={`px-3 py-2 border-l ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              onClick={() => navigate('/investment/deals')}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Date Range */}
          <select
            className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
          >
            <option value="qtd">Quarter to Date</option>
            <option value="ytd">Year to Date</option>
            <option value="1y">Last 12 Months</option>
            <option value="all">All Time</option>
          </select>

          <button
            onClick={handleCreateDeal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Deal
          </button>
        </div>
      </div>

      {/* Pipeline Summary Cards */}
      <PipelineSummary analytics={analytics} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deals Funnel - 2 cols */}
        <div className="lg:col-span-2">
          <DealsFunnel
            analytics={analytics}
            onStageClick={(stage: string) => navigate(`/investment/pipeline?stage=${stage}`)}
          />
        </div>

        {/* Investment Metrics - 1 col */}
        <div>
          <InvestmentMetrics
            metrics={{
              totalDeployed: analytics.totalDeployed,
              averageIRR: analytics.averageIRR,
              averageMOIC: analytics.averageMOIC,
              activeDeals: analytics.activeDeals,
              closedDeals: analytics.closedDeals,
              conversionRate: analytics.conversionRate
            }}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity
        deals={deals.slice(0, 10) as any}
        limit={10}
        onDealClick={(dealId: string) => navigate(`/investment/deals/${dealId}`)}
      />
    </div>
  );
}

export default InvestmentDashboard;
