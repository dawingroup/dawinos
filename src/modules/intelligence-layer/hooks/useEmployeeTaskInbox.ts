/**
 * useEmployeeTaskInbox Hook
 * Manages task data, filters, and real-time subscriptions for the Employee Task Inbox
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/shared/services/firebase/firestore';
import { useAuth } from '@/integration/store';
import { taskGenerationService } from '../services/taskGenerationService';

// ============================================
// Types
// ============================================

export interface TaskChecklistItem {
  id: string;
  title: string;
  description?: string;
  isRequired: boolean;
  completed: boolean;
  completedAt?: Date;
  completedBy?: string;
}

export interface EmployeeTask {
  id: string;
  businessEventId: string;
  templateId: string;
  title: string;
  description: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'blocked';
  assignedTo?: string;
  assignedToName?: string;
  assignedAt?: Date;
  dueDate?: Date;
  startedAt?: Date;
  completedAt?: Date;
  checklistItems: TaskChecklistItem[];
  checklistProgress: number;
  sourceModule: string;
  subsidiary: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  projectId?: string;
  projectName?: string;
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
  notes?: string;
}

export type TaskStatusFilter = 'all' | 'pending' | 'in_progress' | 'completed' | 'blocked';
export type TaskPriorityFilter = 'all' | 'P0' | 'P1' | 'P2' | 'P3';
export type TaskGroupBy = 'none' | 'status' | 'priority' | 'dueDate';

export interface TaskFilters {
  status: TaskStatusFilter;
  priority: TaskPriorityFilter;
  groupBy: TaskGroupBy;
  searchQuery: string;
}

export interface TaskInboxStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  blocked: number;
  overdue: number;
  dueToday: number;
  dueSoon: number; // Within 3 days
}

export interface GroupedTasks {
  [groupKey: string]: EmployeeTask[];
}

// ============================================
// Hook Implementation
// ============================================

export function useEmployeeTaskInbox() {
  const { user, userId } = useAuth();
  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({
    status: 'all',
    priority: 'all',
    groupBy: 'none',
    searchQuery: '',
  });

  // Fetch tasks with real-time subscription
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setTasks([]);
      return;
    }

    setLoading(true);
    setError(null);

    // Build query based on status filter
    const tasksRef = collection(db, 'generatedTasks');
    let constraints: any[] = [
      where('assignedTo', '==', userId),
      orderBy('dueDate', 'asc'),
    ];

    // Only add status filter if not 'all'
    if (filters.status !== 'all') {
      constraints = [
        where('assignedTo', '==', userId),
        where('status', '==', filters.status),
        orderBy('dueDate', 'asc'),
      ];
    }

    const q = query(tasksRef, ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const taskData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            businessEventId: data.businessEventId || '',
            templateId: data.templateId || '',
            title: data.title || '',
            description: data.description || '',
            priority: data.priority || 'P2',
            status: data.status || 'pending',
            assignedTo: data.assignedTo,
            assignedToName: data.assignedToName,
            assignedAt: data.assignedAt?.toDate(),
            dueDate: data.dueDate?.toDate(),
            startedAt: data.startedAt?.toDate(),
            completedAt: data.completedAt?.toDate(),
            checklistItems: (data.checklistItems || []).map((item: any) => ({
              ...item,
              completedAt: item.completedAt?.toDate?.() || item.completedAt,
            })),
            checklistProgress: data.checklistProgress || 0,
            sourceModule: data.sourceModule || '',
            subsidiary: data.subsidiary || '',
            entityType: data.entityType,
            entityId: data.entityId,
            entityName: data.entityName,
            projectId: data.projectId,
            projectName: data.projectName,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate(),
            createdBy: data.createdBy || 'system',
            notes: data.notes,
          } as EmployeeTask;
        });

        setTasks(taskData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching tasks:', err);
        setError('Failed to load tasks');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, filters.status]);

  // Calculate stats from tasks
  const stats = useMemo((): TaskInboxStats => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    let pending = 0;
    let inProgress = 0;
    let completed = 0;
    let blocked = 0;
    let overdue = 0;
    let dueToday = 0;
    let dueSoon = 0;

    tasks.forEach((task) => {
      // Count by status
      switch (task.status) {
        case 'pending':
          pending++;
          break;
        case 'in_progress':
          inProgress++;
          break;
        case 'completed':
          completed++;
          break;
        case 'blocked':
          blocked++;
          break;
      }

      // Count due dates (only for non-completed tasks)
      if (task.dueDate && task.status !== 'completed' && task.status !== 'cancelled') {
        const dueDate = new Date(task.dueDate);
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

        if (dueDateOnly < today) {
          overdue++;
        } else if (dueDateOnly.getTime() === today.getTime()) {
          dueToday++;
        } else if (dueDateOnly <= threeDaysFromNow) {
          dueSoon++;
        }
      }
    });

    return {
      total: tasks.length,
      pending,
      inProgress,
      completed,
      blocked,
      overdue,
      dueToday,
      dueSoon,
    };
  }, [tasks]);

  // Filter tasks based on current filters
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Priority filter
      if (filters.priority !== 'all' && task.priority !== filters.priority) {
        return false;
      }

      // Search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDescription = task.description?.toLowerCase().includes(query);
        const matchesProject = task.projectName?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDescription && !matchesProject) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, filters.priority, filters.searchQuery]);

  // Group tasks based on groupBy filter
  const groupedTasks = useMemo((): GroupedTasks => {
    if (filters.groupBy === 'none') {
      return { 'All Tasks': filteredTasks };
    }

    const groups: GroupedTasks = {};

    filteredTasks.forEach((task) => {
      let groupKey: string;

      switch (filters.groupBy) {
        case 'status':
          groupKey = task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('_', ' ');
          break;
        case 'priority':
          const priorityLabels: Record<string, string> = {
            P0: 'Critical (P0)',
            P1: 'High (P1)',
            P2: 'Medium (P2)',
            P3: 'Low (P3)',
          };
          groupKey = priorityLabels[task.priority] || task.priority;
          break;
        case 'dueDate':
          groupKey = getDueDateGroup(task.dueDate);
          break;
        default:
          groupKey = 'Other';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(task);
    });

    return groups;
  }, [filteredTasks, filters.groupBy]);

  // Task actions
  const startTask = useCallback(async (taskId: string) => {
    try {
      await taskGenerationService.updateTaskStatus(taskId, 'in_progress');
    } catch (err) {
      console.error('Error starting task:', err);
      throw err;
    }
  }, []);

  const completeTask = useCallback(async (taskId: string) => {
    try {
      await taskGenerationService.updateTaskStatus(taskId, 'completed');
    } catch (err) {
      console.error('Error completing task:', err);
      throw err;
    }
  }, []);

  const blockTask = useCallback(async (taskId: string) => {
    try {
      await taskGenerationService.updateTaskStatus(taskId, 'blocked');
    } catch (err) {
      console.error('Error blocking task:', err);
      throw err;
    }
  }, []);

  const updateChecklistItem = useCallback(
    async (taskId: string, itemId: string, completed: boolean) => {
      if (!userId) return;
      try {
        await taskGenerationService.updateChecklistItem(taskId, itemId, completed, userId);
      } catch (err) {
        console.error('Error updating checklist item:', err);
        throw err;
      }
    },
    [userId]
  );

  const updateFilters = useCallback((newFilters: Partial<TaskFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const refresh = useCallback(() => {
    // Trigger a re-render by updating a state
    // The real-time subscription will handle the actual refresh
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  }, []);

  return {
    tasks: filteredTasks,
    groupedTasks,
    stats,
    loading,
    error,
    filters,
    updateFilters,
    startTask,
    completeTask,
    blockTask,
    updateChecklistItem,
    refresh,
    userId,
    userName: user?.displayName || user?.email || 'User',
  };
}

// ============================================
// Helper Functions
// ============================================

function getDueDateGroup(dueDate?: Date): string {
  if (!dueDate) return 'No Due Date';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

  const diffDays = Math.ceil((dueDateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return 'This Week';
  if (diffDays <= 30) return 'This Month';
  return 'Later';
}

export function getDueDateStatus(dueDate?: Date): 'overdue' | 'today' | 'soon' | 'ok' | 'none' {
  if (!dueDate) return 'none';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

  const diffDays = Math.ceil((dueDateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays <= 3) return 'soon';
  return 'ok';
}

export function formatDueDate(dueDate?: Date): string {
  if (!dueDate) return '-';
  return dueDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: dueDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

export default useEmployeeTaskInbox;
