/**
 * Investment Dashboard - Portfolio overview for investment teams
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PipelineSummary, 
  DealsFunnel,
  InvestmentMetrics,
  RecentActivity 
} from '../components/dashboard';
import { Plus, BarChart3, Kanban, List, Loader2 } from 'lucide-react';

type ViewMode = 'dashboard' | 'kanban' | 'list';
type DateRange = 'ytd' | 'qtd' | '1y' | 'all';

// Mock data for demonstration
const mockAnalytics = {
  totalDeals: 24,
  totalPipelineValue: { amount: 125000000, currency: 'USD', formatted: '$125M' },
  weightedPipelineValue: { amount: 45000000, currency: 'USD', formatted: '$45M' },
  averageDealSize: { amount: 5200000, currency: 'USD', formatted: '$5.2M' },
  pipelineChange: 12.5,
  dealSizeChange: -3.2,
  averageDaysToClose: 145,
  winRate: 0.32,
  winRateChange: 0.05,
  ytdClosings: { amount: 28000000, currency: 'USD', formatted: '$28M' },
  ytdClosingsCount: 6,
  totalDeployed: { amount: 85000000, currency: 'USD', formatted: '$85M' },
  averageIRR: 0.185,
  averageMOIC: 2.3,
  activeDeals: 18,
  closedDeals: 6,
  conversionRate: 32,
  byStage: {
    screening: { count: 5, totalValue: { amount: 15000000, currency: 'USD' }, weightedValue: { amount: 1500000, currency: 'USD' }, averageDaysInStage: 14 },
    initial_review: { count: 4, totalValue: { amount: 18000000, currency: 'USD' }, weightedValue: { amount: 3600000, currency: 'USD' }, averageDaysInStage: 21 },
    preliminary_dd: { count: 3, totalValue: { amount: 22000000, currency: 'USD' }, weightedValue: { amount: 6600000, currency: 'USD' }, averageDaysInStage: 30 },
    detailed_dd: { count: 3, totalValue: { amount: 25000000, currency: 'USD' }, weightedValue: { amount: 12500000, currency: 'USD' }, averageDaysInStage: 45 },
    ic_memo: { count: 2, totalValue: { amount: 15000000, currency: 'USD' }, weightedValue: { amount: 9000000, currency: 'USD' }, averageDaysInStage: 14 },
    ic_approval: { count: 1, totalValue: { amount: 10000000, currency: 'USD' }, weightedValue: { amount: 7000000, currency: 'USD' }, averageDaysInStage: 7 },
    negotiation: { count: 2, totalValue: { amount: 12000000, currency: 'USD' }, weightedValue: { amount: 9600000, currency: 'USD' }, averageDaysInStage: 30 },
    documentation: { count: 1, totalValue: { amount: 8000000, currency: 'USD' }, weightedValue: { amount: 7200000, currency: 'USD' }, averageDaysInStage: 21 },
    closing: { count: 1, totalValue: { amount: 5000000, currency: 'USD' }, weightedValue: { amount: 4750000, currency: 'USD' }, averageDaysInStage: 7 },
    post_closing: { count: 2, totalValue: { amount: 15000000, currency: 'USD' }, weightedValue: { amount: 15000000, currency: 'USD' }, averageDaysInStage: 0 },
  },
  sectorAllocation: [
    { sector: 'healthcare', count: 6, value: 35000000, percentage: 28 },
    { sector: 'energy', count: 5, value: 30000000, percentage: 24 },
    { sector: 'transport', count: 4, value: 25000000, percentage: 20 },
    { sector: 'digital', count: 4, value: 20000000, percentage: 16 },
    { sector: 'water', count: 3, value: 15000000, percentage: 12 },
  ],
  geographyDistribution: [
    { country: 'UG', name: 'Uganda', count: 8, value: 45000000, percentage: 36 },
    { country: 'KE', name: 'Kenya', count: 6, value: 35000000, percentage: 28 },
    { country: 'TZ', name: 'Tanzania', count: 5, value: 25000000, percentage: 20 },
    { country: 'RW', name: 'Rwanda', count: 3, value: 12000000, percentage: 10 },
    { country: 'ET', name: 'Ethiopia', count: 2, value: 8000000, percentage: 6 },
  ],
};

const mockDeals = [
  { id: '1', name: 'Kampala Hospital Expansion', stage: 'detailed_dd', sector: 'healthcare', updatedAt: new Date() },
  { id: '2', name: 'Nairobi Solar Farm', stage: 'ic_memo', sector: 'energy', updatedAt: new Date() },
  { id: '3', name: 'Dar Port Logistics', stage: 'negotiation', sector: 'transport', updatedAt: new Date() },
];

export function InvestmentDashboard() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>('ytd');
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [loading] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
            {mockAnalytics.totalDeals} deals • {mockAnalytics.totalPipelineValue.formatted} pipeline
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
      <PipelineSummary analytics={mockAnalytics} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deals Funnel - 2 cols */}
        <div className="lg:col-span-2">
          <DealsFunnel 
            analytics={mockAnalytics}
            onStageClick={(stage: string) => navigate(`/investment/pipeline?stage=${stage}`)}
          />
        </div>

        {/* Investment Metrics - 1 col */}
        <div>
          <InvestmentMetrics 
            metrics={{
              totalDeployed: mockAnalytics.totalDeployed,
              averageIRR: mockAnalytics.averageIRR,
              averageMOIC: mockAnalytics.averageMOIC,
              activeDeals: mockAnalytics.activeDeals,
              closedDeals: mockAnalytics.closedDeals,
              conversionRate: mockAnalytics.conversionRate
            }}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity 
        deals={mockDeals}
        limit={10}
        onDealClick={(dealId: string) => navigate(`/investment/deals/${dealId}`)}
      />
    </div>
  );
}

export default InvestmentDashboard;
