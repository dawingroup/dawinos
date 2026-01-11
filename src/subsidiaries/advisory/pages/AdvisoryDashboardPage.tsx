/**
 * Advisory Dashboard Page
 * DawinOS v2.0 - Dawin Advisory
 * Main dashboard with Capital Hub-style UI patterns
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  HardHat,
  Building2,
  Users,
  TrendingUp,
  DollarSign,
  FolderKanban,
  FileText,
  Plus,
  BarChart3,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Skeleton } from '@/core/components/ui/skeleton';

import { AdvisoryOverviewCard } from '../components/dashboard/AdvisoryOverviewCard';
import { ModuleCard } from '../components/dashboard/ModuleCard';
import { RecentActivityFeed } from '../components/dashboard/RecentActivityFeed';
import { MODULE_COLOR, ADVISORY_MODULES } from '../constants';

const AdvisoryDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading] = useState(false);

  // Mock data - would come from hooks in production
  const dashboardData = useMemo(() => ({
    activeProjects: 12,
    projectsGrowth: 8.5,
    totalPipelineValue: 45000000,
    pipelineGrowth: 12.3,
    activeClients: 24,
    clientsGrowth: 4.2,
    deliveryProgress: 78,
    deliveryChange: 5.1,
  }), []);

  const moduleStats = useMemo(() => ({
    investment: {
      deals: 8,
      pipelineValue: '$45M',
    },
    matflow: {
      projects: 5,
      boqItems: 234,
    },
    delivery: {
      programs: 3,
      projects: 12,
    },
  }), []);

  const recentActivities = useMemo(() => [
    {
      id: '1',
      type: 'investment' as const,
      title: 'Kampala Hospital Expansion',
      subtitle: 'Deal moved to Due Diligence stage',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      link: '/advisory/investment/deals/1',
    },
    {
      id: '2',
      type: 'matflow' as const,
      title: 'BOQ Updated - Highway Project',
      subtitle: '15 new items added',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      link: '/advisory/matflow/boq/2',
    },
    {
      id: '3',
      type: 'delivery' as const,
      title: 'Milestone Completed',
      subtitle: 'Phase 2 foundation work completed',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
      link: '/advisory/delivery/projects/3',
    },
    {
      id: '4',
      type: 'investment' as const,
      title: 'New Deal Created',
      subtitle: 'Solar Farm Development - Jinja',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      link: '/advisory/investment/deals/4',
    },
    {
      id: '5',
      type: 'matflow' as const,
      title: 'Procurement Request Approved',
      subtitle: 'PR-2024-0056 - Cement supply',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
      link: '/advisory/matflow/procurement/5',
    },
  ], []);

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount}`;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
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
          <h1 className="text-2xl font-semibold">Advisory Overview</h1>
          <p className="text-muted-foreground">
            Construction consulting and project management
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/advisory/investment/reports')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Reports
          </Button>
          <Button
            onClick={() => navigate('/advisory/investment/deals/new')}
            style={{ backgroundColor: MODULE_COLOR }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Deal
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdvisoryOverviewCard
          title="Active Projects"
          value={dashboardData.activeProjects}
          subtitle="Across all modules"
          icon={<FolderKanban className="h-5 w-5" />}
          color={MODULE_COLOR}
          trend={dashboardData.projectsGrowth}
          trendLabel="vs last month"
          onClick={() => navigate('/advisory/matflow/projects')}
        />
        <AdvisoryOverviewCard
          title="Pipeline Value"
          value={formatCurrency(dashboardData.totalPipelineValue)}
          subtitle={`${moduleStats.investment.deals} active deals`}
          icon={<DollarSign className="h-5 w-5" />}
          color="#10b981"
          trend={dashboardData.pipelineGrowth}
          trendLabel="vs last quarter"
          onClick={() => navigate('/advisory/investment/pipeline')}
        />
        <AdvisoryOverviewCard
          title="Active Clients"
          value={dashboardData.activeClients}
          subtitle="Engaged clients"
          icon={<Users className="h-5 w-5" />}
          color="#3b82f6"
          trend={dashboardData.clientsGrowth}
          trendLabel="vs last month"
        />
        <AdvisoryOverviewCard
          title="Delivery Progress"
          value={`${dashboardData.deliveryProgress}%`}
          subtitle="Average completion"
          icon={<TrendingUp className="h-5 w-5" />}
          color="#8b5cf6"
          trend={dashboardData.deliveryChange}
          trendLabel="vs last month"
          onClick={() => navigate('/advisory/delivery')}
        />
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="overview">Modules</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ADVISORY_MODULES.map((module) => (
              <ModuleCard
                key={module.id}
                {...module}
                stats={
                  module.id === 'investment' 
                    ? [
                        { label: 'Deals', value: moduleStats.investment.deals },
                        { label: 'Pipeline', value: moduleStats.investment.pipelineValue },
                      ]
                    : module.id === 'matflow'
                    ? [
                        { label: 'Projects', value: moduleStats.matflow.projects },
                        { label: 'BOQ Items', value: moduleStats.matflow.boqItems },
                      ]
                    : [
                        { label: 'Programs', value: moduleStats.delivery.programs },
                        { label: 'Projects', value: moduleStats.delivery.projects },
                      ]
                }
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentActivityFeed activities={recentActivities} maxItems={10} />
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/advisory/investment/deals/new')}
                >
                  <Briefcase className="h-4 w-4 mr-3" />
                  Create New Deal
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/advisory/matflow/projects/new')}
                >
                  <HardHat className="h-4 w-4 mr-3" />
                  New MatFlow Project
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/advisory/delivery/projects/new')}
                >
                  <Building2 className="h-4 w-4 mr-3" />
                  New Delivery Project
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/advisory/matflow/boq/import')}
                >
                  <FileText className="h-4 w-4 mr-3" />
                  Import BOQ
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Investment Performance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-emerald-500" />
                  Investment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Active Deals</span>
                    <span className="font-semibold">{moduleStats.investment.deals}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Pipeline Value</span>
                    <span className="font-semibold">{moduleStats.investment.pipelineValue}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Win Rate</span>
                    <span className="font-semibold text-green-600">32%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg. Deal Size</span>
                    <span className="font-semibold">$5.2M</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* MatFlow Performance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <HardHat className="h-5 w-5 text-amber-500" />
                  MatFlow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Active Projects</span>
                    <span className="font-semibold">{moduleStats.matflow.projects}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">BOQ Items</span>
                    <span className="font-semibold">{moduleStats.matflow.boqItems}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Procurement Requests</span>
                    <span className="font-semibold">12</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Budget Utilization</span>
                    <span className="font-semibold text-blue-600">68%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Performance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-500" />
                  Delivery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Programs</span>
                    <span className="font-semibold">{moduleStats.delivery.programs}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Projects</span>
                    <span className="font-semibold">{moduleStats.delivery.projects}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">On Track</span>
                    <span className="font-semibold text-green-600">9</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">At Risk</span>
                    <span className="font-semibold text-amber-600">2</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvisoryDashboardPage;
