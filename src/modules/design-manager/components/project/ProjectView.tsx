/**
 * Project View
 * Project detail page with design items
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, LayoutGrid, List, FolderOpen } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useAuth } from '@/shared/hooks';
import { useProject, useDesignItems } from '../../hooks';
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

  const { items, loading: itemsLoading } = useDesignItems(projectId, {
    stage: stageFilter === 'all' ? undefined : stageFilter,
    category: categoryFilter === 'all' ? undefined : categoryFilter,
  });

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A7C8E]"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h2 className="text-lg font-medium text-gray-900">Project not found</h2>
        <Link to="/design" className="text-[#0A7C8E] hover:underline mt-2 inline-block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            </div>
            {project.customerName && (
              <p className="text-gray-600 mt-1">{project.customerName}</p>
            )}
            {project.description && (
              <p className="text-sm text-gray-500 mt-1">{project.description}</p>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowNewItem(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0A7C8E] text-white rounded-lg hover:bg-[#086a7a] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Design Item
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center gap-4">
          {/* Stage Filter */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as DesignStage | 'all')}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5"
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
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5"
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
              viewMode === 'kanban' ? 'bg-[#0A7C8E] text-white' : 'text-gray-600 hover:bg-gray-100'
            )}
            title="Kanban View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-2 transition-colors',
              viewMode === 'list' ? 'bg-[#0A7C8E] text-white' : 'text-gray-600 hover:bg-gray-100'
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A7C8E]"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No design items yet</h3>
          <p className="text-gray-500 mt-1">Create your first design item to get started.</p>
          <button
            onClick={() => setShowNewItem(true)}
            className="mt-4 text-[#0A7C8E] hover:underline"
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
    </div>
  );
}
