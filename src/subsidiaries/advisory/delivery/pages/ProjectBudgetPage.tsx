/**
 * Project Budget Page
 * Detailed budget breakdown and utilization
 */

import { useOutletContext } from 'react-router-dom';
import { StatCard } from '../components/common/MetricCard';
import { SimpleBudgetBar } from '../components/charts/BudgetBarChart';
import type { ProjectOutletContext } from '../components/projects/ProjectLayout';

export function ProjectBudgetPage() {
  const { project } = useOutletContext<ProjectOutletContext>();

  return (
    <div className="p-6 space-y-6">
      <h3 className="text-lg font-medium">Budget Details</h3>

      {/* Budget Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Budget"
          value={`UGX ${(project.budget.totalBudget / 1000000).toFixed(0)}M`}
        />
        <StatCard
          label="Spent"
          value={`UGX ${(project.budget.spent / 1000000).toFixed(0)}M`}
        />
        <StatCard
          label="Committed"
          value={`UGX ${(project.budget.committed / 1000000).toFixed(0)}M`}
        />
        <StatCard
          label="Remaining"
          value={`UGX ${(project.budget.remaining / 1000000).toFixed(0)}M`}
          variant="success"
        />
      </div>

      {/* Budget Bar Chart */}
      <SimpleBudgetBar
        allocated={project.budget.totalBudget}
        spent={project.budget.spent}
        committed={project.budget.committed}
        currency={project.budget.currency}
      />
    </div>
  );
}

export default ProjectBudgetPage;
