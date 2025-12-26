/**
 * Project View
 * Project detail page with design items
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, LayoutGrid, List, FolderOpen, Calendar, User, Clock, CheckCircle, AlertTriangle, Package, Edit2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useAuth } from '@/shared/hooks';
import { useProject, useDesignItems } from '../../hooks';
import { ProjectDialog } from './ProjectDialog';
import type { DesignStage, DesignCategory } from '../../types';
import { STAGE_LABELS, CATEGORY_LABELS } from '../../utils/formatting';
import { STAGE_ORDER } from '../../utils/stage-gate';
import { DesignItemCard } from '../design-item/DesignItemCard';
import { NewDesignItemDialog } from '../design-item/NewDesignItemDialog';
import { StageKanban } from '../dashboard/StageKanban';

type ViewMode = 'kanban' | 'list';

export default function ProjectView() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const { project, loading: projectLoading } = useProject(projectId);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [stageFilter, setStageFilter] = useState<DesignStage | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<DesignCategory | 'all'>('all');
  const [showNewItem, setShowNewItem] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);

  const { items, loading: itemsLoading } = useDesignItems(projectId, {
    stage: stageFilter === 'all' ? undefined : stageFilter,
    category: categoryFilter === 'all' ? undefined : categoryFilter,
  });

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d1d1f]"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h2 className="text-lg font-medium text-gray-900">Project not found</h2>
        <Link to="/design" className="text-[#1d1d1f] hover:underline mt-2 inline-block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // Calculate project statistics
  const stats = {
    total: items.length,
    inProgress: items.filter(i => i.currentStage !== 'production-ready').length,
    productionReady: items.filter(i => i.currentStage === 'production-ready').length,
    needsAttention: items.filter(i => i.overallReadiness < 50 || i.priority === 'urgent').length,
    avgReadiness: items.length > 0 
      ? Math.round(items.reduce((sum, i) => sum + i.overallReadiness, 0) / items.length)
      : 0,
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Not set';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
    'active': { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
    'on-hold': { bg: 'bg-amber-100', text: 'text-amber-800', label: 'On Hold' },
    'completed': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Completed' },
    'cancelled': { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
  };

  const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG['active'];

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link
            to="/design"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {project.code}
              </span>
              <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', statusConfig.bg, statusConfig.text)}>
                {statusConfig.label}
              </span>
            </div>
            {project.customerName && (
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <User className="w-4 h-4" />
                {project.customerName}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEditProject(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Edit Project
          </button>
          <button
            onClick={() => setShowNewItem(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Design Item
          </button>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-blue-500" />
            <p className="text-sm font-medium text-gray-600">Total Items</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500">Design items</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <p className="text-sm font-medium text-gray-600">In Progress</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
          <p className="text-xs text-gray-500">Across all stages</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 border-l-4 border-l-green-500">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <p className="text-sm font-medium text-gray-600">Production Ready</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.productionReady}</p>
          <p className="text-xs text-gray-500">Ready to manufacture</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 border-l-4 border-l-red-500">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <p className="text-sm font-medium text-gray-600">Needs Attention</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.needsAttention}</p>
          <p className="text-xs text-gray-500">Critical items</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 border-l-4 border-l-primary">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-gray-600">Avg Readiness</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.avgReadiness}%</p>
          <p className="text-xs text-gray-500">Overall progress</p>
        </div>
      </div>

      {/* Project Details Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Project Details</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {project.description && (
            <div className="col-span-2 lg:col-span-4">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Description</h3>
              <p className="text-sm text-gray-900">{project.description}</p>
            </div>
          )}
          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Start Date</h3>
            <p className="text-sm text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              {formatDate(project.startDate)}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Due Date</h3>
            <p className="text-sm text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              {formatDate(project.dueDate)}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Created</h3>
            <p className="text-sm text-gray-900">{formatDate(project.createdAt)}</p>
            <p className="text-xs text-gray-500">by {project.createdBy}</p>
          </div>
          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Last Updated</h3>
            <p className="text-sm text-gray-900">{formatDate(project.updatedAt)}</p>
            <p className="text-xs text-gray-500">by {project.updatedBy}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="flex items-center gap-4">
          {/* Stage Filter */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as DesignStage | 'all')}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="all">All Stages</option>
            {STAGE_ORDER.map((stage) => (
              <option key={stage} value={stage}>{STAGE_LABELS[stage]}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as DesignCategory | 'all')}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <span className="text-sm text-gray-500">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* View Toggle */}
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('kanban')}
            className={cn(
              'p-2 transition-colors',
              viewMode === 'kanban' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
            )}
            title="Kanban View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-2 transition-colors',
              viewMode === 'list' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
            )}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {itemsLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d1d1f]"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No design items yet</h3>
          <p className="text-gray-500 mt-1">Create your first design item to get started.</p>
          <button
            onClick={() => setShowNewItem(true)}
            className="mt-4 text-[#1d1d1f] hover:underline"
          >
            Add Design Item
          </button>
        </div>
      ) : viewMode === 'kanban' ? (
        <StageKanban items={items} projectId={projectId!} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Link key={item.id} to={`item/${item.id}`}>
              <DesignItemCard item={item} />
            </Link>
          ))}
        </div>
      )}

      {/* New Item Dialog */}
      <NewDesignItemDialog
        open={showNewItem}
        onClose={() => setShowNewItem(false)}
        projectId={projectId!}
        projectCode={project.code}
        userId={user?.email || ''}
      />

      {/* Edit Project Dialog */}
      <ProjectDialog
        open={showEditProject}
        onClose={() => setShowEditProject(false)}
        userId={user?.email || ''}
        project={project}
      />
    </div>
  );
}
