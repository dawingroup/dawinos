/**
 * Design Dashboard
 * Main dashboard for the Design Manager module
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderOpen, AlertCircle, CheckCircle, Clock, TrendingUp, Trash2, MoreVertical } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import type { DesignProject, DesignStage } from '../../types';
import { subscribeToProjects, deleteProject } from '../../services/firestore';
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d1d1f]"></div>
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
          className="flex items-center gap-2 px-4 py-2 bg-[#1d1d1f] text-white rounded-lg hover:bg-[#424245] transition-colors"
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
              className="mt-4 text-[#1d1d1f] font-medium hover:underline"
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
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const statusColors = {
    active: 'bg-green-100 text-green-700',
    'on-hold': 'bg-amber-100 text-amber-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-gray-100 text-gray-700',
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleting(true);
    try {
      await deleteProject(project.id);
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="relative">
      <Link
        to={`project/${project.id}`}
        className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#1d1d1f] rounded-lg flex items-center justify-center">
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
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </Link>

      {/* Dropdown Menu */}
      {showMenu && (
        <div 
          className="absolute right-4 top-12 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 min-w-[120px]"
          onMouseLeave={() => setShowMenu(false)}
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowMenu(false);
              setShowDeleteConfirm(true);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Project?</h3>
            <p className="text-gray-600 mb-4">
              This will permanently delete <strong>{project.name}</strong> and all its design items. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
