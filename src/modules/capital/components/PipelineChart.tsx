// ============================================================================
// PIPELINE CHART
// DawinOS v2.0 - Capital Hub Module
// Simple bar chart visualization for pipeline analytics
// ============================================================================

import React from 'react';
import { PipelineSummary } from '../types/capital.types';
import {
  DEAL_STAGE_LABELS,
  SECTOR_LABELS,
  ACTIVE_DEAL_STAGES,
} from '../constants/capital.constants';

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

interface PipelineChartProps {
  summary: PipelineSummary;
  currency?: string;
}

interface BarChartProps {
  data: Array<{ label: string; value: number; count: number }>;
  maxValue: number;
  currency: string;
  colorClass?: string;
}

interface PieChartProps {
  data: Array<{ label: string; value: number; color: string }>;
  totalValue: number;
  currency: string;
}

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------

const formatCurrency = (amount: number, currency: string): string => {
  if (currency === 'UGX') {
    if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    return `${(amount / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
};

const SECTOR_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-cyan-500',
  'bg-red-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-pink-500',
  'bg-orange-500',
];

// ----------------------------------------------------------------------------
// BAR CHART
// ----------------------------------------------------------------------------

const BarChart: React.FC<BarChartProps> = ({
  data,
  maxValue,
  currency,
  colorClass = 'bg-indigo-500',
}) => {
  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const widthPercent = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        return (
          <div key={index} className="flex items-center gap-3">
            <span className="w-28 text-sm text-gray-600 truncate" title={item.label}>
              {item.label}
            </span>
            <div className="flex-1">
              <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden">
                <div
                  className={`h-full ${colorClass} rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                  style={{ width: `${Math.max(widthPercent, 5)}%` }}
                >
                  {widthPercent > 20 && (
                    <span className="text-xs text-white font-medium">
                      {formatCurrency(item.value, currency)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <span className="w-16 text-sm text-gray-500 text-right">
              {item.count} deals
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ----------------------------------------------------------------------------
// SIMPLE PIE CHART (CSS-based)
// ----------------------------------------------------------------------------

const SimplePieChart: React.FC<PieChartProps> = ({
  data,
  totalValue,
}) => {
  // Calculate percentages
  let cumulativePercent = 0;
  const segments = data.map((item) => {
    const percent = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
    const segment = {
      ...item,
      percent,
      startPercent: cumulativePercent,
    };
    cumulativePercent += percent;
    return segment;
  });

  // Generate conic gradient
  const gradientStops = segments
    .map((seg, i) => {
      const color = SECTOR_COLORS[i % SECTOR_COLORS.length].replace('bg-', '');
      const colorMap: Record<string, string> = {
        'blue-500': '#3b82f6',
        'green-500': '#22c55e',
        'amber-500': '#f59e0b',
        'purple-500': '#a855f7',
        'cyan-500': '#06b6d4',
        'red-500': '#ef4444',
        'indigo-500': '#6366f1',
        'teal-500': '#14b8a6',
        'pink-500': '#ec4899',
        'orange-500': '#f97316',
      };
      const hexColor = colorMap[color] || '#6366f1';
      return `${hexColor} ${seg.startPercent}% ${seg.startPercent + seg.percent}%`;
    })
    .join(', ');

  return (
    <div className="flex items-center gap-6">
      {/* Pie */}
      <div
        className="w-40 h-40 rounded-full flex-shrink-0"
        style={{
          background: segments.length > 0 
            ? `conic-gradient(${gradientStops})`
            : '#e5e7eb',
        }}
      />

      {/* Legend */}
      <div className="flex-1 space-y-2 max-h-40 overflow-y-auto">
        {segments.slice(0, 8).map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded ${SECTOR_COLORS[index % SECTOR_COLORS.length]}`} />
            <span className="text-sm text-gray-600 truncate flex-1">{item.label}</span>
            <span className="text-xs text-gray-500">{item.percent.toFixed(0)}%</span>
          </div>
        ))}
        {segments.length > 8 && (
          <span className="text-xs text-gray-400">+{segments.length - 8} more</span>
        )}
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// PIPELINE CHART
// ----------------------------------------------------------------------------

export const PipelineChart: React.FC<PipelineChartProps> = ({
  summary,
  currency = 'UGX',
}) => {
  // Prepare stage data
  const stageData = ACTIVE_DEAL_STAGES.map(stage => ({
    label: DEAL_STAGE_LABELS[stage],
    value: summary.byStage[stage]?.value || 0,
    count: summary.byStage[stage]?.count || 0,
  }));

  const maxStageValue = Math.max(...stageData.map(d => d.value));

  // Prepare sector data
  const sectorData = Object.entries(summary.bySector)
    .map(([sector, data]) => ({
      label: SECTOR_LABELS[sector] || sector,
      value: data.value,
      count: data.count,
      color: '',
    }))
    .sort((a, b) => b.value - a.value);

  const totalSectorValue = sectorData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pipeline by Stage */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline by Stage</h3>
        <BarChart
          data={stageData}
          maxValue={maxStageValue}
          currency={currency}
          colorClass="bg-indigo-500"
        />
      </div>

      {/* Pipeline by Sector */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline by Sector</h3>
        {sectorData.length > 0 ? (
          <SimplePieChart
            data={sectorData}
            totalValue={totalSectorValue}
            currency={currency}
          />
        ) : (
          <div className="text-center py-8 text-gray-500">No sector data</div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-indigo-600">
              {summary.conversionRate.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-500 mt-1">Conversion Rate</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">
              {summary.closedThisYear}
            </p>
            <p className="text-sm text-gray-500 mt-1">Closed This Year</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-amber-600">
              {Math.round(summary.averageCloseTime)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Avg Days to Close</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-gray-900">
              {currency} {formatCurrency(summary.averageDealSize, currency)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Avg Deal Size</p>
          </div>
        </div>
      </div>

      {/* Monthly Performance */}
      <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 border border-gray-100 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Closed This Month</span>
              <span className="text-2xl font-bold text-green-600">{summary.closedThisMonth}</span>
            </div>
          </div>
          <div className="p-4 border border-gray-100 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Closed This Quarter</span>
              <span className="text-2xl font-bold text-green-600">{summary.closedThisQuarter}</span>
            </div>
          </div>
          <div className="p-4 border border-gray-100 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Closed This Year</span>
              <span className="text-2xl font-bold text-green-600">{summary.closedThisYear}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
