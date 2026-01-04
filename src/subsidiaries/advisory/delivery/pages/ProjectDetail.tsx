/**
 * Project Detail - Comprehensive project view with tabs
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { ProjectHeader } from '../components/projects/ProjectHeader';
import { ProjectTabs, ProjectTabId } from '../components/projects/ProjectTabs';
import { StatCard } from '../components/common/MetricCard';
import { ProgressBar, DualProgressBar } from '../components/common/ProgressBar';
import { SCurveChart } from '../components/charts/SCurveChart';
import { SimpleBudgetBar } from '../components/charts/BudgetBarChart';
import { Project } from '../types/project';

export function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const [activeTab, setActiveTab] = useState<ProjectTabId>('overview');
  const [loading] = useState(false);

  // Mock project data - cast to avoid strict type checking on demo data
  const project: Project | null = projectId ? ({
    id: projectId,
    programId: 'prg-1',
    projectCode: 'ARISE-001',
    name: 'Rushoroza Health Center IV',
    description: 'Construction of a new Health Center IV facility including OPD, maternity ward, and staff quarters.',
    status: 'active',
    implementationType: 'contractor',
    projectType: 'new_construction',
    location: {
      siteName: 'Rushoroza HC IV',
      region: 'Western Region',
      district: 'Rukungiri',
    },
    budget: {
      totalBudget: 450000000,
      currency: 'UGX',
      committed: 280000000,
      spent: 180000000,
      remaining: 270000000,
      varianceStatus: 'on_budget',
    },
    progress: {
      physicalProgress: 65,
      financialProgress: 40,
      progressStatus: 'on_track',
    },
    timeline: {
      currentStartDate: new Date('2024-01-15'),
      currentEndDate: new Date('2024-12-15'),
      currentDuration: 335,
      isDelayed: false,
      delayDays: 0,
      daysRemaining: 180,
      percentTimeElapsed: 46,
      milestones: [],
    },
    contractor: {
      companyName: 'ABC Contractors Ltd',
      contactPerson: {
        name: 'John Smith',
        role: 'Project Manager',
      },
      contractNumber: 'CON-2024-001',
      contractValue: 420000000,
    },
  } as unknown as Project) : null;

  // Mock S-curve data
  const scurveData = Array.from({ length: 20 }, (_, i) => ({
    weekNumber: i + 1,
    weekStartDate: new Date(2024, 0, 15 + i * 7),
    plannedCumulative: Math.min(100, (i + 1) * 5),
    plannedIncremental: 5,
    actualCumulative: i < 13 ? Math.min(100, (i + 1) * 5 + Math.random() * 5 - 2) : undefined,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium text-gray-900">Project not found</h2>
        <p className="text-gray-600 mt-2">The project you're looking for doesn't exist.</p>
        <Link to="/advisory/delivery/projects" className="text-primary hover:underline mt-4 inline-block">
          ← Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb */}
      <Link 
        to="/advisory/delivery/projects" 
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to Projects
      </Link>

      {/* Header */}
      <ProjectHeader project={project} />

      {/* Tabs */}
      <ProjectTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div className="bg-white rounded-lg border">
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard 
                label="Physical Progress" 
                value={`${project.progress.physicalProgress}%`}
                variant={project.progress.progressStatus === 'on_track' ? 'success' : 'warning'}
              />
              <StatCard 
                label="Financial Progress" 
                value={`${project.progress.financialProgress}%`} 
              />
              <StatCard 
                label="Days Remaining" 
                value={project.timeline.daysRemaining} 
              />
              <StatCard 
                label="Budget Status" 
                value={project.budget.varianceStatus.replace('_', ' ')}
                variant={project.budget.varianceStatus === 'on_budget' ? 'success' : 'warning'}
              />
            </div>
            
            {/* Progress section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Progress Overview</h3>
                <DualProgressBar
                  physical={project.progress.physicalProgress}
                  financial={project.progress.financialProgress}
                />
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Budget Utilization</h3>
                <SimpleBudgetBar
                  allocated={project.budget.totalBudget}
                  spent={project.budget.spent}
                  committed={project.budget.committed}
                  currency={project.budget.currency}
                  compact
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="p-6 space-y-6">
            <SCurveChart data={scurveData} currentWeek={13} height={350} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Physical Progress</h3>
                <ProgressBar 
                  value={project.progress.physicalProgress}
                  status={project.progress.progressStatus}
                  size="lg"
                  showLabel
                />
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Financial Progress</h3>
                <ProgressBar 
                  value={project.progress.financialProgress}
                  size="lg"
                  showLabel
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Budget Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard label="Total Budget" value={`UGX ${(project.budget.totalBudget / 1000000).toFixed(0)}M`} />
              <StatCard label="Spent" value={`UGX ${(project.budget.spent / 1000000).toFixed(0)}M`} />
              <StatCard label="Committed" value={`UGX ${(project.budget.committed / 1000000).toFixed(0)}M`} />
              <StatCard label="Remaining" value={`UGX ${(project.budget.remaining / 1000000).toFixed(0)}M`} variant="success" />
            </div>
            <SimpleBudgetBar
              allocated={project.budget.totalBudget}
              spent={project.budget.spent}
              committed={project.budget.committed}
              currency={project.budget.currency}
            />
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Timeline</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard 
                label="Start Date" 
                value={new Date(project.timeline.currentStartDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} 
              />
              <StatCard 
                label="End Date" 
                value={new Date(project.timeline.currentEndDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} 
              />
              <StatCard label="Duration" value={`${project.timeline.currentDuration} days`} />
              <StatCard 
                label="Time Elapsed" 
                value={`${project.timeline.percentTimeElapsed}%`} 
              />
            </div>
            
            {project.timeline.isDelayed && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                ⚠️ Project is delayed by {project.timeline.delayDays} days
              </div>
            )}
          </div>
        )}

        {activeTab === 'team' && (
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">
              {project.implementationType === 'contractor' ? 'Contractor' : 'Site Team'}
            </h3>
            
            {project.contractor && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="font-medium text-lg">{project.contractor.companyName}</div>
                <div className="text-gray-600 mt-1">Contract: {project.contractor.contractNumber}</div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <div className="text-sm text-gray-500">Contact Person</div>
                    <div className="font-medium">{project.contractor.contactPerson.name}</div>
                    <div className="text-sm text-gray-600">{project.contractor.contactPerson.role}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Contract Value</div>
                    <div className="font-medium">
                      UGX {(project.contractor.contractValue / 1000000).toFixed(0)}M
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {(activeTab === 'scope' || activeTab === 'documents') && (
          <div className="p-6 text-center text-gray-500">
            <p>Content for {activeTab} tab coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
