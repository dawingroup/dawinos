// ============================================================================
// DEAL LIST PAGE
// DawinOS v2.0 - Capital Hub Module
// Deal pipeline list with grid/list/kanban views
// ============================================================================

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Download, 
  List, 
  LayoutGrid, 
  Kanban,
  MoreVertical,
  ArrowUpDown,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Badge } from '@/core/components/ui/badge';
import { Skeleton } from '@/core/components/ui/skeleton';
import { Progress } from '@/core/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';

import { useDeals } from '../hooks/useDeals';
import { DealStageChip } from '../components/shared/DealStageChip';
import { formatCurrency } from '../components/shared/CurrencyDisplay';
import { MODULE_COLOR, DEAL_STAGES, DEAL_TYPES, SECTORS } from '../constants';

type ViewMode = 'list' | 'grid' | 'kanban';

const DealListPage: React.FC = () => {
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sectorFilter, setSectorFilter] = useState<string>('all');

  const { deals, loading } = useDeals({
    search: searchQuery,
    stage: stageFilter !== 'all' ? stageFilter : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    sector: sectorFilter !== 'all' ? sectorFilter : undefined,
  });

  const summaryMetrics = useMemo(() => {
    if (!deals) return { total: 0, totalValue: 0 };
    const totalValue = deals.reduce((sum, d) => sum + (d.dealSize || 0), 0);
    return { total: deals.length, totalValue };
  }, [deals]);

  const handleDealClick = (dealId: string) => {
    navigate(`/capital/deals/${dealId}`);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-14 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Deal Pipeline</h1>
          <p className="text-muted-foreground">
            {summaryMetrics.total} deals · {formatCurrency(summaryMetrics.totalValue, 'USD', true)} total value
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={() => navigate('/capital/deals/new')}
            style={{ backgroundColor: MODULE_COLOR }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Deal
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative lg:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search deals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {DEAL_STAGES.map(stage => (
                  <SelectItem key={stage.id} value={stage.id}>{stage.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {DEAL_TYPES.map(type => (
                  <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
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
            <div className="flex justify-end gap-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('kanban')}
              >
                <Kanban className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List View */}
      {viewMode === 'list' && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal Name</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead className="text-right">Deal Size</TableHead>
                <TableHead className="text-center">Probability</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals?.map(deal => (
                <TableRow
                  key={deal.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleDealClick(deal.id)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{deal.name}</p>
                      <p className="text-sm text-muted-foreground">{deal.companyName}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DealStageChip stage={deal.stage} />
                  </TableCell>
                  <TableCell>
                    {DEAL_TYPES.find(t => t.id === deal.dealType)?.label || deal.dealType}
                  </TableCell>
                  <TableCell>
                    {SECTORS.find(s => s.id === deal.sector)?.label || deal.sector}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(deal.dealSize || 0, 'USD', true)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 justify-center">
                      <Progress value={deal.probability} className="w-16 h-2" />
                      <span className="text-sm">{deal.probability}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/capital/deals/${deal.id}`)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/capital/deals/${deal.id}/edit`)}>
                          Edit Deal
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Move to Next Stage</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Mark as Lost</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {deals?.map(deal => {
            const stageConfig = DEAL_STAGES.find(s => s.id === deal.stage);
            return (
              <Card
                key={deal.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                style={{ borderTop: `4px solid ${stageConfig?.color || '#9E9E9E'}` }}
                onClick={() => handleDealClick(deal.id)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <DealStageChip stage={deal.stage} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/capital/deals/${deal.id}`)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>Edit Deal</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <h3 className="font-semibold mb-1">{deal.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{deal.companyName}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <p className="text-muted-foreground text-xs">Deal Size</p>
                      <p className="font-medium">{formatCurrency(deal.dealSize || 0, 'USD', true)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Probability</p>
                      <p className="font-medium">{deal.probability}%</p>
                    </div>
                  </div>
                  <Progress value={deal.probability} className="h-1" />
                  <div className="flex justify-between items-center mt-3">
                    <Badge variant="outline">
                      {SECTORS.find(s => s.id === deal.sector)?.label || deal.sector}
                    </Badge>
                    <div
                      className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-medium"
                      style={{ backgroundColor: MODULE_COLOR }}
                    >
                      {deal.leadName?.[0] || '?'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {DEAL_STAGES.filter(s => s.id !== 'closed' && s.id !== 'lost').map(stage => {
            const stageDeals = deals?.filter(d => d.stage === stage.id) || [];
            const stageValue = stageDeals.reduce((sum, d) => sum + (d.dealSize || 0), 0);

            return (
              <div
                key={stage.id}
                className="min-w-[280px] max-w-[320px] flex-shrink-0 bg-muted/50 rounded-lg"
              >
                <div
                  className="p-3 rounded-t-lg text-white"
                  style={{ backgroundColor: stage.color }}
                >
                  <p className="font-semibold">{stage.label}</p>
                  <p className="text-sm opacity-90">
                    {stageDeals.length} deals · {formatCurrency(stageValue, 'USD', true)}
                  </p>
                </div>
                <div className="p-2 space-y-2 max-h-[60vh] overflow-y-auto">
                  {stageDeals.map(deal => (
                    <Card
                      key={deal.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleDealClick(deal.id)}
                    >
                      <CardContent className="p-3">
                        <p className="font-medium text-sm">{deal.name}</p>
                        <p className="text-xs text-muted-foreground">{deal.companyName}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs font-medium">
                            {formatCurrency(deal.dealSize || 0, 'USD', true)}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {deal.probability}%
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {stageDeals.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      No deals
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deals?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No deals found</p>
          <Button
            className="mt-4"
            onClick={() => navigate('/capital/deals/new')}
            style={{ backgroundColor: MODULE_COLOR }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create First Deal
          </Button>
        </div>
      )}
    </div>
  );
};

export default DealListPage;
