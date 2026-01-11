// ============================================================================
// CAPITAL DASHBOARD PAGE
// DawinOS v2.0 - Capital Hub Module
// Main dashboard for capital management overview
// ============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Briefcase, 
  Users, 
  TrendingUp, 
  Plus,
  FileText,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Skeleton } from '@/core/components/ui/skeleton';

import { useCapitalDashboard } from '../hooks/useCapitalDashboard';
import { CapitalOverviewCard } from '../components/dashboard/CapitalOverviewCard';
import { PipelineMetrics } from '../components/dashboard/PipelineMetrics';
import { FundPerformanceChart } from '../components/dashboard/FundPerformanceChart';
import { RecentActivityFeed } from '../components/dashboard/RecentActivityFeed';
import { formatCurrency } from '../components/shared/CurrencyDisplay';
import { MODULE_COLOR } from '../constants';

const CapitalDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const {
    overview,
    pipelineMetrics,
    fundPerformance,
    recentActivities,
    loading,
  } = useCapitalDashboard();

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Capital Hub</h1>
          <p className="text-muted-foreground">
            Manage investments, deals, and investor relationships
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/capital/reports')}
          >
            <FileText className="h-4 w-4 mr-2" />
            LP Reports
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

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CapitalOverviewCard
          title="Active Funds"
          value={overview?.activeFunds || 0}
          subtitle={`${formatCurrency(overview?.totalAUM || 0, 'USD', true)} AUM`}
          icon={<Building2 className="h-5 w-5" />}
          color={MODULE_COLOR}
          trend={overview?.aumGrowth}
          trendLabel="vs last quarter"
          onClick={() => navigate('/capital/funds')}
        />
        <CapitalOverviewCard
          title="Active Deals"
          value={overview?.activeDeals || 0}
          subtitle={`${formatCurrency(overview?.pipelineValue || 0, 'USD', true)} pipeline`}
          icon={<Briefcase className="h-5 w-5" />}
          color="#2196F3"
          trend={overview?.dealGrowth}
          trendLabel="vs last month"
          onClick={() => navigate('/capital/deals')}
        />
        <CapitalOverviewCard
          title="Investor Relationships"
          value={overview?.totalInvestors || 0}
          subtitle={`${overview?.activeCommitments || 0} active commitments`}
          icon={<Users className="h-5 w-5" />}
          color="#4CAF50"
          onClick={() => navigate('/capital/investors')}
        />
        <CapitalOverviewCard
          title="Portfolio IRR"
          value={`${((overview?.portfolioIRR || 0) * 100).toFixed(1)}%`}
          subtitle={`${(overview?.portfolioMOIC || 0).toFixed(2)}x MOIC`}
          icon={<TrendingUp className="h-5 w-5" />}
          color="#FF9800"
          trend={overview?.irrChange}
          trendLabel="vs target"
          onClick={() => navigate('/capital/portfolio')}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Fund Performance</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PipelineMetrics
              metrics={pipelineMetrics || []}
              totalValue={overview?.pipelineValue || 0}
            />
            <RecentActivityFeed activities={recentActivities || []} />
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          <FundPerformanceChart
            data={fundPerformance || []}
            fundName={overview?.primaryFundName || 'Fund I'}
          />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <RecentActivityFeed activities={recentActivities || []} />
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <Button
              variant="outline"
              className="h-auto py-4 flex-col"
              onClick={() => navigate('/capital/deals')}
            >
              <Briefcase className="h-5 w-5 mb-1" />
              <span className="text-xs">View Deals</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col"
              onClick={() => navigate('/capital/investors')}
            >
              <Users className="h-5 w-5 mb-1" />
              <span className="text-xs">Investors</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col"
              onClick={() => navigate('/capital/portfolio')}
            >
              <TrendingUp className="h-5 w-5 mb-1" />
              <span className="text-xs">Portfolio</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col"
              onClick={() => navigate('/capital/funds')}
            >
              <Building2 className="h-5 w-5 mb-1" />
              <span className="text-xs">Funds</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col"
              onClick={() => navigate('/capital/models')}
            >
              <FileText className="h-5 w-5 mb-1" />
              <span className="text-xs">Models</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col"
              onClick={() => navigate('/capital/tax')}
            >
              <FileText className="h-5 w-5 mb-1" />
              <span className="text-xs">Tax</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CapitalDashboardPage;
