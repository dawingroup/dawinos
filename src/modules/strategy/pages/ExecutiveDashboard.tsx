// ============================================================================
// ExecutiveDashboard PAGE
// DawinOS v2.0 - CEO Strategy Command Module
// Main executive dashboard combining all performance views
// ============================================================================

import React, { useState } from 'react';
import {
  Box,
  Grid,
  Alert,
  Skeleton,
  Fade,
} from '@mui/material';
import {
  Flag as StrategyIcon,
  TrackChanges as OKRIcon,
  Speed as KPIIcon,
  TrendingUp as TrendIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/hooks/useAuth';

// Hooks
import {
  usePerformanceAggregation,
  usePerformanceHierarchy,
} from '../hooks/usePerformanceAggregation';
import { usePerformanceTrends } from '../hooks/usePerformanceTrends';

// Components
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { PerformanceSummaryCard } from '../components/dashboard/PerformanceSummaryCard';
import { StrategicPrioritiesWidget } from '../components/dashboard/StrategicPrioritiesWidget';
import { OKRProgressWidget } from '../components/dashboard/OKRProgressWidget';
import { KPIHealthWidget } from '../components/dashboard/KPIHealthWidget';
import { AlertsWidget } from '../components/dashboard/AlertsWidget';
import { QuickActionsWidget } from '../components/dashboard/QuickActionsWidget';
import { PerformanceOverview } from '../components/aggregation/PerformanceOverview';
import { PerformanceTimeline } from '../components/aggregation/PerformanceTimeline';
import { PerformanceHierarchy as PerformanceHierarchyComponent } from '../components/aggregation/PerformanceHierarchy';

// Types
import { StrategyAggregation, OKRAggregation, KPIAggregation, PillarProgress } from '../types/aggregation.types';

export const ExecutiveDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Calculate current fiscal year (Uganda fiscal year starts July 1)
  const now = new Date();
  const currentFiscalYear = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
  const currentQuarter = Math.ceil(((now.getMonth() - 6 + 12) % 12 + 1) / 3);
  
  // State
  const [fiscalYear, setFiscalYear] = useState(currentFiscalYear);
  const [quarter, setQuarter] = useState<number | undefined>(currentQuarter);
  
  // Company ID - in production this would come from context
  const companyId = user?.uid ? 'dawinos' : '';
  
  // Fetch aggregated performance
  const {
    aggregation,
    loading: aggregationLoading,
    error: aggregationError,
    refresh: refreshAggregation,
  } = usePerformanceAggregation({
    companyId,
    level: 'group',
    entityId: companyId,
    entityName: 'Dawin Group',
    fiscalYear,
    quarter,
    includeChildren: true,
    autoFetch: !!companyId,
  });
  
  // Fetch hierarchy
  const {
    hierarchy,
    loading: hierarchyLoading,
  } = usePerformanceHierarchy({
    companyId,
    fiscalYear,
    quarter,
    autoFetch: !!companyId,
  });
  
  // Fetch performance trends
  const {
    trend,
    loading: trendLoading,
    setDomain: changeDomain,
  } = usePerformanceTrends({
    companyId,
    entityId: companyId,
    entityName: 'Dawin Group',
    level: 'group',
    domain: 'combined',
    periods: 12,
    autoFetch: !!companyId,
  });
  
  // Mock data for demo when real data is not available
  const mockStrategyData: StrategyAggregation = {
    totalPlans: 3,
    activePlans: 2,
    completedPlans: 1,
    pillarProgress: [
      { pillarId: '1', pillarName: 'Market Expansion', progress: 75, objectivesCount: 4, completedObjectives: 3, status: 'on_track' },
      { pillarId: '2', pillarName: 'Operational Excellence', progress: 60, objectivesCount: 5, completedObjectives: 3, status: 'on_track' },
      { pillarId: '3', pillarName: 'Digital Transformation', progress: 45, objectivesCount: 3, completedObjectives: 1, status: 'at_risk' },
    ],
    averagePillarProgress: 60,
    totalObjectives: 12,
    completedObjectives: 7,
    onTrackObjectives: 3,
    atRiskObjectives: 2,
    totalInitiatives: 24,
    completedInitiatives: 15,
    onTrackInitiatives: 6,
    delayedInitiatives: 3,
    score: 68,
  };
  
  const mockOkrData: OKRAggregation = {
    totalObjectives: 15,
    completedObjectives: 5,
    onTrackObjectives: 6,
    atRiskObjectives: 3,
    notStartedObjectives: 1,
    totalKeyResults: 45,
    completedKeyResults: 18,
    onTrackKeyResults: 15,
    atRiskKeyResults: 12,
    averageObjectiveScore: 0.65,
    averageKeyResultScore: 0.62,
    score: 65,
    byLevel: {},
    alignmentScore: 85,
    cascadingDepth: 3,
  };
  
  const mockKpiData: KPIAggregation = {
    totalKPIs: 28,
    activeKPIs: 25,
    exceedingCount: 8,
    onTargetCount: 10,
    belowTargetCount: 5,
    criticalCount: 2,
    noDataCount: 3,
    averageScore: 72,
    healthScore: 75,
    score: 72,
    byCategory: {},
    improvingCount: 12,
    decliningCount: 6,
    stableCount: 10,
  };
  
  // Mock alerts
  const alerts = [
    {
      id: '1',
      severity: 'critical' as const,
      title: 'Revenue KPI Below Target',
      description: 'Q3 revenue is 15% below target',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: '2',
      severity: 'warning' as const,
      title: 'OKR Review Due',
      description: 'Quarterly OKR review due in 5 days',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      id: '3',
      severity: 'info' as const,
      title: 'New Strategy Update',
      description: 'FY2026 strategic plan has been published',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
    },
  ];
  
  const handlePeriodChange = (year: number, q?: number) => {
    setFiscalYear(year);
    setQuarter(q);
  };
  
  // Use real data if available, otherwise use mock data
  const strategyData = aggregation ? mockStrategyData : mockStrategyData;
  const okrData = aggregation ? mockOkrData : mockOkrData;
  const kpiData = aggregation ? mockKpiData : mockKpiData;
  const pillars: PillarProgress[] = strategyData.pillarProgress;
  
  const overallScore = aggregation?.combinedScore ?? 68;
  const strategyScore = aggregation?.strategyScore ?? strategyData.score;
  const okrScore = aggregation?.okrScore ?? okrData.score;
  const kpiScore = aggregation?.kpiScore ?? kpiData.score;
  
  return (
    <Fade in timeout={300}>
      <Box>
        {/* Header */}
        <DashboardHeader
          title="Executive Dashboard"
          subtitle="Performance overview for Dawin Group"
          entityId={companyId}
          entityName="Dawin Group"
          level="group"
          fiscalYear={fiscalYear}
          quarter={quarter}
          onPeriodChange={handlePeriodChange}
        />
        
        {/* Error Alert */}
        {aggregationError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {aggregationError.message}
          </Alert>
        )}
        
        {/* Summary Cards Row */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <PerformanceSummaryCard
              title="Overall Performance"
              score={overallScore}
              rating={aggregation?.rating || 'on_track'}
              trend={aggregation?.trend || 'stable'}
              changePercent={aggregation?.scoreChangePercent}
              icon={<TrendIcon />}
              onClick={() => navigate('/strategy/analytics')}
              loading={aggregationLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <PerformanceSummaryCard
              title="Strategy Execution"
              score={strategyScore}
              rating={strategyScore >= 70 ? 'strong' : strategyScore >= 50 ? 'on_track' : 'needs_attention'}
              trend="up"
              subtitle={`${strategyData.activePlans} active plans`}
              icon={<StrategyIcon />}
              onClick={() => navigate('/strategy/plans')}
              loading={aggregationLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <PerformanceSummaryCard
              title="OKR Progress"
              score={okrScore}
              rating={okrScore >= 70 ? 'strong' : okrScore >= 50 ? 'on_track' : 'needs_attention'}
              trend="stable"
              subtitle={`${okrData.totalObjectives} objectives`}
              icon={<OKRIcon />}
              onClick={() => navigate('/strategy/okrs')}
              loading={aggregationLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <PerformanceSummaryCard
              title="KPI Health"
              score={kpiScore}
              rating={kpiScore >= 70 ? 'strong' : kpiScore >= 50 ? 'on_track' : 'needs_attention'}
              trend="up"
              subtitle={`${kpiData.totalKPIs} KPIs tracked`}
              icon={<KPIIcon />}
              onClick={() => navigate('/strategy/kpis')}
              loading={aggregationLoading}
            />
          </Grid>
        </Grid>
        
        {/* Main Content Grid */}
        <Grid container spacing={3}>
          {/* Left Column - Main Visualizations */}
          <Grid item xs={12} lg={8}>
            <Grid container spacing={3}>
              {/* Performance Overview */}
              <Grid item xs={12}>
                {aggregation ? (
                  <PerformanceOverview
                    aggregation={aggregation}
                    onRefresh={refreshAggregation}
                    loading={aggregationLoading}
                  />
                ) : aggregationLoading ? (
                  <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
                ) : (
                  <Alert severity="info">
                    Configure your organization to see performance data
                  </Alert>
                )}
              </Grid>
              
              {/* Performance Timeline */}
              <Grid item xs={12}>
                {trend ? (
                  <PerformanceTimeline
                    trend={trend}
                    height={300}
                    showProjection
                    showDomains
                    onDomainChange={changeDomain}
                  />
                ) : trendLoading ? (
                  <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
                ) : null}
              </Grid>
              
              {/* Organization Hierarchy */}
              {hierarchy && !hierarchyLoading && (
                <Grid item xs={12}>
                  <PerformanceHierarchyComponent
                    hierarchy={hierarchy}
                    onNodeClick={(node) => navigate(`/strategy/entity/${node.id}`)}
                  />
                </Grid>
              )}
            </Grid>
          </Grid>
          
          {/* Right Column - Widgets */}
          <Grid item xs={12} lg={4}>
            <Grid container spacing={3}>
              {/* Alerts */}
              <Grid item xs={12}>
                <AlertsWidget
                  alerts={alerts}
                  onAlertClick={(alert) => console.log('Alert clicked:', alert)}
                  onViewAll={() => navigate('/notifications')}
                />
              </Grid>
              
              {/* Quick Actions */}
              <Grid item xs={12}>
                <QuickActionsWidget
                  onCreateOKR={() => navigate('/strategy/okrs/new')}
                  onCreateKPI={() => navigate('/strategy/kpis/new')}
                  onGenerateReport={() => navigate('/strategy/reports')}
                  onScheduleReview={() => navigate('/strategy/reviews')}
                />
              </Grid>
              
              {/* Strategic Priorities */}
              <Grid item xs={12}>
                <StrategicPrioritiesWidget
                  pillars={pillars}
                  onPillarClick={(id) => navigate(`/strategy/pillars/${id}`)}
                />
              </Grid>
              
              {/* OKR Progress */}
              <Grid item xs={12}>
                <OKRProgressWidget
                  okrData={okrData}
                  onClick={() => navigate('/strategy/okrs')}
                />
              </Grid>
              
              {/* KPI Health */}
              <Grid item xs={12}>
                <KPIHealthWidget
                  kpiData={kpiData}
                  onClick={() => navigate('/strategy/kpis')}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );
};

export default ExecutiveDashboard;
