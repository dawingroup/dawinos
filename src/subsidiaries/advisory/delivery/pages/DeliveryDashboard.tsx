/**
 * Delivery Dashboard - Portfolio overview for program managers
 * Styled to match Finishes Design Manager patterns
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useAllPrograms } from '../hooks/program-hooks';
import { useAllProjects } from '../hooks/project-hooks';
import { usePendingApprovals } from '../hooks/payment-hooks';
import { db } from '@/core/services/firebase';
import { ColoredStatsCard } from '@/shared/components/data-display';
import { BaseCard, InteractiveCard } from '@/shared/components/cards';

export function DeliveryDashboard() {
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);

  // Fetch real data
  const { programs, loading: programsLoading } = useAllPrograms(db, {});
  const { projects, loading: projectsLoading } = useAllProjects(db, {});
  const { approvals } = usePendingApprovals(db, 'project_manager', { realtime: true });

  const loading = programsLoading || projectsLoading;

  // Calculate stats from real data
  const stats = useMemo(() => {
    const filteredProjects = selectedProgramId 
      ? projects.filter(p => p.programId === selectedProgramId)
      : projects;

    const activeProjects = filteredProjects.filter(p => 
      ['active', 'in_progress', 'mobilization'].includes(p.status)
    ).length;
    
    const completedProjects = filteredProjects.filter(p => p.status === 'completed').length;
    
    const delayedProjects = filteredProjects.filter(p => 
      p.timeline?.isDelayed || 
      ['slightly_behind', 'significantly_behind', 'critical'].includes(p.progress?.progressStatus || '')
    ).length;

    const totalBudget = filteredProjects.reduce((sum, p) => sum + (p.budget?.totalBudget || 0), 0);
    const totalSpent = filteredProjects.reduce((sum, p) => sum + (p.budget?.spent || 0), 0);
    
    const avgProgress = filteredProjects.length > 0
      ? Math.round(filteredProjects.reduce((sum, p) => sum + (p.progress?.physicalProgress || 0), 0) / filteredProjects.length)
      : 0;

    return {
      totalPrograms: programs.length,
      totalProjects: filteredProjects.length,
      activeProjects,
      completedProjects,
      delayedProjects,
      totalBudget,
      totalSpent,
      avgProgress,
      pendingApprovals: approvals.length,
    };
  }, [programs, projects, approvals, selectedProgramId]);

  // Top projects by progress
  const topProjects = useMemo(() => {
    const filteredProjects = selectedProgramId 
      ? projects.filter(p => p.programId === selectedProgramId)
      : projects;

    return filteredProjects
      .filter(p => p.status !== 'completed')
      .sort((a, b) => (b.progress?.physicalProgress || 0) - (a.progress?.physicalProgress || 0))
      .slice(0, 4);
  }, [projects, selectedProgramId]);

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000000) return `UGX ${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `UGX ${(amount / 1000000).toFixed(1)}M`;
    return `UGX ${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Infrastructure Delivery</h1>
          <p className="text-gray-600">
            {stats.totalPrograms} active programs • {stats.totalProjects} projects
          </p>
        </div>
        
        <select 
          className="px-3 py-2 border rounded-lg bg-white"
          value={selectedProgramId || 'all'}
          onChange={(e) => setSelectedProgramId(e.target.value === 'all' ? null : e.target.value)}
        >
          <option value="all">All Programs</option>
          {programs.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Portfolio Summary Cards - Using ColoredStatsCard */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <ColoredStatsCard
          icon={Building2}
          label="Total Projects"
          value={stats.totalProjects}
          subtitle="All projects"
          color="blue"
        />

        <ColoredStatsCard
          icon={Clock}
          label="Active"
          value={stats.activeProjects}
          subtitle="In progress"
          color="amber"
        />

        <ColoredStatsCard
          icon={CheckCircle}
          label="Completed"
          value={stats.completedProjects}
          subtitle="Finished"
          color="green"
        />

        <ColoredStatsCard
          icon={DollarSign}
          label="Total Budget"
          value={formatCurrency(stats.totalBudget)}
          subtitle="Allocated"
          color="primary"
        />

        <ColoredStatsCard
          icon={TrendingUp}
          label="Avg. Progress"
          value={`${stats.avgProgress}%`}
          subtitle="Completion"
          color="indigo"
        />

        <ColoredStatsCard
          icon={AlertTriangle}
          label="Delayed"
          value={stats.delayedProjects}
          subtitle="Need attention"
          color="red"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects Overview */}
        <BaseCard padding="lg" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Projects Overview</h2>
            <Link
              to="/advisory/delivery/projects"
              className="text-primary text-sm hover:underline flex items-center"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {topProjects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No active projects</p>
              </div>
            ) : (
              topProjects.map(project => (
                <InteractiveCard
                  key={project.id}
                  to={`/advisory/delivery/projects/${project.id}`}
                  padding="sm"
                  hoverBorderColor="hover:border-blue-200"
                  className="flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-gray-900">{project.name}</div>
                    <div className="text-sm text-gray-500">
                      {project.location?.district || 'Location TBD'} • {project.location?.region || ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{project.progress?.physicalProgress || 0}%</div>
                    <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                      <div
                        className={`h-full rounded-full ${
                          project.progress?.progressStatus === 'on_track' || project.progress?.progressStatus === 'ahead'
                            ? 'bg-green-500'
                            : project.progress?.progressStatus === 'slightly_behind'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${project.progress?.physicalProgress || 0}%` }}
                      />
                    </div>
                  </div>
                </InteractiveCard>
              ))
            )}
          </div>
        </BaseCard>

        {/* Budget Chart */}
        <BaseCard padding="lg">
          <h2 className="text-lg font-medium mb-4">Budget Overview</h2>

          <div className="space-y-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(stats.totalBudget)}
              </div>
              <div className="text-sm text-gray-500">Total Budget</div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Utilized</span>
                <span className="font-medium">
                  {stats.totalBudget > 0 ? ((stats.totalSpent / stats.totalBudget) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${stats.totalBudget > 0 ? (stats.totalSpent / stats.totalBudget) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">
                  {formatCurrency(stats.totalSpent)}
                </div>
                <div className="text-xs text-gray-500">Spent</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {formatCurrency(stats.totalBudget - stats.totalSpent)}
                </div>
                <div className="text-xs text-gray-500">Remaining</div>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InteractiveCard to="/advisory/delivery/projects" hoverBorderColor="hover:border-blue-200">
          <Building2 className="w-8 h-8 text-blue-500 mb-2" />
          <div className="font-medium">All Projects</div>
          <div className="text-sm text-gray-500">View and manage projects</div>
        </InteractiveCard>

        <InteractiveCard to="/advisory/delivery/approvals" hoverBorderColor="hover:border-green-200">
          <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
          <div className="font-medium">Approvals</div>
          <div className="text-sm text-gray-500">
            {stats.pendingApprovals > 0
              ? `${stats.pendingApprovals} pending approval${stats.pendingApprovals !== 1 ? 's' : ''}`
              : 'No pending approvals'}
          </div>
        </InteractiveCard>

        <InteractiveCard to="/advisory/delivery/programs" hoverBorderColor="hover:border-indigo-200">
          <TrendingUp className="w-8 h-8 text-indigo-500 mb-2" />
          <div className="font-medium">Programs</div>
          <div className="text-sm text-gray-500">Program management</div>
        </InteractiveCard>

        <InteractiveCard to="/advisory/delivery/reports" hoverBorderColor="hover:border-primary/30">
          <DollarSign className="w-8 h-8 text-primary mb-2" />
          <div className="font-medium">Reports</div>
          <div className="text-sm text-gray-500">Generate reports</div>
        </InteractiveCard>
      </div>
    </div>
  );
}
