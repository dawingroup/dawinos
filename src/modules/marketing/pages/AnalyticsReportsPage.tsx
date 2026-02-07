/**
 * AnalyticsReportsPage
 * Marketing analytics dashboard with charts, KPIs, and date filtering
 */

import { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  MessageSquare,
  CheckCircle,
  RefreshCw,
  AreaChart,
  BarChart,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCampaignAnalytics } from '../hooks/useCampaignAnalytics';
import {
  CampaignPerformanceChart,
  TypeBreakdownChart,
  WhatsAppFunnelChart,
} from '../components/analytics/CampaignPerformanceChart';
import { ROICalculator } from '../components/analytics/ROICalculator';


type DatePreset = '7d' | '30d' | '90d' | 'all';

function getPresetRange(preset: DatePreset): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date();
  switch (preset) {
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
    case '90d':
      start.setDate(start.getDate() - 90);
      break;
    case 'all':
      start.setFullYear(start.getFullYear() - 5);
      break;
  }
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

export default function AnalyticsReportsPage() {
  const { user } = useAuth();
  const [datePreset, setDatePreset] = useState<DatePreset>('30d');
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [activeTab, setActiveTab] = useState<'overview' | 'whatsapp' | 'roi'>('overview');

  const { start, end } = useMemo(() => getPresetRange(datePreset), [datePreset]);

  const { aggregated, dateRange, topCampaigns, campaigns, loading, error } =
    useCampaignAnalytics(user?.companyId, start, end);

  if (loading) {
    return (
      <div className="px-6 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Error loading analytics: {error.message}
        </div>
      </div>
    );
  }

  // Use date-range data for display, fall back to aggregated
  const totalCampaigns = dateRange?.totalCampaigns ?? aggregated?.totalCampaigns ?? 0;
  const totalSent = dateRange?.totalSent ?? aggregated?.totalSent ?? 0;
  const totalReach = dateRange?.totalReach ?? aggregated?.totalReached ?? 0;
  const totalEngagements = dateRange?.totalEngagements ?? aggregated?.totalEngagements ?? 0;
  const avgEngRate = dateRange?.averageEngagementRate ?? aggregated?.avgEngagementRate ?? 0;
  const avgConvRate = dateRange?.averageConversionRate ?? aggregated?.avgConversionRate ?? 0;

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-muted-foreground">Campaign performance insights and ROI tracking</p>
        </div>
        {aggregated?.calculatedAt && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <RefreshCw className="h-3 w-3" />
            Last aggregated:{' '}
            {aggregated.calculatedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
          </div>
        )}
      </div>

      {/* Date Range & Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
          {([
            { id: 'overview', label: 'Overview' },
            { id: 'whatsapp', label: 'WhatsApp' },
            { id: 'roi', label: 'ROI' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date range + chart toggle */}
        <div className="flex items-center gap-2">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            {([
              { id: '7d', label: '7D' },
              { id: '30d', label: '30D' },
              { id: '90d', label: '90D' },
              { id: 'all', label: 'All' },
            ] as const).map((p) => (
              <button
                key={p.id}
                onClick={() => setDatePreset(p.id)}
                className={`px-3 py-1.5 text-xs ${
                  datePreset === p.id
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setChartType('area')}
              className={`p-1.5 ${chartType === 'area' ? 'bg-gray-100' : ''}`}
              title="Area chart"
            >
              <AreaChart className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`p-1.5 ${chartType === 'bar' ? 'bg-gray-100' : ''}`}
              title="Bar chart"
            >
              <BarChart className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPI icon={BarChart3} label="Campaigns" value={totalCampaigns} color="blue" />
        <KPI icon={MessageSquare} label="Sent" value={totalSent} color="indigo" />
        <KPI icon={Users} label="Reach" value={totalReach} color="green" />
        <KPI icon={TrendingUp} label="Engagements" value={totalEngagements} color="purple" />
        <KPI
          icon={CheckCircle}
          label="Eng. Rate"
          value={`${(avgEngRate * 100).toFixed(1)}%`}
          color="orange"
        />
        <KPI
          icon={CheckCircle}
          label="Conv. Rate"
          value={`${(avgConvRate * 100).toFixed(1)}%`}
          color="emerald"
        />
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab
          dateRange={dateRange}
          topCampaigns={topCampaigns}
          chartType={chartType}
        />
      )}

      {activeTab === 'whatsapp' && (
        <WhatsAppTab aggregated={aggregated} />
      )}

      {activeTab === 'roi' && (
        <ROITab campaigns={campaigns} />
      )}
    </div>
  );
}

// ============================================
// Tab Content Components
// ============================================

function OverviewTab({
  dateRange,
  topCampaigns,
  chartType,
}: {
  dateRange: any;
  topCampaigns: any[];
  chartType: 'area' | 'bar';
}) {
  return (
    <div className="space-y-6">
      {/* Performance Over Time */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Performance Over Time</h3>
        <CampaignPerformanceChart
          dailyMetrics={dateRange?.dailyMetrics || []}
          chartType={chartType}
          height={320}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Type Breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">By Campaign Type</h3>
          <TypeBreakdownChart data={dateRange?.campaignTypeBreakdown || []} height={260} />
        </div>

        {/* Top Campaigns */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Campaigns</h3>
          {topCampaigns.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No campaign data yet</p>
          ) : (
            <div className="space-y-2">
              {topCampaigns.map((c, i) => (
                <div
                  key={c.campaignId}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {c.campaignName}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {c.campaignType?.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {((c.engagementRate || 0) * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">engagement</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Platform Breakdown */}
      {dateRange?.platformBreakdown && dateRange.platformBreakdown.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">By Platform</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {dateRange.platformBreakdown.map((p: any) => (
              <div key={p.platform} className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm font-semibold text-gray-900">{p.platform}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {p.reach.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">reach across {p.count} campaigns</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WhatsAppTab({ aggregated }: { aggregated: any }) {
  const sent = aggregated?.totalSent || 0;
  const delivered = aggregated?.totalWhatsAppDelivered || 0;
  const read = aggregated?.totalWhatsAppRead || 0;
  const replied = aggregated?.totalWhatsAppReplied || 0;

  return (
    <div className="space-y-6">
      {/* WhatsApp KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI icon={MessageSquare} label="Sent" value={sent} color="blue" />
        <KPI icon={CheckCircle} label="Delivered" value={delivered} color="green" />
        <KPI icon={Users} label="Read" value={read} color="purple" />
        <KPI icon={TrendingUp} label="Replied" value={replied} color="orange" />
      </div>

      {/* Delivery Funnel */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">WhatsApp Delivery Funnel</h3>
        <WhatsAppFunnelChart sent={sent} delivered={delivered} read={read} replied={replied} />
      </div>

      {/* Rate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <RateCard
          label="Delivery Rate"
          rate={aggregated?.whatsappDeliveryRate || 0}
          description="Messages successfully delivered"
        />
        <RateCard
          label="Read Rate"
          rate={aggregated?.whatsappReadRate || 0}
          description="Delivered messages that were read"
        />
        <RateCard
          label="Reply Rate"
          rate={aggregated?.whatsappReplyRate || 0}
          description="Delivered messages that got a reply"
        />
      </div>
    </div>
  );
}

function ROITab({ campaigns }: { campaigns: any[] }) {
  return (
    <div className="space-y-6">
      <ROICalculator campaigns={campaigns} />
    </div>
  );
}

// ============================================
// Shared sub-components
// ============================================

const COLOR_MAP: Record<string, { bg: string; text: string; icon: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-900', icon: 'text-blue-600' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-900', icon: 'text-indigo-600' },
  green: { bg: 'bg-green-50', text: 'text-green-900', icon: 'text-green-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-900', icon: 'text-purple-600' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-900', icon: 'text-orange-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-900', icon: 'text-emerald-600' },
};

function KPI({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number | string;
  color: string;
}) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  const display = typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <div className={`${c.bg} rounded-lg p-3`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-4 w-4 ${c.icon}`} />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className={`text-xl font-bold ${c.text}`}>{display}</p>
    </div>
  );
}

function RateCard({
  label,
  rate,
  description,
}: {
  label: string;
  rate: number;
  description: string;
}) {
  const pct = (rate * 100).toFixed(1);
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{pct}%</p>
      <div className="w-full bg-gray-100 rounded-full h-2 mt-2 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${Math.min(rate * 100, 100)}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-2">{description}</p>
    </div>
  );
}
