/**
 * Design Item Detail
 * Full detail view for a design item
 */

import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Activity, CheckSquare, History, Sparkles, Settings, Package, Trash2, DollarSign, Image } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useDesignItem, useProject, useRAGUpdate } from '../../hooks';
import { StageBadge } from './StageBadge';
import { ReadinessGauge } from './ReadinessGauge';
import { RAGStagePanel } from '../traffic-light/RAGStagePanel';
import { RAGEditModal } from '../traffic-light/RAGEditModal';
import { StageGateCheck } from '../stage-gate/StageGateCheck';
import { AIErrorBoundary } from '../ai/AIErrorBoundary';
import { ParametersEditor } from './ParametersEditor';
import { DeliverablesManager } from './DeliverablesManager';
import { ApprovalWorkflow } from '../approvals/ApprovalWorkflow';
import { PartsTab } from './PartsTab';
import { CATEGORY_LABELS, formatDateTime } from '../../utils/formatting';
import { getNextStageForItem } from '../../utils/stage-gate';
import { 
  transitionStage, 
  createApproval, 
  respondToApproval as respondToApprovalFirestore,
  createDeliverable,
  updateDeliverableStatus,
  deleteDeliverable,
  deleteDesignItem,
  subscribeToDeliverables,
} from '../../services/firestore';
import { uploadDeliverableFile, validateDeliverableFile, deleteDeliverableFile } from '../../services/storage';
import { useAuth } from '@/contexts/AuthContext';
import type { RAGStatus, RAGValue, RAGStatusValue, DesignItem, BriefAnalysisResult, DfMIssue } from '../../types';

// Lazy load AI components to prevent blocking main bundle
const DfMChecker = lazy(() => 
  import('../ai/DfMChecker').then(m => ({ default: m.DfMChecker }))
);
const ImageAnalysisAI = lazy(() => 
  import('../ai/ImageAnalysisAI').then(m => ({ default: m.ImageAnalysisAI }))
);
const DesignItemEnhancementAI = lazy(() => 
  import('../ai/DesignItemEnhancementAI').then(m => ({ default: m.DesignItemEnhancementAI }))
);
const DesignChat = lazy(() => 
  import('../design-ai/DesignChat').then(m => ({ default: m.DesignChat }))
);

import { useAIContext } from '../../hooks/useAIContext';

type Tab = 'overview' | 'rag' | 'parameters' | 'parts' | 'costing' | 'files' | 'approvals' | 'history' | 'ai' | 'inspiration';

// Aspect labels for display
const ASPECT_LABELS: Record<string, string> = {
  overallDimensions: 'Overall Dimensions',
  model3D: '3D Model',
  productionDrawings: 'Production Drawings',
  materialSpecs: 'Material Specs',
  hardwareSpecs: 'Hardware Specs',
  finishSpecs: 'Finish Specs',
  joineryDetails: 'Joinery Details',
  tolerances: 'Tolerances',
  assemblyInstructions: 'Assembly Instructions',
  materialAvailability: 'Material Availability',
  hardwareAvailability: 'Hardware Availability',
  toolingReadiness: 'Tooling Readiness',
  processDocumentation: 'Process Documentation',
  qualityCriteria: 'Quality Criteria',
  costValidation: 'Cost Validation',
  internalDesignReview: 'Internal Design Review',
  manufacturingReview: 'Manufacturing Review',
  clientApproval: 'Client Approval',
  prototypeValidation: 'Prototype Validation',
};

export default function DesignItemDetail() {
  const { projectId, itemId } = useParams<{ projectId: string; itemId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { project } = useProject(projectId);
  const { item, loading } = useDesignItem(projectId, itemId);
  const { updateAspect } = useRAGUpdate(projectId, itemId);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showGateCheck, setShowGateCheck] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // RAG Edit Modal state
  const [editingAspect, setEditingAspect] = useState<{
    category: keyof RAGStatus;
    key: string;
    value: RAGValue;
  } | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d1d1f]"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h2 className="text-lg font-medium text-gray-900">Item not found</h2>
        <Link 
          to={`/design/project/${projectId}`} 
          className="text-[#1d1d1f] hover:underline mt-2 inline-block"
        >
          Back to Project
        </Link>
      </div>
    );
  }

  const nextStage = getNextStageForItem(item);

  const handleAdvance = async (
    _item: typeof item, 
    stage: typeof item.currentStage, 
    overrideNote?: string
  ) => {
    try {
      await transitionStage(
        projectId!,
        itemId!,
        stage,
        user?.email || '',
        overrideNote || '',
        !!overrideNote
      );
    } catch (err) {
      console.error('Failed to transition stage:', err);
    }
    setShowGateCheck(false);
  };

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: FileText },
    { id: 'parameters' as Tab, label: 'Parameters', icon: Settings },
    { id: 'parts' as Tab, label: 'Parts', icon: Package },
    { id: 'costing' as Tab, label: 'Costing', icon: DollarSign },
    { id: 'rag' as Tab, label: 'RAG Status', icon: Activity },
    { id: 'files' as Tab, label: 'Files', icon: FileText },
    { id: 'inspiration' as Tab, label: 'Inspiration', icon: Image },
    { id: 'approvals' as Tab, label: 'Approvals', icon: CheckSquare },
    { id: 'history' as Tab, label: 'History', icon: History },
    { id: 'ai' as Tab, label: 'AI Analysis', icon: Sparkles },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          to={`/design/project/${projectId}`}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {item.itemCode}
            </span>
          </div>
          
          <div className="flex items-center gap-4 mt-2">
            <span className="text-sm text-gray-600">
              {project?.name || 'Unknown Project'}
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
              {CATEGORY_LABELS[item.category]}
            </span>
            <StageBadge stage={item.currentStage} size="sm" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ReadinessGauge value={item.overallReadiness} size="lg" />
          
          {nextStage && (
            <button
              onClick={() => setShowGateCheck(true)}
              className="px-4 py-2 bg-[#1d1d1f] text-white rounded-lg hover:bg-[#424245] text-sm font-medium"
            >
              Advance Stage
            </button>
          )}
          
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Item"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Design Item?</h3>
            <p className="text-gray-600 mb-4">
              This will permanently delete <strong>{item.name}</strong> and all its deliverables and approvals. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setDeleting(true);
                  try {
                    await deleteDesignItem(projectId!, itemId!);
                    navigate(`/design/project/${projectId}`);
                  } catch (err) {
                    console.error('Delete error:', err);
                    setDeleting(false);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                  activeTab === tab.id
                    ? 'border-[#1d1d1f] text-[#1d1d1f]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {activeTab === 'overview' && (
          <OverviewTab item={item} projectId={projectId!} />
        )}
        
        {activeTab === 'rag' && (
          <RAGStagePanel 
            ragStatus={item.ragStatus}
            currentStage={item.currentStage}
            editable 
            onAspectClick={(category: keyof RAGStatus, aspectKey: string, value: RAGValue) => {
              setEditingAspect({ category, key: aspectKey, value });
            }}
          />
        )}
        
        {activeTab === 'parameters' && (
          <ParametersTab item={item} projectId={projectId!} />
        )}
        
        {activeTab === 'parts' && (
          <PartsTab item={item} projectId={projectId!} />
        )}
        
        {activeTab === 'costing' && (
          <CostingTab item={item} projectId={projectId!} />
        )}
        
        {activeTab === 'files' && (
          <FilesTab item={item} projectId={projectId!} />
        )}
        
        {activeTab === 'approvals' && (
          <ApprovalsTab item={item} projectId={projectId!} />
        )}
        
        {activeTab === 'history' && (
          <HistoryTab item={item} />
        )}
        
        {activeTab === 'ai' && (
          <AITab item={item} projectId={projectId!} itemId={itemId!} userId={user?.uid} />
        )}
        
        {activeTab === 'inspiration' && (
          <InspirationTab item={item} projectId={projectId!} itemId={itemId!} />
        )}
      </div>

      {/* Stage Gate Check Modal */}
      {showGateCheck && nextStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setShowGateCheck(false)}
          />
          <div className="relative max-w-md w-full mx-4">
            <StageGateCheck
              item={item}
              targetStage={nextStage}
              onAdvance={handleAdvance}
              onCancel={() => setShowGateCheck(false)}
              allowOverride
            />
          </div>
        </div>
      )}

      {/* RAG Edit Modal */}
      {editingAspect && (
        <RAGEditModal
          open={true}
          category={editingAspect.category}
          aspectKey={editingAspect.key}
          aspectLabel={ASPECT_LABELS[editingAspect.key] || editingAspect.key}
          currentValue={editingAspect.value}
          onSave={async (status: RAGStatusValue, notes: string) => {
            const aspectPath = `${editingAspect.category}.${editingAspect.key}`;
            await updateAspect(aspectPath, status, notes);
          }}
          onClose={() => setEditingAspect(null)}
        />
      )}
    </div>
  );
}

// Tab Components
function OverviewTab({
  item,
  projectId,
}: {
  item: NonNullable<ReturnType<typeof useDesignItem>['item']>;
  projectId: string;
}) {
  const { user } = useAuth();
  const [isUpdatingSourcing, setIsUpdatingSourcing] = useState(false);
  const [isUpdatingDueDate, setIsUpdatingDueDate] = useState(false);
  const [showClipGallery, setShowClipGallery] = useState(false);
  const [InspirationPanelComponent, setInspirationPanelComponent] = useState<React.ComponentType<any> | null>(null);

  // Lazy load InspirationPanel for sidebar
  useEffect(() => {
    import('./InspirationPanel').then((mod) => {
      setInspirationPanelComponent(() => mod.InspirationPanel);
    });
  }, []);

  const params = (item as any).parameters || {};
  const dimensions = params.dimensions || {};
  const hasDimensions = dimensions.width || dimensions.height || dimensions.depth;

  const sourcingType = (item as any)?.sourcingType as ('MANUFACTURED' | 'PROCURED' | undefined);

  const handleLinkClip = async (clip: any) => {
    try {
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('@/shared/services/firebase');
      
      const clipRef = doc(db, 'designClips', clip.id);
      await updateDoc(clipRef, {
        projectId,
        designItemId: item.id,
        updatedAt: serverTimestamp(),
      });
      
      setShowClipGallery(false);
    } catch (error) {
      console.error('Failed to link clip:', error);
    }
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Description */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
          <p className="text-gray-900">{item.description || 'No description provided.'}</p>
        </div>
      
        {/* Key Info Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Priority</h3>
          <p className="text-lg font-semibold text-gray-900 capitalize">{item.priority || 'Not set'}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Due Date</h3>
          <input
            type="date"
            value={item.dueDate ? new Date(item.dueDate.seconds * 1000).toISOString().split('T')[0] : ''}
            disabled={isUpdatingDueDate}
            onChange={async (e) => {
              const dateValue = e.target.value;
              setIsUpdatingDueDate(true);
              try {
                const { updateDesignItem } = await import('../../services/firestore');
                await updateDesignItem(
                  projectId, 
                  item.id, 
                  { 
                    dueDate: dateValue 
                      ? { seconds: new Date(dateValue).getTime() / 1000, nanoseconds: 0 } 
                      : undefined 
                  } as any, 
                  user?.email || 'system'
                );
              } catch (error) {
                console.error('Failed to update dueDate:', error);
              } finally {
                setIsUpdatingDueDate(false);
              }
            }}
            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm"
          />
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Category</h3>
          <p className="text-lg font-semibold text-gray-900">{CATEGORY_LABELS[item.category]}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Sourcing</h3>
          <select
            value={sourcingType || ''}
            disabled={isUpdatingSourcing}
            onChange={async (e) => {
              const next = (e.target.value || undefined) as ('MANUFACTURED' | 'PROCURED' | undefined);
              setIsUpdatingSourcing(true);
              try {
                const { updateDesignItem } = await import('../../services/firestore');
                await updateDesignItem(projectId, item.id, { sourcingType: next } as any, user?.email || 'system');
              } catch (error) {
                console.error('Failed to update sourcingType:', error);
              } finally {
                setIsUpdatingSourcing(false);
              }
            }}
            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm"
          >
            <option value="">Not set</option>
            <option value="MANUFACTURED">Manufactured</option>
            <option value="PROCURED">Procured</option>
          </select>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Readiness</h3>
          <p className="text-lg font-semibold text-gray-900">{item.overallReadiness}%</p>
        </div>
      </div>

      {/* Key Parameters Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Key Parameters</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Dimensions */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Dimensions</h4>
            {hasDimensions ? (
              <p className="text-sm text-gray-900">
                {dimensions.width || '-'} × {dimensions.height || '-'} × {dimensions.depth || '-'} {dimensions.unit || 'mm'}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic">Not specified</p>
            )}
          </div>
          
          {/* Primary Material */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Primary Material</h4>
            <p className="text-sm text-gray-900">
              {params.primaryMaterial?.name || <span className="text-gray-400 italic">Not specified</span>}
            </p>
          </div>
          
          {/* Finish */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Finish</h4>
            <p className="text-sm text-gray-900">
              {params.finish ? (
                typeof params.finish === 'string' 
                  ? params.finish 
                  : `${params.finish.type || 'Unknown'}${params.finish.color ? ` - ${params.finish.color}` : ''}${params.finish.sheen ? ` (${params.finish.sheen})` : ''}`
              ) : (
                <span className="text-gray-400 italic">Not specified</span>
              )}
            </p>
          </div>
          
          {/* Construction Method */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Construction</h4>
            <p className="text-sm text-gray-900 capitalize">
              {params.constructionMethod || <span className="text-gray-400 italic">Not specified</span>}
            </p>
          </div>
          
          {/* AWI Grade */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">AWI Grade</h4>
            <p className="text-sm text-gray-900 uppercase">
              {params.awiGrade || <span className="text-gray-400 italic">Not specified</span>}
            </p>
          </div>
          
          {/* Hardware Count */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Hardware Items</h4>
            <p className="text-sm text-gray-900">
              {params.hardware?.length > 0 
                ? `${params.hardware.length} item${params.hardware.length !== 1 ? 's' : ''}`
                : <span className="text-gray-400 italic">None specified</span>
              }
            </p>
          </div>
        </div>
        
        {/* Special Requirements */}
        {params.specialRequirements?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Special Requirements</h4>
            <div className="flex flex-wrap gap-2">
              {params.specialRequirements.map((req: string, index: number) => (
                <span key={index} className="px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded-full">
                  {req}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Created</h3>
            <p className="text-sm font-medium text-gray-900">{formatDateTime(item.createdAt)}</p>
            <p className="text-xs text-gray-500">by {item.createdBy}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Last Updated</h3>
            <p className="text-sm font-medium text-gray-900">{formatDateTime(item.updatedAt)}</p>
            <p className="text-xs text-gray-500">by {item.updatedBy}</p>
          </div>
        </div>
      </div>

      {/* Sidebar - Inspiration Clips */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          {InspirationPanelComponent ? (
            <InspirationPanelComponent
              designItemId={item.id}
              projectId={projectId}
              designItemName={item.name}
              onOpenGallery={() => setShowClipGallery(true)}
              compact
              maxItems={4}
            />
          ) : (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1d1d1f]"></div>
            </div>
          )}
        </div>
      </div>

      {/* Clip Gallery Modal */}
      {showClipGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Link Inspiration Clip</h3>
              <button
                onClick={() => setShowClipGallery(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d1d1f]"></div></div>}>
                <ClipGalleryWrapperForOverview onLinkClip={handleLinkClip} />
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Lazy wrapper for ClipGallery in OverviewTab
function ClipGalleryWrapperForOverview({ onLinkClip }: { onLinkClip: (clip: any) => void }) {
  const [ClipGallery, setClipGallery] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    import('@/subsidiaries/finishes/clipper/components').then((mod) => {
      setClipGallery(() => mod.ClipGallery);
    });
  }, []);

  if (!ClipGallery) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d1d1f]"></div>
      </div>
    );
  }

  return <ClipGallery onLinkClip={onLinkClip} selectable />;
}

interface FilesTabProps {
  item: NonNullable<ReturnType<typeof useDesignItem>['item']>;
  projectId: string;
}

function FilesTab({ item, projectId }: FilesTabProps) {
  const { user } = useAuth();
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  // Subscribe to deliverables from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToDeliverables(projectId, item.id, (data) => {
      setDeliverables(data);
    });
    return unsubscribe;
  }, [projectId, item.id]);
  
  const handleUpload = async (file: File, type: any, name: string, description: string) => {
    if (!user?.email) {
      alert('You must be logged in to upload files');
      return;
    }
    
    // Validate file
    const validation = validateDeliverableFile(file, type);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    
    try {
      // Upload to Firebase Storage
      const { promise } = uploadDeliverableFile(
        file,
        projectId,
        item.id,
        type,
        item.currentStage,
        (progress) => setUploadProgress(Math.round(progress.percentage))
      );
      
      const result = await promise;
      setUploadProgress(null);
      
      // Create deliverable record in Firestore
      await createDeliverable(
        projectId,
        item.id,
        {
          name,
          type,
          description,
          fileName: result.fileName,
          fileType: result.fileType,
          fileSize: result.fileSize,
          storageUrl: result.storageUrl,
          storagePath: result.storagePath,
        },
        user.email,
        item.currentStage
      );
    } catch (error) {
      setUploadProgress(null);
      console.error('Upload failed:', error);
      alert('Failed to upload file. Please try again.');
    }
  };
  
  const handleDelete = async (deliverableId: string) => {
    const deliverable = deliverables.find(d => d.id === deliverableId);
    if (!deliverable) return;
    
    if (!confirm('Are you sure you want to delete this deliverable?')) return;
    
    try {
      // Delete from Storage if path exists
      if (deliverable.storagePath) {
        await deleteDeliverableFile(deliverable.storagePath);
      }
      // Delete from Firestore
      await deleteDeliverable(projectId, item.id, deliverableId);
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete deliverable');
    }
  };
  
  const handleApprove = async (deliverableId: string) => {
    if (!user?.email) return;
    try {
      await updateDeliverableStatus(projectId, item.id, deliverableId, 'approved', user.email);
    } catch (error) {
      console.error('Approve failed:', error);
      alert('Failed to approve deliverable');
    }
  };

  return (
    <div>
      {uploadProgress !== null && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-blue-700">Uploading...</span>
            <span className="text-sm font-medium text-blue-700">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all" 
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
      <DeliverablesManager
        deliverables={deliverables}
        currentStage={item.currentStage}
        onUpload={handleUpload}
        onDelete={handleDelete}
        onApprove={handleApprove}
      />
    </div>
  );
}

interface ApprovalsTabProps {
  item: NonNullable<ReturnType<typeof useDesignItem>['item']>;
  projectId: string;
}

function ApprovalsTab({ item, projectId }: ApprovalsTabProps) {
  const { user } = useAuth();
  
  const handleRequestApproval = async (approval: any) => {
    if (!user?.email) {
      alert('You must be logged in to request approvals');
      return;
    }
    
    try {
      await createApproval(
        projectId,
        item.id,
        {
          type: approval.type,
          assignedTo: approval.assignedTo,
          notes: approval.notes,
        },
        user.email
      );
    } catch (error) {
      console.error('Failed to create approval:', error);
      alert('Failed to create approval request');
    }
  };
  
  const handleRespondToApproval = async (approvalId: string, status: 'approved' | 'rejected', notes?: string) => {
    if (!user?.email) {
      alert('You must be logged in to respond to approvals');
      return;
    }
    
    try {
      await respondToApprovalFirestore(
        projectId,
        item.id,
        approvalId,
        status,
        notes || '',
        user.email
      );
    } catch (error) {
      console.error('Failed to respond to approval:', error);
      alert('Failed to respond to approval');
    }
  };

  // Convert existing approvals to the format expected by ApprovalWorkflow
  const approvals = item.approvals.map(a => ({
    ...a,
    assignedTo: (a as any).respondedBy || (a as any).assignedTo || '',
    decidedAt: (a as any).respondedAt || null,
    decision: (a as any).decision || (a as any).notes || null,
    attachments: [],
  })) as any;

  return (
    <ApprovalWorkflow
      designItem={item}
      projectId={projectId}
      approvals={approvals}
      onRequestApproval={handleRequestApproval}
      onRespondToApproval={handleRespondToApproval}
    />
  );
}

function HistoryTab({ item }: { item: NonNullable<ReturnType<typeof useDesignItem>['item']> }) {
  if (item.stageHistory.length === 0) {
    return (
      <div className="text-center py-8">
        <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No stage transitions yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {item.stageHistory.map((transition, index) => (
        <div key={index} className="flex items-start gap-4">
          <div className="w-2 h-2 bg-[#1d1d1f] rounded-full mt-2" />
          <div>
            <p className="font-medium text-gray-900">
              {transition.fromStage} → {transition.toStage}
            </p>
            <p className="text-sm text-gray-500">
              {formatDateTime(transition.transitionedAt)} by {transition.transitionedBy}
            </p>
            {transition.notes && (
              <p className="text-sm text-gray-600 mt-1">{transition.notes}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface ParametersTabProps {
  item: DesignItem;
  projectId: string;
}

function ParametersTab({ item, projectId }: ParametersTabProps) {
  const { user } = useAuth();
  
  const handleSaveParameters = async (parameters: any) => {
    try {
      // Import updateDesignItem dynamically to avoid circular deps
      const { updateDesignItem } = await import('../../services/firestore');
      await updateDesignItem(projectId, item.id, { parameters } as any, user?.email || 'system');
      console.log('Parameters saved successfully');
    } catch (error) {
      console.error('Failed to save parameters:', error);
      throw error;
    }
  };

  // Get existing parameters or use defaults
  const existingParams = (item as any).parameters || {
    dimensions: { width: null, height: null, depth: null, unit: 'mm' },
    primaryMaterial: null,
    secondaryMaterials: [],
    edgeBanding: null,
    hardware: [],
    finish: null,
    constructionMethod: 'frameless',
    joineryTypes: [],
    awiGrade: 'custom',
    specialRequirements: [],
  };

  return (
    <ParametersEditor
      parameters={existingParams}
      onSave={handleSaveParameters}
      isReadOnly={false}
    />
  );
}

interface AITabProps {
  item: DesignItem;
  projectId: string;
  itemId: string;
  userId?: string;
}

function AITab({ item, projectId, itemId, userId }: AITabProps) {
  const [activeAITool, setActiveAITool] = useState<'enhance' | 'dfm' | 'image' | 'chat'>('enhance');
  const { context, changesDetected, hasChangesFor, recordOutput, acknowledgeChanges } = useAIContext(item, projectId);

  const handleIssuesFound = (issues: DfMIssue[]) => {
    console.log('DfM issues found:', issues);
  };

  const LoadingFallback = () => (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d1d1f] mx-auto"></div>
        <p className="mt-3 text-sm text-gray-500">Loading AI tools...</p>
      </div>
    </div>
  );

  return (
    <AIErrorBoundary
      fallback={
        <div className="text-center py-8 px-4">
          <div className="text-4xl mb-3">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900">AI Features Unavailable</h3>
          <p className="text-gray-500 mt-1 text-sm">
            There was an error loading the AI features. Please try refreshing the page.
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        {/* AI Tool Selector */}
        <div className="flex flex-wrap gap-2 border-b pb-4">
          <button
            onClick={() => setActiveAITool('enhance')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              activeAITool === 'enhance'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            ✨ AI Enhancement
          </button>
          <button
            onClick={() => setActiveAITool('dfm')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              activeAITool === 'dfm'
                ? 'bg-[#1d1d1f] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            🔧 DfM Check
          </button>
          <button
            onClick={() => setActiveAITool('image')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              activeAITool === 'image'
                ? 'bg-[#1d1d1f] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            🖼️ Image Analysis
          </button>
          <button
            onClick={() => setActiveAITool('chat')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              activeAITool === 'chat'
                ? 'bg-[#1d1d1f] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            💬 Design Chat
          </button>
        </div>

        {/* Change Detection Banner */}
        {changesDetected.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-amber-500 text-lg">⚠️</span>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-amber-800">Data has changed since last AI analysis</h4>
                <p className="text-xs text-amber-700 mt-1">
                  The following sections have been updated: {changesDetected.join(', ')}.
                  Re-run AI tools to get updated insights.
                </p>
              </div>
              <button
                onClick={acknowledgeChanges}
                className="text-xs text-amber-600 hover:text-amber-800 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Active Tool with Suspense */}
        <Suspense fallback={<LoadingFallback />}>
          {activeAITool === 'dfm' && (
            <DfMChecker
              designItem={item as any}
              onIssuesFound={handleIssuesFound}
              onResolveIssue={(ruleId: string) => console.log('Resolved:', ruleId)}
            />
          )}

          {activeAITool === 'image' && (
            <ImageAnalysisAI
              projectId={projectId}
              onAnalysisComplete={(result) => console.log('Image analysis:', result)}
              onItemSelect={(selectedItem) => console.log('Selected item:', selectedItem)}
            />
          )}

          {activeAITool === 'enhance' && (
            <DesignItemEnhancementAI
              designItem={{
                id: itemId || '',
                name: item?.name || 'Design Item',
                itemType: (item as any)?.itemType,
                sourcingType: (item as any)?.sourcingType,
                quantity: (item as any)?.quantity || 1,
              }}
              onEnhancementComplete={async (result) => {
                console.log('Enhancement complete:', result);
                await recordOutput('enhance', result, ['overview', 'parameters']);
              }}
            />
          )}

          {activeAITool === 'chat' && (
            <DesignChat
              designItemId={itemId}
              projectId={projectId}
              designItemName={item?.name}
              userId={userId}
            />
          )}
        </Suspense>
      </div>
    </AIErrorBoundary>
  );
}

// Costing Tab Component for Manufactured Items
function CostingTab({
  item,
  projectId,
}: {
  item: NonNullable<ReturnType<typeof useDesignItem>['item']>;
  projectId: string;
}) {
  const { user } = useAuth();
  const manufacturing = (item as any).manufacturing || {};
  const partsList = (item as any).parts || [];
  const partsSummary = (item as any).partsSummary;
  
  // Sheet materials state (auto-calculated from parts)
  const [sheetMaterials, setSheetMaterials] = useState<any[]>(manufacturing.sheetMaterials || []);
  const [sheetMaterialsCost, setSheetMaterialsCost] = useState<number>(manufacturing.sheetMaterialsCost || 0);
  const [calculating, setCalculating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Read standard and special parts from manufacturing (managed in Parts tab)
  const standardParts: any[] = manufacturing.standardParts || [];
  const specialParts: any[] = manufacturing.specialParts || [];
  
  // Special parts rate overrides (per product)
  const [specialPartsRateOverrides, setSpecialPartsRateOverrides] = useState<Record<string, number>>(
    manufacturing.specialPartsRateOverrides || {}
  );
  
  // Labor state
  const [laborHours, setLaborHours] = useState<number>(manufacturing.laborHours || 0);
  const [laborRate, setLaborRate] = useState<number>(manufacturing.laborRate || 15000);
  const [quantity, setQuantity] = useState<number>(manufacturing.quantity || 1);
  const [notes, setNotes] = useState<string>(manufacturing.notes || '');
  const [saving, setSaving] = useState(false);

  // Check if parts have changed since last calculation
  const lastCalcTime = manufacturing.lastAutoCalcAt?.seconds ? manufacturing.lastAutoCalcAt.seconds * 1000 : 0;
  const partsLastUpdated = partsSummary?.lastUpdated?.seconds ? partsSummary.lastUpdated.seconds * 1000 : 0;
  const partsChanged = partsLastUpdated > lastCalcTime && sheetMaterials.length > 0;

  // Calculate totals (with rate overrides for special parts)
  const standardPartsCost = standardParts.reduce((sum, p) => sum + (p.quantity * p.unitCost), 0);
  const specialPartsCost = specialParts.reduce((sum, p) => {
    const overrideRate = specialPartsRateOverrides[p.id];
    const rate = overrideRate !== undefined ? overrideRate : p.unitCost;
    return sum + (p.quantity * rate);
  }, 0);
  const totalMaterialCost = sheetMaterialsCost + standardPartsCost + specialPartsCost;
  const laborCost = laborHours * laborRate;
  const totalCost = totalMaterialCost + laborCost;
  const costPerUnit = quantity > 0 ? totalCost / quantity : totalCost;

  // Auto-calculate from parts
  const handleAutoCalculate = async () => {
    if (partsList.length === 0) {
      alert('No parts found. Add parts in the Parts tab first.');
      return;
    }
    
    setCalculating(true);
    try {
      const { calculateSheetMaterialsFromParts, calculateLaborFromParts } = await import('../../services/estimateService');
      
      // Calculate sheet materials
      const { materials, totalCost: matCost } = await calculateSheetMaterialsFromParts(partsList);
      setSheetMaterials(materials);
      setSheetMaterialsCost(matCost);
      
      // Calculate labor
      const labor = calculateLaborFromParts(partsList);
      setLaborHours(labor.hours);
    } catch (error) {
      console.error('Auto-calculation failed:', error);
    } finally {
      setCalculating(false);
    }
  };

  // Update special part rate override
  const updateSpecialPartRate = (partId: string, newRate: number) => {
    setSpecialPartsRateOverrides(prev => ({
      ...prev,
      [partId]: newRate,
    }));
  };

  // Recursively remove undefined values from objects/arrays for Firestore
  const sanitizeForFirestore = (obj: any): any => {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeForFirestore(item)).filter(item => item !== undefined);
    }
    if (typeof obj === 'object') {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          result[key] = sanitizeForFirestore(value);
        }
      }
      return result;
    }
    return obj;
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const { updateDesignItem } = await import('../../services/firestore');
      
      // Sanitize arrays to remove any undefined nested values
      const cleanSheetMaterials = sanitizeForFirestore(sheetMaterials) || [];
      
      // Build manufacturing object, preserving existing standard/special parts
      const manufacturingData: Record<string, any> = {
        ...manufacturing,
        sheetMaterials: cleanSheetMaterials,
        sheetMaterialsCost: sheetMaterialsCost || 0,
        specialPartsRateOverrides: specialPartsRateOverrides,
        standardPartsCost: standardPartsCost || 0,
        specialPartsCost: specialPartsCost || 0,
        materialCost: totalMaterialCost || 0,
        laborHours: laborHours || 0,
        laborRate: laborRate || 0,
        laborCost: laborCost || 0,
        totalCost: totalCost || 0,
        costPerUnit: costPerUnit || 0,
        quantity: quantity || 1,
        autoCalculated: cleanSheetMaterials.length > 0,
        estimatedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
        estimatedBy: user?.email || 'system',
      };
      
      // Only add notes if defined and non-empty
      if (notes && notes.trim()) {
        manufacturingData.notes = notes;
      }
      
      // Only add lastAutoCalcAt if we have auto-calculated data
      if (cleanSheetMaterials.length > 0) {
        manufacturingData.lastAutoCalcAt = { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 };
      }
      
      await updateDesignItem(projectId, item.id, {
        manufacturing: manufacturingData,
      } as any, user?.email || 'system');
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save manufacturing cost:', error);
      alert('Failed to save. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'decimal', 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    }).format(amount);
  };

  // Check if this is a procured item
  if ((item as any).sourcingType === 'PROCURED') {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900">Procured Item</h3>
        <p className="text-gray-500 mt-1">
          This item is procured externally. Costing is managed in the Quotes tab of the Procured Item view.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Parts Changed Warning */}
      {partsChanged && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex items-start gap-3">
          <span className="text-amber-500 text-xl">⚠️</span>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-amber-800">Parts have been updated</h4>
            <p className="text-xs text-amber-700 mt-1">
              The parts list was modified after the last cost calculation. 
              Click "Auto-Calculate from Parts" to update material costs.
            </p>
          </div>
          <button
            onClick={handleAutoCalculate}
            disabled={calculating}
            className="px-3 py-1.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
          >
            {calculating ? 'Calculating...' : 'Recalculate'}
          </button>
        </div>
      )}

      {/* Sheet Materials Section (Auto-calculated from Parts) */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            Sheet Materials
            {partsList.length > 0 && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                {partsList.length} parts
              </span>
            )}
          </h3>
          <button
            onClick={handleAutoCalculate}
            disabled={calculating || partsList.length === 0}
            className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50 flex items-center gap-2"
          >
            {calculating ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-700"></div>
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            Auto-Calculate from Parts
          </button>
        </div>

        {sheetMaterials.length > 0 ? (
          <div className="space-y-2">
            {sheetMaterials.map((mat, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div>
                  <p className="font-medium text-gray-900">{mat.materialName} ({mat.thickness}mm)</p>
                  <p className="text-xs text-gray-500">
                    {mat.sheetsRequired} sheet{mat.sheetsRequired > 1 ? 's' : ''} • {mat.partsCount} parts • {mat.totalArea?.toFixed(2)} m²
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">UGX {formatCurrency(mat.totalCost)}</p>
                  <p className="text-xs text-gray-500">@ {formatCurrency(mat.unitCost)}/sheet</p>
                </div>
              </div>
            ))}
            <div className="flex justify-end pt-2 border-t">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                <span className="text-xs text-blue-600">Sheet Materials Total</span>
                <p className="font-bold text-blue-800">UGX {formatCurrency(sheetMaterialsCost)}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No sheet materials calculated</p>
            <p className="text-xs">Click "Auto-Calculate from Parts" to compute material costs</p>
          </div>
        )}
      </div>

      {/* Standard Parts Summary (managed in Parts tab) */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            🔩 Standard Parts
            <span className="text-xs font-normal text-gray-500">(from Parts tab)</span>
          </h3>
          {standardPartsCost > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-1">
              <span className="font-bold text-orange-800">UGX {formatCurrency(standardPartsCost)}</span>
            </div>
          )}
        </div>

        {standardParts.length > 0 ? (
          <div className="space-y-1">
            {standardParts.map((part) => (
              <div key={part.id} className="flex items-center justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded capitalize">{part.category}</span>
                  <span className="text-gray-700">{part.name}</span>
                  <span className="text-gray-400">×{part.quantity}</span>
                </div>
                <span className="text-gray-600">UGX {formatCurrency(part.quantity * part.unitCost)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-3">
            No standard parts. Add them in the Parts tab → Standard Parts section.
          </p>
        )}
      </div>

      {/* Special Parts with Rate Overrides (for luxury projects) */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            ✨ Special Parts
            <span className="text-xs font-normal text-gray-500">(rate overrides for this product)</span>
          </h3>
          {specialPartsCost > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-1">
              <span className="font-bold text-purple-800">UGX {formatCurrency(specialPartsCost)}</span>
            </div>
          )}
        </div>

        {specialParts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-purple-50 border-b border-purple-200">
                <tr>
                  <th className="px-2 py-1.5 text-left font-medium text-purple-800">Part</th>
                  <th className="px-2 py-1.5 text-center font-medium text-purple-800">Qty</th>
                  <th className="px-2 py-1.5 text-right font-medium text-purple-800">Base Rate</th>
                  <th className="px-2 py-1.5 text-right font-medium text-purple-800">Override Rate</th>
                  <th className="px-2 py-1.5 text-right font-medium text-purple-800">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100">
                {specialParts.map((part) => {
                  const overrideRate = specialPartsRateOverrides[part.id];
                  const effectiveRate = overrideRate !== undefined ? overrideRate : part.unitCost;
                  return (
                    <tr key={part.id} className="hover:bg-purple-50/50">
                      <td className="px-2 py-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded capitalize">{part.category}</span>
                          <span className="font-medium">{part.name}</span>
                          {part.supplier && <span className="text-xs text-gray-500">({part.supplier})</span>}
                        </div>
                      </td>
                      <td className="px-2 py-1.5 text-center text-gray-700">{part.quantity}</td>
                      <td className="px-2 py-1.5 text-right text-gray-500">UGX {formatCurrency(part.unitCost)}</td>
                      <td className="px-2 py-1.5 text-right">
                        <input
                          type="number"
                          value={overrideRate !== undefined ? overrideRate : ''}
                          onChange={(e) => updateSpecialPartRate(part.id, parseFloat(e.target.value) || 0)}
                          placeholder={String(part.unitCost)}
                          min="0"
                          className="w-24 px-2 py-1 text-sm border border-purple-300 rounded text-right focus:ring-1 focus:ring-purple-500"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-right font-medium text-purple-900">
                        UGX {formatCurrency(part.quantity * effectiveRate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-3">
            No special parts. Add them in the Parts tab → Special Parts section.
          </p>
        )}
      </div>

      {/* Labor Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          ⏱️ Labor Cost
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Labor Hours</label>
            <input
              type="number"
              value={laborHours}
              onChange={(e) => setLaborHours(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A7C8E] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (UGX)</label>
            <input
              type="number"
              value={laborRate}
              onChange={(e) => setLaborRate(parseFloat(e.target.value) || 0)}
              min="0"
              step="1000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A7C8E] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A7C8E] focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <div className="w-full bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <span className="text-xs text-green-600">Labor Total</span>
              <p className="font-semibold text-green-800">UGX {formatCurrency(laborCost)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Any additional costing notes..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A7C8E] focus:border-transparent"
        />
      </div>

      {/* Total Cost Summary */}
      <div className="bg-gradient-to-r from-[#0A7C8E] to-[#0A7C8E]/80 rounded-lg p-4 text-white">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-white/70">Sheet Materials</p>
            <p className="font-semibold">UGX {formatCurrency(sheetMaterialsCost)}</p>
          </div>
          <div>
            <p className="text-sm text-white/70">Standard Parts</p>
            <p className="font-semibold">UGX {formatCurrency(standardPartsCost)}</p>
          </div>
          <div>
            <p className="text-sm text-white/70">Special Parts</p>
            <p className="font-semibold">UGX {formatCurrency(specialPartsCost)}</p>
          </div>
          <div>
            <p className="text-sm text-white/70">Labor ({laborHours}hrs)</p>
            <p className="font-semibold">UGX {formatCurrency(laborCost)}</p>
          </div>
        </div>
        <div className="border-t border-white/20 pt-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Total Manufacturing Cost</h3>
            {quantity > 1 && (
              <p className="text-sm text-white/80">UGX {formatCurrency(costPerUnit)} per unit × {quantity}</p>
            )}
          </div>
          <p className="text-3xl font-bold">UGX {formatCurrency(totalCost)}</p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3">
        {saveSuccess && (
          <span className="text-green-600 text-sm flex items-center gap-1">
            ✓ Saved successfully
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-2 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 ${
            saveSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-[#0A7C8E] hover:bg-[#0A7C8E]/90'
          }`}
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : saveSuccess ? (
            <>
              <CheckSquare className="w-4 h-4" />
              Saved!
            </>
          ) : (
            <>
              <CheckSquare className="w-4 h-4" />
              Save Costing
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Inspiration Tab - Shows design clips linked to this item
interface InspirationTabProps {
  item: DesignItem;
  projectId: string;
  itemId: string;
}

function InspirationTab({ item, projectId, itemId }: InspirationTabProps) {
  const [showGallery, setShowGallery] = useState(false);
  const [InspirationPanelComponent, setInspirationPanelComponent] = useState<React.ComponentType<any> | null>(null);

  // Lazy load InspirationPanel
  useEffect(() => {
    import('./InspirationPanel').then((mod) => {
      setInspirationPanelComponent(() => mod.InspirationPanel);
    });
  }, []);

  const handleLinkClip = async (clip: any) => {
    try {
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('@/shared/services/firebase');
      
      const clipRef = doc(db, 'designClips', clip.id);
      await updateDoc(clipRef, {
        projectId,
        designItemId: itemId,
        updatedAt: serverTimestamp(),
      });
      
      setShowGallery(false);
    } catch (error) {
      console.error('Failed to link clip:', error);
      alert('Failed to link clip. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Design Inspiration</h3>
          <p className="text-sm text-gray-500">
            Reference images and inspiration clips for {item.name}
          </p>
        </div>
        <button
          onClick={() => setShowGallery(true)}
          className="px-4 py-2 bg-[#1d1d1f] text-white rounded-lg text-sm font-medium hover:bg-[#424245] flex items-center gap-2"
        >
          <Image className="w-4 h-4" />
          Link Clip
        </button>
      </div>

      {/* Inspiration Panel */}
      {InspirationPanelComponent ? (
        <InspirationPanelComponent
          designItemId={itemId}
          projectId={projectId}
          designItemName={item.name}
          onOpenGallery={() => setShowGallery(true)}
        />
      ) : (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d1d1f]"></div>
        </div>
      )}

      {/* Clip Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Select Inspiration Clip</h3>
              <button
                onClick={() => setShowGallery(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d1d1f]"></div></div>}>
                <ClipGalleryWrapper onLinkClip={handleLinkClip} />
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Lazy wrapper for ClipGallery to avoid circular deps
function ClipGalleryWrapper({ onLinkClip }: { onLinkClip: (clip: any) => void }) {
  const [ClipGallery, setClipGallery] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    import('@/subsidiaries/finishes/clipper/components').then((mod) => {
      setClipGallery(() => mod.ClipGallery);
    });
  }, []);

  if (!ClipGallery) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d1d1f]"></div>
      </div>
    );
  }

  return <ClipGallery onLinkClip={onLinkClip} selectable />;
}
