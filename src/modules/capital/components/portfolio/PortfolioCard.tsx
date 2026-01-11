// ============================================================================
// PORTFOLIO CARD COMPONENT
// DawinOS v2.0 - Capital Hub Module
// Card view for portfolio companies
// ============================================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, TrendingUp, TrendingDown, Users } from 'lucide-react';

import { Card, CardContent } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/core/components/ui/tooltip';

import { formatCurrency } from '../shared/CurrencyDisplay';
import { MultiplesDisplay } from '../shared/MultiplesDisplay';
import { IRRDisplay } from '../shared/IRRDisplay';
import { InvestmentStatusChip } from '../shared/InvestmentStatusChip';
import { MODULE_COLOR } from '../../constants';

interface PortfolioInvestment {
  id: string;
  companyName: string;
  sector: string;
  status: string;
  investedAmountUSD?: number;
  currentValueUSD?: number;
  unrealizedGainUSD?: number;
  moic?: number;
  irr?: number;
  ownershipPercentage?: number;
  boardSeats?: number;
  logoUrl?: string;
}

interface PortfolioCardProps {
  investment: PortfolioInvestment;
  onClick?: (investment: PortfolioInvestment) => void;
}

export const PortfolioCard: React.FC<PortfolioCardProps> = ({ investment, onClick }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick(investment);
    } else {
      navigate(`/capital/portfolio/${investment.id}`);
    }
  };

  const isPositive = (investment.unrealizedGainUSD || 0) >= 0;

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5"
      onClick={handleClick}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${MODULE_COLOR}20`, color: MODULE_COLOR }}
            >
              {investment.logoUrl ? (
                <img src={investment.logoUrl} alt={investment.companyName} className="h-full w-full rounded-lg object-cover" />
              ) : (
                <Building2 className="h-6 w-6" />
              )}
            </div>
            <div>
              <h3 className="font-semibold truncate max-w-[180px]">{investment.companyName}</h3>
              <p className="text-sm text-muted-foreground">{investment.sector}</p>
            </div>
          </div>
          <InvestmentStatusChip status={investment.status} />
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <p className="text-xs text-muted-foreground">Invested</p>
            <p className="font-medium">{formatCurrency(investment.investedAmountUSD || 0, 'USD', true)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Current Value</p>
            <p className="font-medium">{formatCurrency(investment.currentValueUSD || 0, 'USD', true)}</p>
          </div>
        </div>

        <div className="border-t pt-3 mb-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground">MOIC</p>
              <MultiplesDisplay value={investment.moic || 1} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">IRR</p>
              <IRRDisplay value={investment.irr || 0} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ownership</p>
              <p className="font-medium">{(investment.ownershipPercentage || 0).toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Gain/Loss */}
        <div
          className={`p-3 rounded-lg ${isPositive ? 'bg-green-50' : 'bg-red-50'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? 'Unrealized Gain' : 'Unrealized Loss'}
              </span>
            </div>
            <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(investment.unrealizedGainUSD || 0), 'USD', true)}
            </span>
          </div>
        </div>

        {/* Board Seats */}
        {(investment.boardSeats || 0) > 0 && (
          <div className="mt-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="gap-1" style={{ color: MODULE_COLOR, borderColor: MODULE_COLOR }}>
                    <Users className="h-3 w-3" />
                    {investment.boardSeats} Board Seat{(investment.boardSeats || 0) > 1 ? 's' : ''}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>{investment.boardSeats} board seat(s)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PortfolioCard;
