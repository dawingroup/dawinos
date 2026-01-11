// ============================================================================
// PORTFOLIO LIST PAGE
// DawinOS v2.0 - Capital Hub Module
// Portfolio companies with performance metrics
// ============================================================================

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Download, 
  TrendingUp, 
  TrendingDown,
  Users,
} from 'lucide-react';

import { Card, CardContent } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Badge } from '@/core/components/ui/badge';
import { Skeleton } from '@/core/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/core/components/ui/tooltip';

import { usePortfolio } from '../hooks/usePortfolio';
import { formatCurrency } from '../components/shared/CurrencyDisplay';
import { MultiplesDisplay } from '../components/shared/MultiplesDisplay';
import { IRRDisplay } from '../components/shared/IRRDisplay';
import { InvestmentStatusChip } from '../components/shared/InvestmentStatusChip';
import { MODULE_COLOR, INVESTMENT_STATUSES, SECTORS } from '../constants';

const PortfolioListPage: React.FC = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sectorFilter, setSectorFilter] = useState<string>('all');

  const { investments, loading } = usePortfolio({
    search: searchQuery,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    sector: sectorFilter !== 'all' ? sectorFilter : undefined,
  });

  const summaryMetrics = useMemo(() => {
    if (!investments) return {
      activeInvestments: 0,
      totalInvested: 0,
      totalCurrentValue: 0,
      unrealizedGainLoss: 0,
    };
    
    const activeInvestments = investments.filter(i => i.status === 'active').length;
    const totalInvested = investments.reduce((sum, i) => sum + (i.investedAmount || 0), 0);
    const totalCurrentValue = investments.reduce((sum, i) => sum + (i.currentValue || 0), 0);
    const unrealizedGainLoss = totalCurrentValue - totalInvested;
    
    return { activeInvestments, totalInvested, totalCurrentValue, unrealizedGainLoss };
  }, [investments]);

  const handleCompanyClick = (companyId: string) => {
    navigate(`/capital/portfolio/${companyId}`);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Portfolio Companies</h1>
          <p className="text-muted-foreground">Track investment performance and valuations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button style={{ backgroundColor: MODULE_COLOR }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Investment
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold">{summaryMetrics.activeInvestments}</p>
            <p className="text-xs text-muted-foreground">Active Investments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold">{formatCurrency(summaryMetrics.totalInvested, 'USD', true)}</p>
            <p className="text-xs text-muted-foreground">Total Invested</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold">{formatCurrency(summaryMetrics.totalCurrentValue, 'USD', true)}</p>
            <p className="text-xs text-muted-foreground">Current Value</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className={`text-2xl font-semibold ${summaryMetrics.unrealizedGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summaryMetrics.unrealizedGainLoss >= 0 ? '+' : ''}
              {formatCurrency(summaryMetrics.unrealizedGainLoss, 'USD', true)}
            </p>
            <p className="text-xs text-muted-foreground">Unrealized Gain/Loss</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {INVESTMENT_STATUSES.map(status => (
                  <SelectItem key={status.id} value={status.id}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sectorFilter} onValueChange={setSectorFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Sectors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                {SECTORS.map(sector => (
                  <SelectItem key={sector.id} value={sector.id}>{sector.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sector</TableHead>
              <TableHead className="text-right">Invested</TableHead>
              <TableHead className="text-right">Current Value</TableHead>
              <TableHead className="text-center">MOIC</TableHead>
              <TableHead className="text-center">IRR</TableHead>
              <TableHead className="text-center">Board</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {investments?.map(investment => {
              const gainLoss = (investment.currentValue || 0) - (investment.investedAmount || 0);
              
              return (
                <TableRow
                  key={investment.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleCompanyClick(investment.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className="h-9 w-9 rounded-full flex items-center justify-center text-white font-medium"
                        style={{ backgroundColor: MODULE_COLOR }}
                      >
                        {investment.companyName[0]}
                      </div>
                      <div>
                        <p className="font-medium">{investment.companyName}</p>
                        <p className="text-xs text-muted-foreground">
                          {investment.investmentDate && new Date(investment.investmentDate).getFullYear()}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <InvestmentStatusChip status={investment.status} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {SECTORS.find(s => s.id === investment.sector)?.label || investment.sector}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(investment.investedAmount || 0, 'USD', true)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div>
                      <p className="font-medium">{formatCurrency(investment.currentValue || 0, 'USD', true)}</p>
                      <div className={`flex items-center justify-end gap-1 text-xs ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {gainLoss >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        <span>{gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss, 'USD', true)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <MultiplesDisplay value={investment.moic || 1} />
                  </TableCell>
                  <TableCell className="text-center">
                    <IRRDisplay value={investment.irr || 0} />
                  </TableCell>
                  <TableCell className="text-center">
                    {investment.hasBoardSeat ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Users className="h-4 w-4 text-primary mx-auto" />
                          </TooltipTrigger>
                          <TooltipContent>Board seat</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default PortfolioListPage;
