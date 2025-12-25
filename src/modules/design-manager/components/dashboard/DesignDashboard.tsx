/**
 * Design Dashboard
 * Main dashboard for the Design Manager module
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderOpen, AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useAuth } from '@/shared/hooks';
import type { DesignProject, DesignStage } from '../../types';
import { subscribeToProjects } from '../../services/firestore';
import { STAGE_LABELS, STAGE_ICONS } from '../../utils/formatting';
import { STAGE_ORDER } from '../../utils/stage-gate';
import { NewProjectDialog } from '../project/NewProjectDialog';
import { useEffect } from 'react';

export default function DesignDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<DesignProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToProjects((data) => {
      setProjects(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
        <h2 className="text-lg font-medium text-gray-900">Sign in Required</h2>
        <p className="text-gray-600 mt-1">Please sign in to access the Design Manager.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A7C8E]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Design Manager</h1>
          <p className="text-gray-600 mt-1">
            Track designs through manufacturing stages with traffic light status
          </p>
        </div>
        <button
          onClick={() => setShowNewProject(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0A7C8E] text-white rounded-lg hover:bg-[#086a7a] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<FolderOpen className="w-5 h-5" />}
          label="Active Projects"
          value={projects.filter(p => p.status === 'active').length}
          color="bg-blue-500"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="In Progress"
          value={projects.filter(p => p.status === 'active').length}
          color="bg-amber-500"
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5" />}
          label="Completed"
          value={projects.filter(p => p.status === 'completed').length}
          color="bg-green-500"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="This Month"
          value={projects.length}
          color="bg-purple-500"
        />
      </div>

      {/* Stage Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Workflow Stages</h2>
        <div className="grid grid-cols-5 gap-2">
          {STAGE_ORDER.map((stage) => (
            <StageColumn key={stage} stage={stage} />
          ))}
        </div>
      </div>

      {/* Projects List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
        </div>
        
        {projects.length === 0 ? (
          <div className="p-8 text-center">
            <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No projects yet</p>
            <button
              onClick={() => setShowNewProject(true)}
              className="mt-4 text-[#0A7C8E] hover:underline"
            >
              Create your first project
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {projects.map((project) => (
              <ProjectRow key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>

      {/* New Project Dialog */}
      <NewProjectDialog
        open={showNewProject}
        onClose={() => setShowNewProject(false)}
        userId={user?.email || ''}
      />
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={cn('p-2 rounded-lg text-white', color)}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

interface StageColumnProps {
  stage: DesignStage;
}

function StageColumn({ stage }: StageColumnProps) {
  return (
    <div className="text-center p-3 bg-gray-50 rounded-lg">
      <span className="text-2xl">{STAGE_ICONS[stage]}</span>
      <p className="text-xs font-medium text-gray-700 mt-1">{STAGE_LABELS[stage]}</p>
    </div>
  );
}

interface ProjectRowProps {
  project: DesignProject;
}

function ProjectRow({ project }: ProjectRowProps) {
  const statusColors = {
    active: 'bg-green-100 text-green-700',
    'on-hold': 'bg-amber-100 text-amber-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-gray-100 text-gray-700',
  };

  return (
    <Link
      to={`project/${project.id}`}
      className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-[#0A7C8E] rounded-lg flex items-center justify-center">
          <FolderOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{project.name}</h3>
          <p className="text-sm text-gray-500">{project.code}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {project.customerName && (
          <span className="text-sm text-gray-500">{project.customerName}</span>
        )}
        <span className={cn(
          'text-xs px-2 py-1 rounded-full font-medium',
          statusColors[project.status]
        )}>
          {project.status}
        </span>
      </div>
    </Link>
  );
}
