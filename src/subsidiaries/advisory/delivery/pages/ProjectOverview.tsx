/**
 * Project Overview Page
 * Dashboard view showing key project metrics and status
 */

import { useOutletContext } from 'react-router-dom';
import { StatCard } from '../components/common/MetricCard';
import { DualProgressBar } from '../components/common/ProgressBar';
import { SimpleBudgetBar } from '../components/charts/BudgetBarChart';
import type { ProjectOutletContext } from '../components/projects/ProjectLayout';

export function ProjectOverview() {
  const { project } = useOutletContext<ProjectOutletContext>();

  return (
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
  );
}

export default ProjectOverview;
