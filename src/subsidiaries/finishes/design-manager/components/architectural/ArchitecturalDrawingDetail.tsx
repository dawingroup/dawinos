/**
 * ArchitecturalDrawingDetail Component
 * Detailed view and management of a single architectural drawing
 */

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  FileText,
  Upload,
  Download,
  Share2,
  Check,
  X,
  Clock,
  User,
  ChevronRight,
  AlertCircle,
  History,
  MessageSquare,
  Pencil,
  Trash2,
  Eye,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/core/components/ui/dialog';
import {
  subscribeToArchitecturalDrawing,
  updateArchitecturalDrawing,
  uploadArchitecturalDrawingFile,
  deleteArchitecturalDrawingFile,
  transitionArchitecturalStage,
  requestArchitecturalApproval,
  respondToArchitecturalApproval,
  shareDrawingToPortal,
  unshareDrawingFromPortal,
  canTransitionToStage,
} from '../../services/architecturalService';
import type {
  ArchitecturalDrawing,
  ArchitecturalStage,
  ArchitecturalDrawingFile,
  ArchitecturalApprovalRecord,
} from '../../types/architectural';
import {
  ARCHITECTURAL_STAGE_LABELS,
  ARCHITECTURAL_STAGE_ORDER,
  DRAWING_TYPE_LABELS,
} from '../../types/architectural';

interface ArchitecturalDrawingDetailProps {
  projectId: string;
  drawingId: string;
  userId: string;
  onBack?: () => void;
}

type Tab = 'overview' | 'files' | 'approvals' | 'history';

const STAGE_COLORS: Record<ArchitecturalStage, string> = {
  'arch-concept': 'bg-gray-500',
  'arch-development': 'bg-blue-500',
  'arch-review': 'bg-yellow-500',
  'arch-client-review': 'bg-purple-500',
  'arch-revision': 'bg-orange-500',
  'arch-approved': 'bg-green-500',
};

export function ArchitecturalDrawingDetail({
  projectId,
  drawingId,
  userId,
  onBack,
}: ArchitecturalDrawingDetailProps) {
  const [drawing, setDrawing] = useState<ArchitecturalDrawing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // File upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<ArchitecturalDrawing>>({});

  // Stage transition state
  const [transitioningStage, setTransitioningStage] = useState(false);
  const [transitionNotes, setTransitionNotes] = useState('');
  const [showTransitionDialog, setShowTransitionDialog] = useState(false);
  const [targetStage, setTargetStage] = useState<ArchitecturalStage | null>(null);
  const [transitionBlockers, setTransitionBlockers] = useState<string[]>([]);

  // Approval state
  const [requestingApproval, setRequestingApproval] = useState(false);
  const [approvalType, setApprovalType] = useState<'internal' | 'client'>('internal');

  // Subscribe to drawing
  useEffect(() => {
    const unsubscribe = subscribeToArchitecturalDrawing(projectId, drawingId, (data) => {
      setDrawing(data);
      setLoading(false);
      if (data) {
        setEditData({
          name: data.name,
          description: data.description,
          scale: data.scale,
          sheetSize: data.sheetSize,
          notes: data.notes,
        });
      }
    });

    return () => unsubscribe();
  }, [projectId, drawingId]);

  const handleSaveEdit = async () => {
    if (!drawing) return;
    try {
      await updateArchitecturalDrawing(projectId, drawingId, editData, userId);
      setEditing(false);
    } catch (err) {
      setError(err as Error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      await uploadArchitecturalDrawingFile(
        projectId,
        drawingId,
        file,
        userId,
        (progress) => setUploadProgress(progress)
      );
    } catch (err) {
      setError(err as Error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await deleteArchitecturalDrawingFile(projectId, drawingId, fileId, userId);
    } catch (err) {
      setError(err as Error);
    }
  };

  const handleStageTransition = (stage: ArchitecturalStage) => {
    if (!drawing) return;

    const { canTransition, blockers } = canTransitionToStage(drawing, stage);
    setTargetStage(stage);
    setTransitionBlockers(blockers);
    setTransitionNotes('');
    setShowTransitionDialog(true);
  };

  const confirmStageTransition = async () => {
    if (!targetStage || !drawing) return;

    setTransitioningStage(true);
    try {
      await transitionArchitecturalStage(
        projectId,
        drawingId,
        targetStage,
        userId,
        transitionNotes
      );
      setShowTransitionDialog(false);
      setTargetStage(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setTransitioningStage(false);
    }
  };

  const handleRequestApproval = async (type: 'internal' | 'client') => {
    setRequestingApproval(true);
    try {
      await requestArchitecturalApproval(projectId, drawingId, type, userId);
    } catch (err) {
      setError(err as Error);
    } finally {
      setRequestingApproval(false);
    }
  };

  const handleRespondToApproval = async (
    approvalId: string,
    status: 'approved' | 'rejected' | 'revision-requested',
    notes?: string
  ) => {
    try {
      await respondToArchitecturalApproval(
        projectId,
        drawingId,
        approvalId,
        status,
        notes,
        userId
      );
    } catch (err) {
      setError(err as Error);
    }
  };

  const handleShareToPortal = async () => {
    try {
      if (drawing?.sharedToPortal) {
        await unshareDrawingFromPortal(projectId, drawingId, userId);
      } else {
        await shareDrawingToPortal(projectId, drawingId, userId);
      }
    } catch (err) {
      setError(err as Error);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getNextStage = (): ArchitecturalStage | null => {
    if (!drawing) return null;
    const currentIndex = ARCHITECTURAL_STAGE_ORDER.indexOf(drawing.currentStage);
    if (currentIndex < ARCHITECTURAL_STAGE_ORDER.length - 1) {
      return ARCHITECTURAL_STAGE_ORDER[currentIndex + 1];
    }
    return null;
  };

  const getPreviousStage = (): ArchitecturalStage | null => {
    if (!drawing) return null;
    const currentIndex = ARCHITECTURAL_STAGE_ORDER.indexOf(drawing.currentStage);
    if (currentIndex > 0) {
      return ARCHITECTURAL_STAGE_ORDER[currentIndex - 1];
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!drawing) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">Drawing not found</h3>
          <p className="text-gray-500 mt-1">This drawing may have been deleted.</p>
          {onBack && (
            <Button variant="outline" className="mt-4" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const currentFile = drawing.files.find((f) => f.isCurrentVersion) || drawing.files[0];
  const nextStage = getNextStage();
  const previousStage = getPreviousStage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{drawing.name}</h1>
              <Badge className={`${STAGE_COLORS[drawing.currentStage]} text-white`}>
                {ARCHITECTURAL_STAGE_LABELS[drawing.currentStage]}
              </Badge>
              {drawing.sharedToPortal && (
                <Badge variant="outline" className="text-purple-600 border-purple-300">
                  <Share2 className="h-3 w-3 mr-1" />
                  Shared to Portal
                </Badge>
              )}
            </div>
            <p className="text-gray-500">
              <span className="font-mono">{drawing.drawingNumber}</span>
              {' · '}
              {DRAWING_TYPE_LABELS[drawing.drawingType]}
              {drawing.scale && ` · Scale: ${drawing.scale}`}
              {' · '}v{drawing.version}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleShareToPortal}>
            <Share2 className="h-4 w-4 mr-2" />
            {drawing.sharedToPortal ? 'Unshare' : 'Share to Portal'}
          </Button>
          {nextStage && (
            <Button onClick={() => handleStageTransition(nextStage)}>
              Advance to {ARCHITECTURAL_STAGE_LABELS[nextStage]}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Stage Progress */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2">
            {ARCHITECTURAL_STAGE_ORDER.map((stage, index) => {
              const currentIndex = ARCHITECTURAL_STAGE_ORDER.indexOf(drawing.currentStage);
              const isComplete = index < currentIndex;
              const isCurrent = index === currentIndex;
              const isUpcoming = index > currentIndex;

              return (
                <div key={stage} className="flex items-center flex-1">
                  <button
                    onClick={() => {
                      if (isUpcoming || isComplete) {
                        handleStageTransition(stage);
                      }
                    }}
                    disabled={isCurrent}
                    className={`
                      flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-colors
                      ${isCurrent ? 'bg-primary text-white' : ''}
                      ${isComplete ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}
                      ${isUpcoming ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : ''}
                    `}
                  >
                    {ARCHITECTURAL_STAGE_LABELS[stage]}
                  </button>
                  {index < ARCHITECTURAL_STAGE_ORDER.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-gray-300 mx-1 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error.message}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="files">
            Files ({drawing.files.length})
          </TabsTrigger>
          <TabsTrigger value="approvals">
            Approvals ({drawing.approvals.length})
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Details</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)}>
                <Pencil className="h-4 w-4 mr-1" />
                {editing ? 'Cancel' : 'Edit'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editData.name || ''}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={editData.description || ''}
                      onChange={(e) =>
                        setEditData({ ...editData, description: e.target.value })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Scale
                      </label>
                      <select
                        value={editData.scale || ''}
                        onChange={(e) => setEditData({ ...editData, scale: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select scale</option>
                        <option value="1:20">1:20</option>
                        <option value="1:50">1:50</option>
                        <option value="1:100">1:100</option>
                        <option value="1:200">1:200</option>
                        <option value="NTS">NTS</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sheet Size
                      </label>
                      <select
                        value={editData.sheetSize || ''}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            sheetSize: e.target.value as any,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select size</option>
                        <option value="A0">A0</option>
                        <option value="A1">A1</option>
                        <option value="A2">A2</option>
                        <option value="A3">A3</option>
                        <option value="A4">A4</option>
                        <option value="ARCH-D">ARCH-D</option>
                        <option value="ARCH-E">ARCH-E</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={editData.notes || ''}
                      onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveEdit}>Save Changes</Button>
                  </div>
                </>
              ) : (
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Drawing Number</dt>
                    <dd className="mt-1 font-mono">{drawing.drawingNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Type</dt>
                    <dd className="mt-1">{DRAWING_TYPE_LABELS[drawing.drawingType]}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Scale</dt>
                    <dd className="mt-1">{drawing.scale || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Sheet Size</dt>
                    <dd className="mt-1">{drawing.sheetSize || '-'}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="mt-1 text-gray-700">
                      {drawing.description || 'No description'}
                    </dd>
                  </div>
                  {drawing.notes && (
                    <div className="col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Notes</dt>
                      <dd className="mt-1 text-gray-700">{drawing.notes}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="mt-1 text-sm text-gray-600">
                      {formatDate(drawing.createdAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                    <dd className="mt-1 text-sm text-gray-600">
                      {formatDate(drawing.updatedAt)}
                    </dd>
                  </div>
                </dl>
              )}
            </CardContent>
          </Card>

          {/* Current File Preview */}
          {currentFile && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Current Drawing</CardTitle>
              </CardHeader>
              <CardContent>
                {currentFile.mimeType === 'application/pdf' ? (
                  <iframe
                    src={`${currentFile.url}#view=FitH`}
                    className="w-full h-[500px] border rounded-lg"
                    title={currentFile.name}
                  />
                ) : currentFile.mimeType.startsWith('image/') ? (
                  <img
                    src={currentFile.url}
                    alt={currentFile.name}
                    className="max-w-full h-auto rounded-lg"
                  />
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">Preview not available</p>
                    <Button variant="outline" className="mt-4" asChild>
                      <a href={currentFile.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open File
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Drawing Files</CardTitle>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <Button disabled={uploading} asChild>
                  <span>
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {uploadProgress.toFixed(0)}%
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload File
                      </>
                    )}
                  </span>
                </Button>
              </label>
            </CardHeader>
            <CardContent>
              {drawing.files.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No files uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {drawing.files.map((file) => (
                    <div
                      key={file.id}
                      className={`
                        flex items-center justify-between p-3 rounded-lg border
                        ${file.isCurrentVersion ? 'border-primary bg-primary/5' : 'border-gray-200'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {file.name}
                            {file.isCurrentVersion && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                Current
                              </Badge>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(file.size)} · {formatDate(file.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <a href={file.url} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={file.url} download={file.name}>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFile(file.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Approval Workflow</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRequestApproval('internal')}
                  disabled={requestingApproval}
                >
                  Request Internal Review
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleRequestApproval('client')}
                  disabled={requestingApproval}
                >
                  Request Client Approval
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {drawing.approvals.length === 0 ? (
                <div className="text-center py-8">
                  <Check className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No approval requests yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {drawing.approvals.map((approval) => (
                    <div
                      key={approval.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`
                          w-10 h-10 rounded-full flex items-center justify-center
                          ${approval.status === 'approved' ? 'bg-green-100' : ''}
                          ${approval.status === 'rejected' ? 'bg-red-100' : ''}
                          ${approval.status === 'pending' ? 'bg-yellow-100' : ''}
                          ${approval.status === 'revision-requested' ? 'bg-orange-100' : ''}
                        `}
                        >
                          {approval.status === 'approved' && (
                            <Check className="h-5 w-5 text-green-600" />
                          )}
                          {approval.status === 'rejected' && (
                            <X className="h-5 w-5 text-red-600" />
                          )}
                          {approval.status === 'pending' && (
                            <Clock className="h-5 w-5 text-yellow-600" />
                          )}
                          {approval.status === 'revision-requested' && (
                            <MessageSquare className="h-5 w-5 text-orange-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {approval.type === 'internal' ? 'Internal Review' : 'Client Approval'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Requested {formatDate(approval.requestedAt)}
                            {approval.respondedAt && (
                              <> · Responded {formatDate(approval.respondedAt)}</>
                            )}
                          </p>
                          {approval.notes && (
                            <p className="text-sm text-gray-600 mt-1">{approval.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            approval.status === 'approved'
                              ? 'default'
                              : approval.status === 'rejected'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {approval.status}
                        </Badge>
                        {approval.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600"
                              onClick={() => handleRespondToApproval(approval.id, 'approved')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => handleRespondToApproval(approval.id, 'rejected')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stage History</CardTitle>
            </CardHeader>
            <CardContent>
              {drawing.stageHistory.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No history available</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
                  <div className="space-y-4">
                    {drawing.stageHistory.map((entry, index) => (
                      <div key={entry.id || index} className="relative flex gap-4 pl-8">
                        <div className="absolute left-2.5 w-3 h-3 rounded-full bg-gray-300 border-2 border-white" />
                        <div className="flex-1 pb-4">
                          <p className="font-medium text-gray-900">
                            {entry.fromStage
                              ? `${ARCHITECTURAL_STAGE_LABELS[entry.fromStage]} → `
                              : ''}
                            {ARCHITECTURAL_STAGE_LABELS[entry.toStage]}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(entry.transitionedAt)}
                          </p>
                          {entry.notes && (
                            <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stage Transition Dialog */}
      <Dialog open={showTransitionDialog} onOpenChange={setShowTransitionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {targetStage && transitionBlockers.length === 0
                ? `Move to ${ARCHITECTURAL_STAGE_LABELS[targetStage]}?`
                : 'Cannot Transition'}
            </DialogTitle>
          </DialogHeader>

          {transitionBlockers.length > 0 ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                The following requirements must be met before transitioning:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                {transitionBlockers.map((blocker, i) => (
                  <li key={i}>{blocker}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                Add optional notes for this transition.
              </p>
              <textarea
                value={transitionNotes}
                onChange={(e) => setTransitionNotes(e.target.value)}
                placeholder="Optional notes..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransitionDialog(false)}>
              {transitionBlockers.length > 0 ? 'Close' : 'Cancel'}
            </Button>
            {transitionBlockers.length === 0 && (
              <Button onClick={confirmStageTransition} disabled={transitioningStage}>
                {transitioningStage ? 'Moving...' : 'Confirm'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ArchitecturalDrawingDetail;
