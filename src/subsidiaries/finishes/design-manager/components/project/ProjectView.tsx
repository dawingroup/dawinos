/**
 * Project View
 * Project detail page with design items, cutlist, and estimates
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, LayoutGrid, List, FolderOpen, Calendar, User, Clock,
  CheckCircle, AlertTriangle, Package, Edit2, Scissors, Sparkles, Calculator, Upload, FileText
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useProject, useDesignItems } from '../../hooks';
import { ProjectDialog } from './ProjectDialog';
import type { DesignStage, DesignCategory } from '../../types';
import { STAGE_LABELS, CATEGORY_LABELS } from '../../utils/formatting';
import { STAGE_ORDER, MANUFACTURING_STAGE_ORDER, PROCUREMENT_STAGE_ORDER, isAtFinalStageForItem } from '../../utils/stage-gate';
import { DesignItemCard } from '../design-item/DesignItemCard';
import { NewDesignItemDialog } from '../design-item/NewDesignItemDialog';
import { StageKanban } from '../dashboard/StageKanban';
import { DesignItemsTable } from './DesignItemsTable';
import { CutlistTab } from './CutlistTab';
import { EstimateTab } from './EstimateTab';
import { ProductionTab } from './ProductionTab';
import { ProjectDocuments } from './ProjectDocuments';
import { StrategyCanvas } from '../strategy';
import type { Project } from '@/shared/types';
import { BulkImporter } from '../ProjectEstimation/BulkImporter';
import { runProjectProduction } from '@/shared/services/optimization';
import { createDesignItemsFromAIAnalysis } from '../../utils/aiConversion';
import type { ClientDocument } from '../../types/document.types';

type ViewMode = 'kanban' | 'list';
type ProjectTab = 'items' | 'cutlist' | 'estimate' | 'production' | 'documents';

export default function ProjectView() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const { project, loading: projectLoading } = useProject(projectId);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [stageFilter, setStageFilter] = useState<DesignStage | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<DesignCategory | 'all'>('all');
  const [showNewItem, setShowNewItem] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [showStrategy, setShowStrategy] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [activeTab, setActiveTab] = useState<ProjectTab>('items');

  const { items, loading: itemsLoading } = useDesignItems(projectId, {
    stage: stageFilter === 'all' ? undefined : stageFilter,
    category: categoryFilter === 'all' ? undefined : categoryFilter,
  });

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showStrategy || showBulkImport) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    // Cleanup on unmount
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [showStrategy, showBulkImport]);

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

  // Calculate project statistics
  const stats = {
    total: items.length,
    inProgress: items.filter(i => !isAtFinalStageForItem(i)).length,
    productionReady: items.filter(i => isAtFinalStageForItem(i)).length,
    needsAttention: items.filter(i => i.overallReadiness < 50 || i.priority === 'urgent').length,
    avgReadiness: items.length > 0 
      ? Math.round(items.reduce((sum, i) => sum + i.overallReadiness, 0) / items.length)
      : 0,
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Not set';
    let date: Date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp.seconds !== undefined) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
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
    <div className="min-h-screen px-6 py-6 space-y-6 pb-20">
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
            onClick={() => setShowBulkImport(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Bulk Import
          </button>
          <button
            onClick={() => setShowStrategy(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Sparkles className="w-4 h-4" />
            AI Strategy
          </button>
          <button
            onClick={() => setShowEditProject(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Edit Project
          </button>
          <button
            onClick={() => setShowNewItem(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0A7C8E] text-white rounded-lg hover:bg-[#086a7a] transition-colors"
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 border-l-4 border-l-[#0A7C8E]">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-[#0A7C8E]" />
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

      {/* Project Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('items')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              activeTab === 'items'
                ? 'border-[#0A7C8E] text-[#0A7C8E] bg-teal-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            <Package className="w-4 h-4" />
            Design Items
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              activeTab === 'documents'
                ? 'border-[#0A7C8E] text-[#0A7C8E] bg-teal-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            <FileText className="w-4 h-4" />
            Documents
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
              AI
            </span>
          </button>
          <button
            onClick={() => setActiveTab('cutlist')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              activeTab === 'cutlist'
                ? 'border-[#0A7C8E] text-[#0A7C8E] bg-teal-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            <Scissors className="w-4 h-4" />
            Cutlist
          </button>
          <button
            onClick={() => setActiveTab('estimate')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              activeTab === 'estimate'
                ? 'border-[#0A7C8E] text-[#0A7C8E] bg-teal-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            <Calculator className="w-4 h-4" />
            Estimate
          </button>
          <button
            onClick={() => setActiveTab('production')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              activeTab === 'production'
                ? 'border-[#0A7C8E] text-[#0A7C8E] bg-teal-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            <Scissors className="w-4 h-4" />
            Production
            {(project as unknown as Project).optimizationState?.production?.invalidatedAt && (
              <span className="w-2 h-2 bg-amber-500 rounded-full" title="Optimization outdated" />
            )}
          </button>
        </div>
      </div>

      {activeTab === 'items' && (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="flex items-center gap-4">
              {/* Stage Filter */}
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value as DesignStage | 'all')}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0A7C8E]/20 focus:border-[#0A7C8E]"
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
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0A7C8E]/20 focus:border-[#0A7C8E]"
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
            <div className="space-y-8">
              {/* Manufacturing Kanban */}
              {items.filter(i => (i as any).sourcingType !== 'PROCURED').length > 0 && (
                <StageKanban 
                  items={items.filter(i => (i as any).sourcingType !== 'PROCURED')} 
                  projectId={projectId!}
                  stageOrder={MANUFACTURING_STAGE_ORDER}
                  title="🏭 Manufacturing"
                />
              )}
              
              {/* Procurement Kanban */}
              {items.filter(i => (i as any).sourcingType === 'PROCURED').length > 0 && (
                <StageKanban 
                  items={items.filter(i => (i as any).sourcingType === 'PROCURED')} 
                  projectId={projectId!}
                  stageOrder={PROCUREMENT_STAGE_ORDER}
                  title="📦 Procurement"
                />
              )}

              {/* Show message if no items */}
              {items.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No design items yet
                </div>
              )}
            </div>
          ) : (
            <DesignItemsTable items={items} projectId={projectId!} />
          )}
        </>
      )}

      {activeTab === 'cutlist' && (
        <CutlistTab project={project} />
      )}

      {activeTab === 'estimate' && (
        <EstimateTab project={project} />
      )}

      {activeTab === 'production' && (
        <ProductionTab
          project={project}
          onRefresh={async () => {
            if (projectId && user?.email) {
              await runProjectProduction(projectId, user.email);
            }
          }}
        />
      )}

      {activeTab === 'documents' && (
        <ProjectDocuments
          projectId={projectId!}
          projectCode={project.code}
          userId={user?.uid || ''}
          userName={user?.displayName || user?.email || 'Unknown'}
          onApplyAIToProject={async (document: ClientDocument) => {
            // Convert AI extracted items to design items
            if (!document.aiAnalysisResult?.extractedItems?.length) {
              alert('No items to import from this document.');
              return;
            }

            const confirmImport = window.confirm(
              `Import ${document.aiAnalysisResult.extractedItems.length} design item(s) from AI analysis?\n\n` +
              `Items will be created in the "Concept" stage.`
            );

            if (!confirmImport) return;

            try {
              const result = await createDesignItemsFromAIAnalysis(
                document,
                projectId!,
                project.code,
                user?.uid || '',
                {
                  skipLowConfidence: true,
                  confidenceThreshold: 0.4,
                }
              );

              let message = `Created ${result.created.length} design item(s).`;
              if (result.skipped.length > 0) {
                message += `\nSkipped ${result.skipped.length} low-confidence item(s).`;
              }
              if (result.errors.length > 0) {
                message += `\nFailed to create ${result.errors.length} item(s).`;
              }

              alert(message);
            } catch (error) {
              console.error('Error importing AI items:', error);
              alert('Failed to import items. Please try again.');
            }
          }}
        />
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

      {/* Strategy Canvas with AI Report Generation */}
      {showStrategy && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto" style={{ height: '100vh', overflowY: 'auto' }}>
          <StrategyCanvas
            projectId={projectId!}
            projectName={project.name}
            projectCode={project.code}
            clientBrief={project.description}
            userId={user?.email || undefined}
            onClose={() => setShowStrategy(false)}
          />
        </div>
      )}

      {/* Bulk Importer */}
      {showBulkImport && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowBulkImport(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Bulk Import Design Items</h2>
                <button
                  onClick={() => setShowBulkImport(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                <BulkImporter
                  projectId={projectId!}
                  projectCode={project.code}
                  onComplete={() => setShowBulkImport(false)}
                  onCancel={() => setShowBulkImport(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
