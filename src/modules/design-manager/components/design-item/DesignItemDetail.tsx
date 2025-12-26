/**
 * Design Item Detail
 * Full detail view for a design item
 */

import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Activity, CheckSquare, History, Sparkles, Settings } from 'lucide-react';
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
import { CATEGORY_LABELS, formatDateTime } from '../../utils/formatting';
import { getNextStage } from '../../utils/stage-gate';
import { 
  transitionStage, 
  createApproval, 
  respondToApproval as respondToApprovalFirestore,
  createDeliverable,
  updateDeliverableStatus,
  deleteDeliverable,
  subscribeToDeliverables,
} from '../../services/firestore';
import { uploadDeliverableFile, validateDeliverableFile, deleteDeliverableFile } from '../../services/storage';
import { useAuth } from '@/shared/hooks';
import type { RAGStatus, RAGValue, RAGStatusValue, DesignItem, BriefAnalysisResult, DfMIssue } from '../../types';

// Lazy load AI components to prevent blocking main bundle
const BriefAnalyzer = lazy(() => 
  import('../ai/BriefAnalyzer').then(m => ({ default: m.BriefAnalyzer }))
);
const DfMChecker = lazy(() => 
  import('../ai/DfMChecker').then(m => ({ default: m.DfMChecker }))
);

type Tab = 'overview' | 'rag' | 'parameters' | 'files' | 'approvals' | 'history' | 'ai';

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
  const { user } = useAuth();
  const { project } = useProject(projectId);
  const { item, loading } = useDesignItem(projectId, itemId);
  const { updateAspect } = useRAGUpdate(projectId, itemId);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showGateCheck, setShowGateCheck] = useState(false);
  
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

  const nextStage = getNextStage(item.currentStage);

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
    { id: 'rag' as Tab, label: 'RAG Status', icon: Activity },
    { id: 'files' as Tab, label: 'Files', icon: FileText },
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
        </div>
      </div>

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
          <OverviewTab item={item} />
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
          <AITab item={item} projectId={projectId!} />
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
function OverviewTab({ item }: { item: NonNullable<ReturnType<typeof useDesignItem>['item']> }) {
  const params = (item as any).parameters || {};
  const dimensions = params.dimensions || {};
  const hasDimensions = dimensions.width || dimensions.height || dimensions.depth;
  
  return (
    <div className="space-y-6">
      {/* Description */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
        <p className="text-gray-900">{item.description || 'No description provided.'}</p>
      </div>
      
      {/* Key Info Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Priority</h3>
          <p className="text-lg font-semibold text-gray-900 capitalize">{item.priority || 'Not set'}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Due Date</h3>
          <p className="text-lg font-semibold text-gray-900">
            {item.dueDate 
              ? new Date(item.dueDate.seconds * 1000).toLocaleDateString() 
              : 'Not set'}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Category</h3>
          <p className="text-lg font-semibold text-gray-900">{CATEGORY_LABELS[item.category]}</p>
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
              {params.primaryMaterial || <span className="text-gray-400 italic">Not specified</span>}
            </p>
          </div>
          
          {/* Finish */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Finish</h4>
            <p className="text-sm text-gray-900">
              {params.finish || <span className="text-gray-400 italic">Not specified</span>}
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
  );
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
}

function AITab({ item, projectId }: AITabProps) {
  const [activeAITool, setActiveAITool] = useState<'brief' | 'dfm'>('dfm');

  const handleAnalysisComplete = (results: BriefAnalysisResult) => {
    console.log('Brief analysis complete:', results);
  };

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
        <div className="flex gap-2 border-b pb-4">
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
            onClick={() => setActiveAITool('brief')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              activeAITool === 'brief'
                ? 'bg-[#1d1d1f] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            📝 Brief Analyzer
          </button>
        </div>

        {/* Active Tool with Suspense */}
        <Suspense fallback={<LoadingFallback />}>
          {activeAITool === 'dfm' && (
            <DfMChecker
              designItem={item as any}
              onIssuesFound={handleIssuesFound}
              onResolveIssue={(ruleId: string) => console.log('Resolved:', ruleId)}
            />
          )}

          {activeAITool === 'brief' && (
            <BriefAnalyzer
              projectId={projectId}
              onAnalysisComplete={handleAnalysisComplete}
              onApplyItem={(extractedItem) => console.log('Apply item:', extractedItem)}
            />
          )}
        </Suspense>
      </div>
    </AIErrorBoundary>
  );
}
