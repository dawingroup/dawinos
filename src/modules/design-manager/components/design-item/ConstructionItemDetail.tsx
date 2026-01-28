/**
 * Construction Item Detail
 * Dedicated detail view for construction/fitout items
 * Includes: electrical, plumbing, tiling, painting, gypsum, fitout, etc.
 */

import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, DollarSign, FolderOpen, History,
  Trash2, CheckCircle, ClipboardList, HardHat,
  Zap, Droplet, Paintbrush, LayoutGrid, Square, Hammer, Wind
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { ResponsiveTabs } from '@/shared/components/ui/ResponsiveTabs';
import { useDesignItem, useProject } from '../../hooks';
import { StageBadge } from './StageBadge';
import { formatDateTime, STAGE_LABELS } from '../../utils/formatting';
import { getNextStageForItem } from '../../utils/stage-gate';
import { StageGateCheck } from '../stage-gate/StageGateCheck';
import { ConstructionPricingTab } from './ConstructionPricingTab';
import {
  transitionStage,
  deleteDesignItem,
  updateDesignItem,
} from '../../services/firestore';
import { useAuth } from '@/contexts/AuthContext';
import {
  CONSTRUCTION_STAGES,
  CONSTRUCTION_CATEGORY_LABELS,
  type ConstructionPricing,
  type ConstructionCategory,
} from '../../types/deliverables';

type Tab = 'overview' | 'scope' | 'pricing' | 'progress' | 'files' | 'history';

// Icon mapping for construction categories
const CATEGORY_ICON_MAP: Record<ConstructionCategory, React.ElementType> = {
  electrical: Zap,
  plumbing: Droplet,
  tiling: LayoutGrid,
  painting: Paintbrush,
  gypsum: Square,
  fitout: Hammer,
  hvac: Wind,
  flooring: LayoutGrid,
  ceiling: Square,
  other: HardHat,
};

export default function ConstructionItemDetail() {
  const { projectId, itemId } = useParams<{ projectId: string; itemId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { project } = useProject(projectId);
  const { item, loading } = useDesignItem(projectId, itemId);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showGateCheck, setShowGateCheck] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <HardHat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h2 className="text-xl font-semibold text-gray-900">Construction item not found</h2>
        <Link to={`/design/project/${projectId}`} className="text-amber-600 hover:underline mt-2 inline-block">
          Return to project
        </Link>
      </div>
    );
  }

  const nextStage = getNextStageForItem(item);

  // Get construction pricing data (may be stored in a construction field)
  const constructionPricing = (item as any).construction as ConstructionPricing | undefined;
  const constructionCategory = constructionPricing?.category || 'other';
  const CategoryIcon = CATEGORY_ICON_MAP[constructionCategory] || HardHat;

  const handleAdvance = async (
    _advItem: typeof item,
    targetStage: typeof item.currentStage,
    overrideNote?: string
  ) => {
    try {
      await transitionStage(
        projectId!,
        itemId!,
        targetStage,
        user?.email || '',
        overrideNote || ''
      );
    } catch (err) {
      console.error('Failed to transition stage:', err);
    }
    setShowGateCheck(false);
  };

  const handleDelete = async () => {
    if (!projectId || !itemId) return;
    setDeleting(true);
    try {
      await deleteDesignItem(projectId, itemId);
      navigate(`/design/project/${projectId}`);
    } catch (err) {
      console.error('Failed to delete item:', err);
      setDeleting(false);
    }
  };

  const handleUpdatePricing = async (updates: Partial<ConstructionPricing>) => {
    if (!projectId || !itemId) return;
    await updateDesignItem(projectId, itemId, {
      construction: {
        ...constructionPricing,
        ...updates,
      } as ConstructionPricing,
    }, user?.uid || user?.email || '');
  };

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: FileText },
    { id: 'scope' as Tab, label: 'Scope', icon: ClipboardList },
    { id: 'pricing' as Tab, label: 'Pricing', icon: DollarSign },
    { id: 'progress' as Tab, label: 'Progress', icon: HardHat },
    { id: 'files' as Tab, label: 'Files', icon: FolderOpen },
    { id: 'history' as Tab, label: 'History', icon: History },
  ];

  // Get current stage index for progress display
  const currentStageIndex = CONSTRUCTION_STAGES.indexOf(item.currentStage);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <Link
            to={`/design/project/${projectId}`}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{item.name}</h1>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium">
                CONSTRUCTION
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 mt-1 flex-wrap">
              <span className="text-sm text-gray-600 hidden sm:inline">
                {project?.name || 'Unknown Project'}
              </span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded hidden sm:inline">
                {item.itemCode}
              </span>
              <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded flex items-center gap-1">
                <CategoryIcon className="w-3 h-3" />
                {CONSTRUCTION_CATEGORY_LABELS[constructionCategory]}
              </span>
            </div>
          </div>

          {/* Desktop actions */}
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <StageBadge stage={item.currentStage} size="sm" />

            {nextStage && (
              <button
                onClick={() => setShowGateCheck(true)}
                className="px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium"
              >
                Advance
              </button>
            )}

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              title="Delete Item"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile action bar */}
        <div className="flex sm:hidden items-center justify-between gap-2 px-1">
          <StageBadge stage={item.currentStage} size="sm" />

          <div className="flex items-center gap-1">
            {nextStage && (
              <button
                onClick={() => setShowGateCheck(true)}
                className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm font-medium"
              >
                Advance
              </button>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Construction Progress */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Construction Progress</h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {CONSTRUCTION_STAGES.map((stage, index) => {
            const isComplete = index < currentStageIndex;
            const isCurrent = index === currentStageIndex;
            return (
              <div key={stage} className="flex items-center flex-1 min-w-[80px]">
                <div className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium flex-shrink-0',
                  isComplete && 'bg-green-500 text-white',
                  isCurrent && 'bg-amber-600 text-white',
                  !isComplete && !isCurrent && 'bg-gray-200 text-gray-500'
                )}>
                  {isComplete ? <CheckCircle className="w-4 h-4" /> : index + 1}
                </div>
                <div className="ml-2 flex-1 min-w-0">
                  <p className={cn(
                    'text-xs font-medium truncate',
                    isCurrent ? 'text-amber-600' : 'text-gray-500'
                  )}>
                    {STAGE_LABELS[stage]}
                  </p>
                </div>
                {index < CONSTRUCTION_STAGES.length - 1 && (
                  <div className={cn(
                    'w-6 h-0.5 mx-1 flex-shrink-0',
                    isComplete ? 'bg-green-500' : 'bg-gray-200'
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <ResponsiveTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as Tab)}
      />

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200">
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            {/* Construction Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                <p className="text-gray-900">{item.description || 'No description provided'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Category</h3>
                <div className="flex items-center gap-2">
                  <CategoryIcon className="w-5 h-5 text-amber-600" />
                  <span className="text-gray-900">{CONSTRUCTION_CATEGORY_LABELS[constructionCategory]}</span>
                </div>
              </div>
            </div>

            {/* Contractor Info */}
            {constructionPricing?.contractor && (
              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-4">Contractor Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Contractor</p>
                    <p className="text-sm font-medium">{constructionPricing.contractor}</p>
                  </div>
                  {constructionPricing.contractorContact && (
                    <div>
                      <p className="text-xs text-gray-500">Contact</p>
                      <p className="text-sm font-medium">{constructionPricing.contractorContact}</p>
                    </div>
                  )}
                  {constructionPricing.quoteReference && (
                    <div>
                      <p className="text-xs text-gray-500">Quote Reference</p>
                      <p className="text-sm font-medium">{constructionPricing.quoteReference}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cost Summary */}
            {constructionPricing && (
              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-4">Cost Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">
                      {constructionPricing.quantity} {constructionPricing.unitType}
                    </p>
                    <p className="text-lg font-semibold">
                      {constructionPricing.currency} {(constructionPricing.quantity * constructionPricing.unitRate).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Labor</p>
                    <p className="text-lg font-semibold">
                      {constructionPricing.currency} {(constructionPricing.laborCost || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Materials</p>
                    <p className="text-lg font-semibold">
                      {constructionPricing.currency} {(constructionPricing.materialsCost || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs text-amber-600">Total Cost</p>
                    <p className="text-lg font-semibold text-amber-700">
                      {constructionPricing.currency} {(constructionPricing.totalCost || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="border-t pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-gray-700">{formatDateTime(item.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Last Updated</p>
                  <p className="text-gray-700">{formatDateTime(item.updatedAt)}</p>
                </div>
                {item.dueDate && (
                  <div>
                    <p className="text-xs text-gray-500">Due Date</p>
                    <p className="text-gray-700">{formatDateTime(item.dueDate)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scope' && (
          <div className="p-6 space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Scope of Work</h3>

            {constructionPricing?.scopeOfWork ? (
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap text-gray-700">{constructionPricing.scopeOfWork}</p>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No scope of work defined yet.</p>
                <button
                  onClick={() => setActiveTab('pricing')}
                  className="mt-3 text-amber-600 hover:underline text-sm"
                >
                  Add scope in Pricing tab
                </button>
              </div>
            )}

            {constructionPricing?.exclusions && (
              <div className="border-t pt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Exclusions</h4>
                <p className="text-gray-600 whitespace-pre-wrap">{constructionPricing.exclusions}</p>
              </div>
            )}

            {constructionPricing?.notes && (
              <div className="border-t pt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                <p className="text-gray-600 whitespace-pre-wrap">{constructionPricing.notes}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pricing' && (
          <ConstructionPricingTab
            item={item}
            projectId={projectId!}
            userId={user?.uid || ''}
            onUpdate={handleUpdatePricing}
          />
        )}

        {activeTab === 'progress' && (
          <div className="p-6 space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Work Progress</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Progress tracking can be expanded here */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Current Stage</h4>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <HardHat className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{STAGE_LABELS[item.currentStage]}</p>
                    <p className="text-xs text-gray-500">
                      Stage {currentStageIndex + 1} of {CONSTRUCTION_STAGES.length}
                    </p>
                  </div>
                </div>
              </div>

              {constructionPricing?.laborDays !== undefined && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Estimated Duration</h4>
                  <p className="text-2xl font-bold text-gray-900">
                    {constructionPricing.laborDays} days
                  </p>
                  {constructionPricing.laborNotes && (
                    <p className="text-xs text-gray-500 mt-1">{constructionPricing.laborNotes}</p>
                  )}
                </div>
              )}
            </div>

            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Detailed progress tracking coming soon.</p>
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Files & Documents</h3>
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">File management coming soon.</p>
              <p className="text-sm text-gray-400 mt-1">
                Upload quotes, contracts, and site photos.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Stage History</h3>
            {item.stageHistory && item.stageHistory.length > 0 ? (
              <div className="space-y-3">
                {item.stageHistory.map((transition, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <History className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {STAGE_LABELS[transition.fromStage]} &rarr; {STAGE_LABELS[transition.toStage]}
                      </p>
                      <p className="text-xs text-gray-500">
                        {transition.transitionedBy} &middot; {formatDateTime(transition.transitionedAt)}
                      </p>
                      {transition.notes && (
                        <p className="text-sm text-gray-600 mt-1">{transition.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No stage transitions yet.</p>
            )}
          </div>
        )}
      </div>

      {/* Stage Gate Check Modal */}
      {showGateCheck && nextStage && (
        <StageGateCheck
          item={item}
          targetStage={nextStage}
          onAdvance={(advItem, stage, overrideNote) => handleAdvance(advItem, stage, overrideNote)}
          onCancel={() => setShowGateCheck(false)}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Construction Item?</h3>
            <p className="text-gray-600 mb-6">
              This will permanently delete "{item.name}" and all associated files. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
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
