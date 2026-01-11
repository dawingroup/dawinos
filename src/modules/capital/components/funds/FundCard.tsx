// ============================================================================
// FUND CARD COMPONENT
// DawinOS v2.0 - Capital Hub Module
// Card view for funds
// ============================================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';

import { Card, CardContent } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Progress } from '@/core/components/ui/progress';

import { formatCurrency } from '../shared/CurrencyDisplay';
import { MODULE_COLOR } from '../../constants';

interface Fund {
  id: string;
  name: string;
  vintage: number;
  status: 'fundraising' | 'investing' | 'harvesting' | 'closed';
  targetSizeUSD: number;
  committedCapitalUSD: number;
  calledCapitalUSD: number;
  deployedCapitalUSD: number;
  investmentCount: number;
  netIRR: number;
  tvpi: number;
}

interface FundCardProps {
  fund: Fund;
  onClick?: (fund: Fund) => void;
}

const getFundStatusColor = (status: Fund['status']): string => {
  switch (status) {
    case 'fundraising': return '#2196f3';
    case 'investing': return '#4caf50';
    case 'harvesting': return '#ff9800';
    case 'closed': return '#9e9e9e';
    default: return MODULE_COLOR;
  }
};

export const FundCard: React.FC<FundCardProps> = ({ fund, onClick }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick(fund);
    } else {
      navigate(`/capital/funds/${fund.id}`);
    }
  };

  const committedProgress = (fund.committedCapitalUSD / fund.targetSizeUSD) * 100;
  const calledProgress = fund.committedCapitalUSD > 0 
    ? (fund.calledCapitalUSD / fund.committedCapitalUSD) * 100 
    : 0;

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5"
      style={{ borderTop: `4px solid ${getFundStatusColor(fund.status)}` }}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold">{fund.name}</h3>
            <p className="text-sm text-muted-foreground">Vintage {fund.vintage}</p>
          </div>
          <Badge
            className="text-white capitalize"
            style={{ backgroundColor: getFundStatusColor(fund.status) }}
          >
            {fund.status.replace('_', ' ')}
          </Badge>
        </div>

        {/* Fund Size */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground">Target Fund Size</p>
          <p className="text-xl font-semibold">{formatCurrency(fund.targetSizeUSD, 'USD', true)}</p>
        </div>

        {/* Committed Capital Progress */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Committed Capital</span>
            <span>
              {formatCurrency(fund.committedCapitalUSD, 'USD', true)} / {formatCurrency(fund.targetSizeUSD, 'USD', true)}
            </span>
          </div>
          <Progress value={Math.min(committedProgress, 100)} className="h-2" />
        </div>

        {/* Capital Called Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Capital Called</span>
            <span>{calledProgress.toFixed(0)}% of committed</span>
          </div>
          <Progress value={calledProgress} className="h-1.5 bg-gray-200" />
        </div>

        <div className="border-t pt-3">
          <div className="flex justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Investments</p>
              <p className="font-medium">{fund.investmentCount}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Net IRR</p>
              <p className={`font-medium ${fund.netIRR >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {fund.netIRR >= 0 ? '+' : ''}{fund.netIRR.toFixed(1)}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">TVPI</p>
              <p className="font-medium">{fund.tvpi.toFixed(2)}x</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FundCard;
