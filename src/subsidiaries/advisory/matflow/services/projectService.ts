/**
 * MATFLOW PROJECT SERVICE
 * 
 * CRUD operations for MatFlow projects.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/core/services/firebase';
import type { MatFlowProject, ProjectStatus } from '../types/core';

// ─────────────────────────────────────────────────────────────────
// COLLECTION HELPERS
// ─────────────────────────────────────────────────────────────────

const getProjectsCollection = (orgId: string) =>
  collection(db, 'organizations', orgId, 'matflow_projects');

const getProjectDoc = (orgId: string, projectId: string) =>
  doc(db, 'organizations', orgId, 'matflow_projects', projectId);

// ─────────────────────────────────────────────────────────────────
// INPUT TYPES
// ─────────────────────────────────────────────────────────────────

export interface CreateProjectInput {
  name: string;
  projectCode?: string;
  description?: string;
  type?: MatFlowProject['type'];
  customerId?: string;
  customerName?: string;
  location?: MatFlowProject['location'];
  startDate?: Date;
  endDate?: Date;
  budget?: {
    currency: 'UGX' | 'USD';
    totalBudget: number;
  };
}

export interface UpdateProjectInput {
  name?: string;
  projectCode?: string;
  description?: string;
  status?: ProjectStatus;
  type?: MatFlowProject['type'];
  customerId?: string;
  customerName?: string;
  location?: MatFlowProject['location'];
  startDate?: Date;
  endDate?: Date;
  budget?: MatFlowProject['budget'];
  progress?: MatFlowProject['progress'];
}

// ─────────────────────────────────────────────────────────────────
// CRUD OPERATIONS
// ─────────────────────────────────────────────────────────────────

/**
 * Get all projects for an organization
 */
export async function getProjects(
  orgId: string,
  filters?: { status?: ProjectStatus; customerId?: string }
): Promise<MatFlowProject[]> {
  let q = query(getProjectsCollection(orgId), orderBy('createdAt', 'desc'));

  if (filters?.status) {
    q = query(q, where('status', '==', filters.status));
  }

  if (filters?.customerId) {
    q = query(q, where('customerId', '==', filters.customerId));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as MatFlowProject[];
}

/**
 * Get a single project by ID
 */
export async function getProject(
  orgId: string,
  projectId: string
): Promise<MatFlowProject | null> {
  const docRef = getProjectDoc(orgId, projectId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as MatFlowProject;
}

/**
 * Subscribe to real-time project updates
 */
export function subscribeToProject(
  orgId: string,
  projectId: string,
  onUpdate: (project: MatFlowProject | null) => void
): () => void {
  const docRef = getProjectDoc(orgId, projectId);

  return onSnapshot(docRef, (snapshot) => {
    if (!snapshot.exists()) {
      onUpdate(null);
      return;
    }

    onUpdate({
      id: snapshot.id,
      ...snapshot.data(),
    } as MatFlowProject);
  });
}

/**
 * Create a new project
 */
export async function createProject(
  orgId: string,
  userId: string,
  input: CreateProjectInput
): Promise<string> {
  const projectData = {
    ...input,
    status: 'draft' as ProjectStatus,
    budget: input.budget
      ? { ...input.budget, spent: 0 }
      : { currency: 'UGX', totalBudget: 0, spent: 0 },
    progress: { physicalProgress: 0, financialProgress: 0 },
    boqSummary: { totalItems: 0, totalValue: 0, parsedItems: 0, approvedItems: 0 },
    teamMembers: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: userId,
    updatedBy: userId,
  };

  const docRef = await addDoc(getProjectsCollection(orgId), projectData);
  return docRef.id;
}

/**
 * Update an existing project
 */
export async function updateProject(
  orgId: string,
  projectId: string,
  userId: string,
  input: UpdateProjectInput
): Promise<void> {
  const docRef = getProjectDoc(orgId, projectId);

  await updateDoc(docRef, {
    ...input,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
}

/**
 * Delete a project
 */
export async function deleteProject(
  orgId: string,
  projectId: string,
  _userId: string
): Promise<void> {
  const docRef = getProjectDoc(orgId, projectId);
  await deleteDoc(docRef);
}

/**
 * Update project status
 */
export async function updateProjectStatus(
  orgId: string,
  projectId: string,
  userId: string,
  status: ProjectStatus
): Promise<void> {
  await updateProject(orgId, projectId, userId, { status });
}

/**
 * Update project progress
 */
export async function updateProjectProgress(
  orgId: string,
  projectId: string,
  userId: string,
  progress: { physicalProgress?: number; financialProgress?: number }
): Promise<void> {
  const docRef = getProjectDoc(orgId, projectId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    throw new Error('Project not found');
  }

  const currentProgress = snapshot.data().progress || {};

  await updateDoc(docRef, {
    progress: {
      ...currentProgress,
      ...progress,
    },
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
}
