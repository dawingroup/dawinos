// ============================================================================
// WATERFALL CALCULATOR COMPONENT
// DawinOS v2.0 - Capital Hub Module
// Interactive distribution waterfall calculator
// ============================================================================

import React, { useState, useCallback } from 'react';
import { Calculator, DollarSign, Users, Briefcase, ArrowDown } from 'lucide-react';
import { WaterfallCalculation } from '../../types/allocation.types';
import { WaterfallTier } from '../../constants/allocation.constants';

interface WaterfallCalculatorProps {
  waterfallCalculation: WaterfallCalculation | null;
  onCalculate: (amount: number) => Promise<void>;
  isLoading?: boolean;
  fundName?: string;
}

export const WaterfallCalculator: React.FC<WaterfallCalculatorProps> = ({
  waterfallCalculation,
  onCalculate,
  isLoading = false,
  fundName,
}) => {
  const [distributionAmount, setDistributionAmount] = useState<string>('');

  const handleCalculate = useCallback(async () => {
    const amount = parseFloat(distributionAmount.replace(/,/g, ''));
    if (!isNaN(amount) && amount > 0) {
      await onCalculate(amount);
    }
  }, [distributionAmount, onCalculate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const getTierColor = (tier: WaterfallTier) => {
    switch (tier) {
      case 'return_of_capital':
        return 'bg-blue-500';
      case 'preferred_return':
        return 'bg-green-500';
      case 'gp_catchup':
        return 'bg-amber-500';
      case 'carried_interest':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTierBgColor = (tier: WaterfallTier) => {
    switch (tier) {
      case 'return_of_capital':
        return 'bg-blue-50 border-blue-200';
      case 'preferred_return':
        return 'bg-green-50 border-green-200';
      case 'gp_catchup':
        return 'bg-amber-50 border-amber-200';
      case 'carried_interest':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Waterfall Calculator</h3>
        </div>
        {fundName && (
          <p className="text-sm text-gray-500 mt-1">{fundName}</p>
        )}
      </div>

      {/* Input Section */}
      <div className="p-4 border-b border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Distribution Amount
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={distributionAmount}
              onChange={(e) => setDistributionAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleCalculate}
            disabled={isLoading || !distributionAmount}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Calculating...' : 'Calculate'}
          </button>
        </div>
      </div>

      {/* Results */}
      {waterfallCalculation && (
        <>
          {/* Summary */}
          <div className="p-4 border-b border-gray-100 grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">LP Share</span>
              </div>
              <div className="text-xl font-bold text-blue-900">
                {formatCurrency(waterfallCalculation.totalToLP)}
              </div>
              <div className="text-sm text-blue-700">
                {formatPercent(100 - waterfallCalculation.effectiveCarry)}
              </div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">GP Share</span>
              </div>
              <div className="text-xl font-bold text-purple-900">
                {formatCurrency(waterfallCalculation.totalToGP)}
              </div>
              <div className="text-sm text-purple-700">
                {formatPercent(waterfallCalculation.effectiveCarry)} effective carry
              </div>
            </div>
          </div>

          {/* Waterfall Tiers */}
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Distribution Waterfall</h4>
            <div className="space-y-3">
              {waterfallCalculation.tiers.map((tier, index) => (
                <div key={tier.tier}>
                  {/* Tier Card */}
                  <div className={`p-3 rounded-lg border ${getTierBgColor(tier.tier)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getTierColor(tier.tier)}`} />
                        <span className="font-medium text-gray-900">{tier.label}</span>
                      </div>
                      {tier.tierComplete && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Complete
                        </span>
                      )}
                    </div>
                    
                    {/* Amounts */}
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">LP ({tier.lpPercent}%)</div>
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(tier.lpShare)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">GP ({tier.gpPercent}%)</div>
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(tier.gpShare)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Arrow between tiers */}
                  {index < waterfallCalculation.tiers.length - 1 && (
                    <div className="flex justify-center py-1">
                      <ArrowDown className="w-4 h-4 text-gray-300" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Visual Bar */}
          <div className="px-4 pb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Split Visualization</h4>
            <div className="h-8 rounded-lg overflow-hidden flex">
              <div
                className="bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${100 - waterfallCalculation.effectiveCarry}%` }}
              >
                LP
              </div>
              <div
                className="bg-purple-500 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${waterfallCalculation.effectiveCarry}%` }}
              >
                GP
              </div>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!waterfallCalculation && (
        <div className="p-8 text-center text-gray-500">
          <Calculator className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Enter a distribution amount to calculate the waterfall</p>
        </div>
      )}
    </div>
  );
};

export default WaterfallCalculator;
