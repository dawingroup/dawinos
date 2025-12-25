/**
 * Design Item Detail
 * Full detail view for a design item
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Activity, CheckSquare, History, Sparkles } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useDesignItem, useProject, useRAGUpdate } from '../../hooks';
import { StageBadge } from './StageBadge';
import { ReadinessGauge } from './ReadinessGauge';
import { RAGStagePanel } from '../traffic-light/RAGStagePanel';
import { RAGEditModal } from '../traffic-light/RAGEditModal';
import { StageGateCheck } from '../stage-gate/StageGateCheck';
import { CATEGORY_LABELS, formatDateTime } from '../../utils/formatting';
import { getNextStage } from '../../utils/stage-gate';
import { transitionStage } from '../../services/firestore';
import { useAuth } from '@/shared/hooks';
import type { RAGStatus, RAGValue, RAGStatusValue } from '../../types';

type Tab = 'overview' | 'rag' | 'files' | 'approvals' | 'history' | 'ai';

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A7C8E]"></div>
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
          className="text-[#0A7C8E] hover:underline mt-2 inline-block"
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
              className="px-4 py-2 bg-[#0A7C8E] text-white rounded-lg hover:bg-[#086a7a] text-sm font-medium"
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
                    ? 'border-[#0A7C8E] text-[#0A7C8E]'
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
        
        {activeTab === 'files' && (
          <FilesTab item={item} />
        )}
        
        {activeTab === 'approvals' && (
          <ApprovalsTab item={item} />
        )}
        
        {activeTab === 'history' && (
          <HistoryTab item={item} />
        )}
        
        {activeTab === 'ai' && (
          <AITab />
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
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
        <p className="text-gray-900">{item.description || 'No description provided.'}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Priority</h3>
          <p className="text-gray-900 capitalize">{item.priority || 'Not set'}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Due Date</h3>
          <p className="text-gray-900">
            {item.dueDate 
              ? new Date(item.dueDate.seconds * 1000).toLocaleDateString() 
              : 'Not set'}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Created</h3>
          <p className="text-gray-900">{formatDateTime(item.createdAt)}</p>
          <p className="text-sm text-gray-500">by {item.createdBy}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Last Updated</h3>
          <p className="text-gray-900">{formatDateTime(item.updatedAt)}</p>
          <p className="text-sm text-gray-500">by {item.updatedBy}</p>
        </div>
      </div>
    </div>
  );
}

function FilesTab({ item }: { item: NonNullable<ReturnType<typeof useDesignItem>['item']> }) {
  if (item.files.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No files attached yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {item.files.map((file) => (
        <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500">{file.category}</p>
            </div>
          </div>
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#0A7C8E] hover:underline"
          >
            View
          </a>
        </div>
      ))}
    </div>
  );
}

function ApprovalsTab({ item }: { item: NonNullable<ReturnType<typeof useDesignItem>['item']> }) {
  if (item.approvals.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No approvals requested yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {item.approvals.map((approval) => (
        <div key={approval.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900 capitalize">{approval.type} Approval</p>
            <p className="text-xs text-gray-500">Requested by {approval.requestedBy}</p>
          </div>
          <span className={cn(
            'text-xs px-2 py-1 rounded-full font-medium',
            approval.status === 'approved' && 'bg-green-100 text-green-700',
            approval.status === 'rejected' && 'bg-red-100 text-red-700',
            approval.status === 'pending' && 'bg-amber-100 text-amber-700',
            approval.status === 'revision-requested' && 'bg-blue-100 text-blue-700'
          )}>
            {approval.status}
          </span>
        </div>
      ))}
    </div>
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
          <div className="w-2 h-2 bg-[#0A7C8E] rounded-full mt-2" />
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

function AITab() {
  return (
    <div className="text-center py-8">
      <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <h3 className="text-lg font-medium text-gray-900">AI Analysis</h3>
      <p className="text-gray-500 mt-1">Coming soon - AI-powered design analysis and recommendations.</p>
    </div>
  );
}
