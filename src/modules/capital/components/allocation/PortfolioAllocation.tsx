// ============================================================================
// PORTFOLIO ALLOCATION COMPONENT
// DawinOS v2.0 - Capital Hub Module
// Display portfolio allocation by sector and geography
// ============================================================================

import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { AllocationAnalytics, AllocationLimits } from '../../types/allocation.types';
import {
  ALLOCATION_SECTOR_LABELS,
  ALLOCATION_SECTOR_COLORS,
  GEOGRAPHIC_ALLOCATION_LABELS,
  GEOGRAPHIC_ALLOCATION_COLORS,
  AllocationSector,
  GeographicAllocation,
} from '../../constants/allocation.constants';

interface PortfolioAllocationProps {
  analytics: AllocationAnalytics;
  limits?: AllocationLimits;
  onDrillDown?: (type: 'sector' | 'geography', value: string) => void;
}

export const PortfolioAllocation: React.FC<PortfolioAllocationProps> = ({
  analytics,
  limits,
  onDrillDown,
}) => {
  const sectorData = useMemo(() => {
    return analytics.sectorAllocation.map(s => ({
      name: ALLOCATION_SECTOR_LABELS[s.sector as AllocationSector] || s.sector,
      value: s.percent,
      invested: s.invested,
      investments: s.investments,
      color: ALLOCATION_SECTOR_COLORS[s.sector as AllocationSector] || '#9E9E9E',
      sector: s.sector,
    }));
  }, [analytics.sectorAllocation]);

  const geographyData = useMemo(() => {
    return analytics.geographicAllocation.map(g => ({
      name: GEOGRAPHIC_ALLOCATION_LABELS[g.geography as GeographicAllocation] || g.geography,
      value: g.percent,
      invested: g.invested,
      investments: g.investments,
      color: GEOGRAPHIC_ALLOCATION_COLORS[g.geography as GeographicAllocation] || '#9E9E9E',
      geography: g.geography,
    }));
  }, [analytics.geographicAllocation]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };

  const getDiversificationColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getDiversificationBg = (score: number) => {
    if (score >= 70) return 'bg-green-100';
    if (score >= 40) return 'bg-amber-100';
    return 'bg-red-100';
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number; invested: number; investments: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">{data.value.toFixed(1)}% of portfolio</p>
          <p className="text-sm text-gray-600">{formatCurrency(data.invested)} invested</p>
          <p className="text-sm text-gray-600">{data.investments} investments</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Diversification Score */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Diversification Score</h3>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${getDiversificationBg(analytics.diversificationScore)} ${getDiversificationColor(analytics.diversificationScore)}`}
          >
            {analytics.diversificationScore.toFixed(0)}/100
          </div>
        </div>
        
        {/* Score Bar */}
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full rounded-full transition-all ${
              analytics.diversificationScore >= 70 ? 'bg-green-500' :
              analytics.diversificationScore >= 40 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${analytics.diversificationScore}%` }}
          />
        </div>
        
        {/* Alerts */}
        {analytics.diversificationNotes.length > 0 && (
          <div className="space-y-2">
            {analytics.diversificationNotes.map((note, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 p-2 rounded">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{note}</span>
              </div>
            ))}
          </div>
        )}
        
        {analytics.diversificationNotes.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded">
            <CheckCircle className="w-4 h-4" />
            <span>Portfolio meets all diversification thresholds</span>
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sector Allocation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Sector Allocation</h3>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  onClick={(data: { sector: string }) => onDrillDown?.('sector', data.sector)}
                  className="cursor-pointer"
                >
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {sectorData.slice(0, 6).map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                onClick={() => onDrillDown?.('sector', item.sector)}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-700 truncate">{item.name}</span>
                <span className="text-gray-500 ml-auto">{item.value.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic Allocation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Geographic Allocation</h3>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={geographyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  onClick={(data: { geography: string }) => onDrillDown?.('geography', data.geography)}
                  className="cursor-pointer"
                >
                  {geographyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {geographyData.slice(0, 6).map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                onClick={() => onDrillDown?.('geography', item.geography)}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-700 truncate">{item.name}</span>
                <span className="text-gray-500 ml-auto">{item.value.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Concentration Risk */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Concentration Risk</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Largest Investment</span>
            </div>
            <div className={`text-2xl font-bold ${
              analytics.concentrationRisk.largestInvestmentPercent > (limits?.maxSingleInvestmentPercent || 15)
                ? 'text-red-600' : 'text-gray-900'
            }`}>
              {analytics.concentrationRisk.largestInvestmentPercent.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">
              Limit: {limits?.maxSingleInvestmentPercent || 15}%
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Top 5 Investments</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {analytics.concentrationRisk.top5InvestmentsPercent.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">
              of total portfolio
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Herfindahl Index</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {(analytics.concentrationRisk.herfindahlIndex * 10000).toFixed(0)}
            </div>
            <div className="text-xs text-gray-500">
              Lower is more diversified
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioAllocation;
