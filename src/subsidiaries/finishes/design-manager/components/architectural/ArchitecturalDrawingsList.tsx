/**
 * ArchitecturalDrawingsList Component
 * Display and manage architectural drawings for a project
 */

import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  FileText,
  Grid3X3,
  List,
  ChevronRight,
  Clock,
  User,
  Share2,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Upload,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/core/components/ui/dialog';
import {
  subscribeToArchitecturalDrawings,
  createArchitecturalDrawing,
  deleteArchitecturalDrawing,
  shareDrawingToPortal,
} from '../../services/architecturalService';
import type {
  ArchitecturalDrawing,
  ArchitecturalStage,
  ArchitecturalDrawingType,
  ArchitecturalDrawingFilters,
} from '../../types/architectural';
import {
  ARCHITECTURAL_STAGE_LABELS,
  DRAWING_TYPE_LABELS,
  ARCHITECTURAL_STAGE_ORDER,
} from '../../types/architectural';

interface ArchitecturalDrawingsListProps {
  projectId: string;
  projectCode: string;
  userId: string;
  onDrawingClick?: (drawingId: string) => void;
}

type ViewMode = 'list' | 'grid' | 'kanban';

const STAGE_COLORS: Record<ArchitecturalStage, string> = {
  'arch-concept': 'bg-gray-100 text-gray-700',
  'arch-development': 'bg-blue-100 text-blue-700',
  'arch-review': 'bg-yellow-100 text-yellow-700',
  'arch-client-review': 'bg-purple-100 text-purple-700',
  'arch-revision': 'bg-orange-100 text-orange-700',
  'arch-approved': 'bg-green-100 text-green-700',
};

const DRAWING_TYPE_ICONS: Record<ArchitecturalDrawingType, string> = {
  'floor-plan': '🏠',
  'elevation': '🏢',
  'section': '📐',
  'detail': '🔍',
  'reflected-ceiling-plan': '💡',
  'site-plan': '🗺️',
  'roof-plan': '🏗️',
  'schedule': '📋',
};

export function ArchitecturalDrawingsList({
  projectId,
  projectCode,
  userId,
  onDrawingClick,
}: ArchitecturalDrawingsListProps) {
  const [drawings, setDrawings] = useState<ArchitecturalDrawing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<ArchitecturalStage | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ArchitecturalDrawingType | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const [showNewDrawingDialog, setShowNewDrawingDialog] = useState(false);
  const [newDrawingData, setNewDrawingData] = useState({
    name: '',
    drawingType: 'floor-plan' as ArchitecturalDrawingType,
    description: '',
    scale: '1:50',
  });
  const [creating, setCreating] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Subscribe to drawings
  useEffect(() => {
    const filters: ArchitecturalDrawingFilters = {};
    if (stageFilter !== 'all') filters.stage = stageFilter;
    if (typeFilter !== 'all') filters.drawingType = typeFilter;

    const unsubscribe = subscribeToArchitecturalDrawings(
      projectId,
      (data) => {
        setDrawings(data);
        setLoading(false);
      },
      filters
    );

    return () => unsubscribe();
  }, [projectId, stageFilter, typeFilter]);

  // Filter drawings by search
  const filteredDrawings = drawings.filter((d) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      d.name.toLowerCase().includes(searchLower) ||
      d.drawingNumber.toLowerCase().includes(searchLower) ||
      d.description?.toLowerCase().includes(searchLower)
    );
  });

  // Group by stage for kanban view
  const drawingsByStage = ARCHITECTURAL_STAGE_ORDER.reduce((acc, stage) => {
    acc[stage] = filteredDrawings.filter((d) => d.currentStage === stage);
    return acc;
  }, {} as Record<ArchitecturalStage, ArchitecturalDrawing[]>);

  const handleCreate = async () => {
    if (!newDrawingData.name.trim()) return;

    setCreating(true);
    try {
      const drawingId = await createArchitecturalDrawing(
        projectId,
        {
          name: newDrawingData.name,
          drawingType: newDrawingData.drawingType,
          description: newDrawingData.description,
          scale: newDrawingData.scale,
        },
        projectCode,
        userId
      );

      setShowNewDrawingDialog(false);
      setNewDrawingData({
        name: '',
        drawingType: 'floor-plan',
        description: '',
        scale: '1:50',
      });

      // Navigate to the new drawing
      onDrawingClick?.(drawingId);
    } catch (err) {
      setError(err as Error);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (drawingId: string) => {
    setDeleting(true);
    try {
      await deleteArchitecturalDrawing(projectId, drawingId);
      setDeleteConfirm(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setDeleting(false);
    }
  };

  const handleShareToPortal = async (drawingId: string) => {
    try {
      await shareDrawingToPortal(projectId, drawingId, userId);
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
    });
  };

  const DrawingCard = ({ drawing }: { drawing: ArchitecturalDrawing }) => (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onDrawingClick?.(drawing.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{DRAWING_TYPE_ICONS[drawing.drawingType]}</span>
            <div>
              <p className="font-mono text-sm text-gray-500">{drawing.drawingNumber}</p>
              <p className="font-medium text-gray-900">{drawing.name}</p>
            </div>
          </div>
          <Badge className={STAGE_COLORS[drawing.currentStage]}>
            {ARCHITECTURAL_STAGE_LABELS[drawing.currentStage]}
          </Badge>
        </div>

        {drawing.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{drawing.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(drawing.updatedAt)}
          </div>
          <div className="flex items-center gap-2">
            {drawing.scale && <span>Scale: {drawing.scale}</span>}
            {drawing.sharedToPortal && (
              <Badge variant="outline" className="text-xs">
                <Share2 className="h-3 w-3 mr-1" />
                Shared
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Architectural Drawings</h2>
        <Button onClick={() => setShowNewDrawingDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Drawing
        </Button>
      </div>

      {/* Search, Filters & View Toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search drawings..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>

        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value as ArchitecturalStage | 'all')}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary"
        >
          <option value="all">All Stages</option>
          {ARCHITECTURAL_STAGE_ORDER.map((stage) => (
            <option key={stage} value={stage}>
              {ARCHITECTURAL_STAGE_LABELS[stage]}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ArchitecturalDrawingType | 'all')}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary"
        >
          <option value="all">All Types</option>
          {Object.entries(DRAWING_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {DRAWING_TYPE_ICONS[key as ArchitecturalDrawingType]} {label}
            </option>
          ))}
        </select>

        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            title="List view"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            title="Grid view"
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-2 ${viewMode === 'kanban' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            title="Kanban view"
          >
            <FileText className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          {error.message}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading drawings...</div>
      ) : filteredDrawings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No drawings found</h3>
            <p className="text-gray-500 mt-1">
              {search || stageFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first architectural drawing to get started'}
            </p>
            {!search && stageFilter === 'all' && typeFilter === 'all' && (
              <Button className="mt-4" onClick={() => setShowNewDrawingDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Drawing
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        /* List View */
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Drawing #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Stage
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Scale
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Files
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Updated
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDrawings.map((drawing) => (
                  <tr
                    key={drawing.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => onDrawingClick?.(drawing.id)}
                  >
                    <td className="px-4 py-3 font-mono text-sm text-gray-600">
                      {drawing.drawingNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{DRAWING_TYPE_ICONS[drawing.drawingType]}</span>
                        <span className="font-medium text-gray-900">{drawing.name}</span>
                        {drawing.sharedToPortal && (
                          <Share2 className="h-3 w-3 text-purple-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {DRAWING_TYPE_LABELS[drawing.drawingType]}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={STAGE_COLORS[drawing.currentStage]}>
                        {ARCHITECTURAL_STAGE_LABELS[drawing.currentStage]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {drawing.scale || '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {drawing.files.length}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(drawing.updatedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onDrawingClick?.(drawing.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDrawingClick?.(drawing.id)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {!drawing.sharedToPortal && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShareToPortal(drawing.id);
                              }}
                            >
                              <Share2 className="h-4 w-4 mr-2" />
                              Share to Portal
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm(drawing.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDrawings.map((drawing) => (
            <DrawingCard key={drawing.id} drawing={drawing} />
          ))}
        </div>
      ) : (
        /* Kanban View */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {ARCHITECTURAL_STAGE_ORDER.map((stage) => (
            <div key={stage} className="flex-shrink-0 w-72">
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">
                    {ARCHITECTURAL_STAGE_LABELS[stage]}
                  </h3>
                  <Badge variant="secondary">{drawingsByStage[stage].length}</Badge>
                </div>
                <div className="space-y-3">
                  {drawingsByStage[stage].map((drawing) => (
                    <Card
                      key={drawing.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => onDrawingClick?.(drawing.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span>{DRAWING_TYPE_ICONS[drawing.drawingType]}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-xs text-gray-500">
                              {drawing.drawingNumber}
                            </p>
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {drawing.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{DRAWING_TYPE_LABELS[drawing.drawingType]}</span>
                          {drawing.sharedToPortal && (
                            <Share2 className="h-3 w-3 text-purple-500" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {drawingsByStage[stage].length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-4">No drawings</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Drawing Dialog */}
      <Dialog open={showNewDrawingDialog} onOpenChange={setShowNewDrawingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Architectural Drawing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Drawing Name *
              </label>
              <input
                type="text"
                value={newDrawingData.name}
                onChange={(e) =>
                  setNewDrawingData({ ...newDrawingData, name: e.target.value })
                }
                placeholder="e.g., Ground Floor Plan"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Drawing Type *
              </label>
              <select
                value={newDrawingData.drawingType}
                onChange={(e) =>
                  setNewDrawingData({
                    ...newDrawingData,
                    drawingType: e.target.value as ArchitecturalDrawingType,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary"
              >
                {Object.entries(DRAWING_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {DRAWING_TYPE_ICONS[key as ArchitecturalDrawingType]} {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scale</label>
              <select
                value={newDrawingData.scale}
                onChange={(e) =>
                  setNewDrawingData({ ...newDrawingData, scale: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary"
              >
                <option value="1:20">1:20</option>
                <option value="1:50">1:50</option>
                <option value="1:100">1:100</option>
                <option value="1:200">1:200</option>
                <option value="1:500">1:500</option>
                <option value="NTS">NTS (Not to Scale)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newDrawingData.description}
                onChange={(e) =>
                  setNewDrawingData({ ...newDrawingData, description: e.target.value })
                }
                placeholder="Optional description..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewDrawingDialog(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating || !newDrawingData.name.trim()}>
              {creating ? 'Creating...' : 'Create Drawing'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Drawing</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Are you sure you want to delete this drawing? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ArchitecturalDrawingsList;
