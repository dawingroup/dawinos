/**
 * Task Assignment Service
 * Functions for managers to assign and reassign tasks
 */

import { db } from '@/shared/services/firebase/firestore';
import { doc, updateDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';

export interface TaskAssignment {
  taskId: string;
  assignedTo: string;
  assignedBy: string;
  assignedAt: Date;
  reason?: string;
}

export interface TaskReassignment extends TaskAssignment {
  previousAssignee: string;
}

/**
 * Assign a task to an employee
 */
export async function assignTask(
  taskId: string,
  assignedTo: string,
  assignedBy: string,
  reason?: string
): Promise<void> {
  const taskRef = doc(db, 'generatedTasks', taskId);

  await updateDoc(taskRef, {
    assignedTo,
    assignedBy,
    assignedAt: Timestamp.now(),
    assignmentReason: reason || null,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Reassign a task from one employee to another
 */
export async function reassignTask(
  taskId: string,
  newAssignee: string,
  reassignedBy: string,
  reason?: string
): Promise<void> {
  const taskRef = doc(db, 'generatedTasks', taskId);

  await updateDoc(taskRef, {
    assignedTo: newAssignee,
    reassignedBy,
    reassignedAt: Timestamp.now(),
    reassignmentReason: reason || null,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Take up (claim) a task assigned to someone else
 */
export async function takeUpTask(
  taskId: string,
  newAssignee: string,
  takenBy: string,
  reason?: string
): Promise<void> {
  const taskRef = doc(db, 'generatedTasks', taskId);

  await updateDoc(taskRef, {
    assignedTo: newAssignee,
    takenUpBy: takenBy,
    takenUpAt: Timestamp.now(),
    takeUpReason: reason || null,
    status: 'in_progress',
    updatedAt: Timestamp.now(),
  });
}

/**
 * Bulk assign tasks to an employee
 */
export async function bulkAssignTasks(
  taskIds: string[],
  assignedTo: string,
  assignedBy: string,
  reason?: string
): Promise<void> {
  const updatePromises = taskIds.map(taskId =>
    assignTask(taskId, assignedTo, assignedBy, reason)
  );

  await Promise.all(updatePromises);
}

/**
 * Get all unassigned tasks
 */
export async function getUnassignedTasks() {
  const tasksRef = collection(db, 'generatedTasks');
  const q = query(
    tasksRef,
    where('assignedTo', '==', null),
    where('status', '==', 'pending')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * Get tasks assigned to a specific employee
 */
export async function getEmployeeTasks(employeeId: string) {
  const tasksRef = collection(db, 'generatedTasks');
  const q = query(
    tasksRef,
    where('assignedTo', '==', employeeId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}
