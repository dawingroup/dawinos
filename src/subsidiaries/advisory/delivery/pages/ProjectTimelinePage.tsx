/**
 * Project Timeline Page
 * Timeline details and schedule information
 */

import { useOutletContext } from 'react-router-dom';
import { StatCard } from '../components/common/MetricCard';
import type { ProjectOutletContext } from '../components/projects/ProjectLayout';

export function ProjectTimelinePage() {
  const { project } = useOutletContext<ProjectOutletContext>();

  return (
    <div className="p-6 space-y-6">
      <h3 className="text-lg font-medium">Timeline</h3>

      {/* Timeline Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Start Date"
          value={new Date(project.timeline.currentStartDate).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        />
        <StatCard
          label="End Date"
          value={new Date(project.timeline.currentEndDate).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        />
        <StatCard
          label="Duration"
          value={`${project.timeline.currentDuration} days`}
        />
        <StatCard
          label="Time Elapsed"
          value={`${project.timeline.percentTimeElapsed}%`}
        />
      </div>

      {/* Delay Warning */}
      {project.timeline.isDelayed && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
          ⚠️ Project is delayed by {project.timeline.delayDays} days
        </div>
      )}
    </div>
  );
}

export default ProjectTimelinePage;
