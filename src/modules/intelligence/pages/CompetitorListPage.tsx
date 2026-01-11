// ============================================================================
// COMPETITOR LIST PAGE
// DawinOS v2.0 - Market Intelligence Module
// List and manage tracked competitors
// ============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  LayoutGrid, 
  List, 
  Bell, 
  BellOff, 
  Building2, 
  ExternalLink,
  ArrowLeftRight,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/core/components/ui/tooltip';

import { useCompetitors } from '../hooks/useCompetitors';
import { ThreatLevel, THREAT_LEVELS, INDUSTRY_SECTORS, MODULE_COLOR } from '../constants';

const CompetitorListPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [threatFilter, setThreatFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<string>('grid');
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);

  const { competitors, loading, toggleAlerts } = useCompetitors({
    search: searchQuery,
    sector: sectorFilter !== 'all' ? sectorFilter : undefined,
    threatLevel: threatFilter !== 'all' ? threatFilter as ThreatLevel : undefined,
  });

  const handleCompetitorClick = (competitorId: string) => {
    navigate(`/intelligence/competitors/${competitorId}`);
  };

  const handleCompare = () => {
    if (selectedForComparison.length >= 2) {
      navigate(`/intelligence/competitors/compare?ids=${selectedForComparison.join(',')}`);
    }
  };

  const toggleSelection = (competitorId: string) => {
    setSelectedForComparison(prev =>
      prev.includes(competitorId)
        ? prev.filter(id => id !== competitorId)
        : prev.length < 4
          ? [...prev, competitorId]
          : prev
    );
  };

  const ThreatLevelBadge: React.FC<{ level: ThreatLevel }> = ({ level }) => {
    const config = THREAT_LEVELS.find(t => t.id === level);
    return (
      <Badge
        style={{
          backgroundColor: `${config?.color}20`,
          color: config?.color,
        }}
      >
        {config?.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Competitors</h1>
          <p className="text-muted-foreground">Track and analyze your competitive landscape</p>
        </div>
        <div className="flex gap-2">
          {selectedForComparison.length >= 2 && (
            <Button
              variant="outline"
              onClick={handleCompare}
              style={{ color: MODULE_COLOR, borderColor: MODULE_COLOR }}
            >
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Compare ({selectedForComparison.length})
            </Button>
          )}
          <Button style={{ backgroundColor: MODULE_COLOR }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Competitor
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search competitors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={sectorFilter} onValueChange={setSectorFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Sectors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                {INDUSTRY_SECTORS.map(sector => (
                  <SelectItem key={sector.id} value={sector.id}>{sector.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={threatFilter} onValueChange={setThreatFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Threat Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {THREAT_LEVELS.map(level => (
                  <SelectItem key={level.id} value={level.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: level.color }}
                      />
                      {level.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex-1" />

            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                className="rounded-r-none"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                className="rounded-l-none"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {competitors.length} competitor{competitors.length !== 1 ? 's' : ''} found
        </p>
        {selectedForComparison.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setSelectedForComparison([])}>
            Clear Selection
          </Button>
        )}
      </div>

      {/* Competitors Grid/List */}
      <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
        {competitors.map((competitor) => (
          <Card
            key={competitor.id}
            className={`cursor-pointer hover:shadow-lg transition-all ${
              selectedForComparison.includes(competitor.id) ? 'ring-2' : ''
            }`}
            style={{
              borderColor: selectedForComparison.includes(competitor.id) ? MODULE_COLOR : undefined,
            }}
            onClick={() => handleCompetitorClick(competitor.id)}
          >
            <CardContent className="p-4">
              <div className={`flex ${viewMode === 'grid' ? 'flex-col' : 'flex-row items-center'} gap-4`}>
                <div className="flex items-start gap-3">
                  <div
                    className="h-14 w-14 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${MODULE_COLOR}20`, color: MODULE_COLOR }}
                  >
                    {competitor.logoUrl ? (
                      <img src={competitor.logoUrl} alt={competitor.name} className="h-full w-full rounded-lg object-cover" />
                    ) : (
                      <Building2 className="h-7 w-7" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{competitor.name}</h3>
                      {competitor.website && (
                        <a
                          href={competitor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {INDUSTRY_SECTORS.find(s => s.id === competitor.sector)?.label || competitor.sector}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <ThreatLevelBadge level={competitor.threatLevel} />
                      <Badge variant="outline" className="capitalize">
                        {competitor.competitorType.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>

                {viewMode === 'grid' && competitor.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {competitor.description}
                  </p>
                )}

                {/* Metrics */}
                <div className={`flex gap-4 ${viewMode === 'grid' ? 'mt-2' : ''}`}>
                  {competitor.marketShare !== undefined && (
                    <div>
                      <p className="text-xs text-muted-foreground">Market Share</p>
                      <p className="font-medium">{competitor.marketShare.toFixed(1)}%</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Strength</p>
                    <p className="font-medium">{competitor.strengthScore}/100</p>
                  </div>
                  {competitor.employeeCount && (
                    <div>
                      <p className="text-xs text-muted-foreground">Employees</p>
                      <p className="font-medium">{competitor.employeeCount.toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className={`flex items-center gap-2 ${viewMode === 'grid' ? 'mt-auto pt-3 border-t' : 'ml-auto'}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelection(competitor.id);
                    }}
                    style={{
                      color: selectedForComparison.includes(competitor.id) ? MODULE_COLOR : undefined,
                    }}
                  >
                    {selectedForComparison.includes(competitor.id) ? 'Selected' : 'Compare'}
                  </Button>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAlerts(competitor.id);
                          }}
                          style={{
                            color: competitor.alertsEnabled ? MODULE_COLOR : undefined,
                          }}
                        >
                          {competitor.alertsEnabled ? (
                            <Bell className="h-4 w-4" />
                          ) : (
                            <BellOff className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {competitor.alertsEnabled ? 'Alerts On' : 'Alerts Off'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {competitors.length === 0 && !loading && (
        <Card className="p-12 text-center">
          <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Competitors Found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || sectorFilter !== 'all' || threatFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Start tracking your first competitor'}
          </p>
          <Button style={{ backgroundColor: MODULE_COLOR }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Competitor
          </Button>
        </Card>
      )}
    </div>
  );
};

export default CompetitorListPage;
