/**
 * TaskDetailDialog Component
 * Modal dialog showing full task details with checklist management
 */

import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Clock,
  Play,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  Folder,
  CheckSquare,
  XCircle,
  Building2,
  ExternalLink,
} from 'lucide-react';

import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Progress } from '@/core/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';

import type { EmployeeTask } from '../../hooks/useEmployeeTaskInbox';
import { getDueDateStatus, formatDueDate } from '../../hooks/useEmployeeTaskInbox';
import { getEntityRoute, getProjectRoute } from '../../utils/getEntityRoute';

// ============================================
// Types
// ============================================

interface TaskDetailDialogProps {
  task: EmployeeTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart?: (taskId: string) => void;
  onComplete?: (taskId: string) => void;
  onBlock?: (taskId: string) => void;
  onChecklistItemChange?: (taskId: string, itemId: string, completed: boolean) => void;
}

// ============================================
// Priority Badge Component
// ============================================

function PriorityBadge({ priority }: { priority: string }) {
  switch (priority) {
    case 'P0':
      return <Badge className="bg-red-500 hover:bg-red-500 text-white">Critical</Badge>;
    case 'P1':
      return <Badge className="bg-orange-500 hover:bg-orange-500 text-white">High</Badge>;
    case 'P2':
      return <Badge className="bg-blue-500 hover:bg-blue-500 text-white">Medium</Badge>;
    case 'P3':
      return <Badge className="bg-gray-500 hover:bg-gray-500 text-white">Low</Badge>;
    default:
      return <Badge variant="outline">{priority}</Badge>;
  }
}

// ============================================
// Status Badge Component
// ============================================

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    case 'in_progress':
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
          <Play className="h-3 w-3 mr-1" />
          In Progress
        </Badge>
      );
    case 'pending':
      return (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case 'blocked':
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
          <AlertCircle className="h-3 w-3 mr-1" />
          Blocked
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
          <XCircle className="h-3 w-3 mr-1" />
          Cancelled
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// ============================================
// TaskDetailDialog Component
// ============================================

export function TaskDetailDialog({
  task,
  open,
  onOpenChange,
  onStart,
  onComplete,
  onBlock,
  onChecklistItemChange,
}: TaskDetailDialogProps) {
  const navigate = useNavigate();

  if (!task) return null;

  const dueDateStatus = getDueDateStatus(task.dueDate);
  const entityRoute = getEntityRoute({
    entityType: task.entityType,
    entityId: task.entityId,
    projectId: task.projectId,
    sourceModule: task.sourceModule,
  });
  const projectRoute = getProjectRoute({
    projectId: task.projectId,
    sourceModule: task.sourceModule,
  });
  const hasChecklist = task.checklistItems && task.checklistItems.length > 0;
  const completedItems = task.checklistItems?.filter((i) => i.completed).length || 0;
  const totalItems = task.checklistItems?.length || 0;

  const handleStart = () => {
    onStart?.(task.id);
    onOpenChange(false);
  };

  const handleComplete = () => {
    onComplete?.(task.id);
    onOpenChange(false);
  };

  const handleBlock = () => {
    onBlock?.(task.id);
    onOpenChange(false);
  };

  const handleChecklistChange = (itemId: string, completed: boolean) => {
    onChecklistItemChange?.(task.id, itemId, completed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-500" />
            Task Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} />
            </div>
            <h3 className="text-lg font-semibold">{task.title}</h3>
            {task.description && (
              <p className="text-muted-foreground mt-2">{task.description}</p>
            )}
          </div>

          {/* Meta Info Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            {/* Due Date */}
            <div>
              <label className="text-xs text-muted-foreground">Due Date</label>
              <p
                className={`font-medium flex items-center gap-1.5 ${
                  dueDateStatus === 'overdue'
                    ? 'text-red-600'
                    : dueDateStatus === 'today'
                    ? 'text-orange-600'
                    : ''
                }`}
              >
                <Calendar className="h-4 w-4" />
                {task.dueDate ? formatDueDate(task.dueDate) : 'No due date'}
                {dueDateStatus === 'overdue' && ' (Overdue)'}
                {dueDateStatus === 'today' && ' (Today)'}
              </p>
            </div>

            {/* Source Module */}
            <div>
              <label className="text-xs text-muted-foreground">Source Module</label>
              <p className="font-medium flex items-center gap-1.5 capitalize">
                <Folder className="h-4 w-4" />
                {task.sourceModule.replace(/_/g, ' ')}
              </p>
            </div>

            {/* Subsidiary */}
            <div>
              <label className="text-xs text-muted-foreground">Subsidiary</label>
              <p className="font-medium flex items-center gap-1.5 capitalize">
                <Building2 className="h-4 w-4" />
                {task.subsidiary || '-'}
              </p>
            </div>

            {/* Project */}
            {task.projectName && (
              <div>
                <label className="text-xs text-muted-foreground">Project</label>
                {projectRoute ? (
                  <button
                    onClick={() => { navigate(projectRoute); onOpenChange(false); }}
                    className="font-medium text-blue-600 hover:underline flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    {task.projectName}
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </button>
                ) : (
                  <p className="font-medium">{task.projectName}</p>
                )}
              </div>
            )}

            {/* Source Entity */}
            {entityRoute && task.entityType !== 'project' && (
              <div>
                <label className="text-xs text-muted-foreground">Source Item</label>
                <button
                  onClick={() => { navigate(entityRoute); onOpenChange(false); }}
                  className="font-medium text-blue-600 hover:underline flex items-center gap-1.5 cursor-pointer text-left"
                >
                  {task.entityName || task.entityType?.replace(/-/g, ' ')}
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </button>
              </div>
            )}

            {/* Assigned To */}
            <div>
              <label className="text-xs text-muted-foreground">Assigned To</label>
              <p className="font-medium flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {task.assignedToName || 'You'}
              </p>
            </div>

            {/* Created */}
            <div>
              <label className="text-xs text-muted-foreground">Created</label>
              <p className="font-medium">
                {task.createdAt?.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }) || '-'}
              </p>
            </div>
          </div>

          {/* Checklist Section */}
          {hasChecklist && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Checklist ({completedItems}/{totalItems})
                </h4>
                <Progress value={task.checklistProgress} className="h-2 w-24" />
              </div>
              <div className="space-y-2">
                {task.checklistItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={(e) => handleChecklistChange(item.id, e.target.checked)}
                      className="h-4 w-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      disabled={task.status === 'completed' || task.status === 'cancelled'}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${
                          item.completed ? 'line-through text-muted-foreground' : ''
                        }`}
                      >
                        {item.title}
                        {item.isRequired && <span className="text-red-500 ml-1">*</span>}
                      </p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.description}
                        </p>
                      )}
                      {item.completed && item.completedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Completed{' '}
                          {new Date(item.completedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                          {item.completedBy && ` by ${item.completedBy}`}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes Section */}
          {task.notes && (
            <div>
              <h4 className="font-medium mb-2">Notes</h4>
              <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                {task.notes}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <div className="flex gap-2">
              {task.status === 'pending' && (
                <Button variant="outline" onClick={handleStart}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Task
                </Button>
              )}
              {task.status === 'in_progress' && (
                <>
                  <Button variant="outline" onClick={handleComplete}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete
                  </Button>
                  <Button variant="outline" onClick={handleBlock}>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Mark Blocked
                  </Button>
                </>
              )}
              {task.status === 'blocked' && (
                <Button variant="outline" onClick={handleStart}>
                  <Play className="h-4 w-4 mr-2" />
                  Resume Task
                </Button>
              )}
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TaskDetailDialog;
