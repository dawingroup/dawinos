/**
 * MatFlow Project Service
 * CRUD operations for construction projects
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/core/services/firebase';
import type { 
  MatFlowProject, 
  ProjectSettings,
  ProjectMember,
  ProjectStage,
} from '../types';
import { ProjectStatus, BOQStatus, ConstructionStage } from '../types';
import { updateAdvisoryEngagement } from './customerService';

// Collection helpers
const projectsCollection = (orgId: string) =>
  collection(db, 'organizations', orgId, 'matflow_projects');

const projectDoc = (orgId: string, projectId: string) =>
  doc(db, 'organizations', orgId, 'matflow_projects', projectId);

// ============================================================================
// CODE GENERATION
// ============================================================================

export async function generateProjectCode(orgId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `MF-${year}-`;
  
  // Get count of projects this year
  const q = query(
    projectsCollection(orgId),
    where('code', '>=', prefix),
    where('code', '<', prefix + '\uf8ff'),
    orderBy('code', 'desc'),
    limit(1)
  );
  
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return `${prefix}001`;
  }
  
  const lastCode = snapshot.docs[0].data().code;
  const lastNumber = parseInt(lastCode.split('-').pop() || '0', 10);
  return `${prefix}${String(lastNumber + 1).padStart(3, '0')}`;
}

// ============================================================================
// CREATE
// ============================================================================

export interface CreateProjectInput {
  name: string;
  description?: string;
  customerId: string;
  customerName: string;
  location: {
    district: string;
    address?: string;
  };
  settings?: Partial<ProjectSettings>;
  members?: ProjectMember[];
}

export async function createProject(
  orgId: string,
  userId: string,
  input: CreateProjectInput
): Promise<string> {
  const code = await generateProjectCode(orgId);
  
  const defaultSettings: ProjectSettings = {
    currency: 'UGX',
    taxEnabled: false,
    taxRate: 18,
    contingencyPercent: 10,
    defaultWastagePercent: 10,
    ...input.settings,
  };
  
  // Default stages based on construction phases
  const defaultStages: ProjectStage[] = Object.values(ConstructionStage).map((stage, index) => ({
    id: stage,
    name: stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    order: index + 1,
    status: 'not_started' as const,
    completionPercent: 0,
  }));
  
  const projectData: Omit<MatFlowProject, 'id'> = {
    code,
    name: input.name,
    description: input.description,
    organizationId: orgId,
    customerId: input.customerId,
    customerName: input.customerName,
    status: ProjectStatus.DRAFT,
    boqStatus: BOQStatus.DRAFT,
    location: input.location,
    settings: defaultSettings,
    members: input.members || [{
      id: userId,
      userId,
      email: '',
      displayName: '',
      role: 'quantity_surveyor',
      capabilities: [],
      addedAt: Timestamp.now(),
      addedBy: userId,
    }],
    stages: defaultStages,
    totalBOQItems: 0,
    totalPlannedCost: 0,
    totalActualCost: 0,
    isDeleted: false,
    createdAt: Timestamp.now(),
    createdBy: userId,
    updatedAt: Timestamp.now(),
    updatedBy: userId,
  };
  
  const docRef = await addDoc(projectsCollection(orgId), {
    ...projectData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  // Update customer engagement
  await updateAdvisoryEngagement(input.customerId, { projectCreated: true });
  
  return docRef.id;
}

// ============================================================================
// READ
// ============================================================================

export async function getProject(
  orgId: string, 
  projectId: string
): Promise<MatFlowProject | null> {
  const snapshot = await getDoc(projectDoc(orgId, projectId));
  
  if (!snapshot.exists()) return null;
  
  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as MatFlowProject;
}

export async function getProjects(
  orgId: string,
  filters?: {
    status?: ProjectStatus;
    customerId?: string;
    limitCount?: number;
  }
): Promise<MatFlowProject[]> {
  let q = query(
    projectsCollection(orgId),
    where('isDeleted', '==', false),
    orderBy('createdAt', 'desc')
  );
  
  if (filters?.status) {
    q = query(q, where('status', '==', filters.status));
  }
  
  if (filters?.customerId) {
    q = query(q, where('customerId', '==', filters.customerId));
  }
  
  if (filters?.limitCount) {
    q = query(q, limit(filters.limitCount));
  }
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as MatFlowProject[];
}

export function subscribeToProject(
  orgId: string,
  projectId: string,
  callback: (project: MatFlowProject | null) => void
): () => void {
  return onSnapshot(projectDoc(orgId, projectId), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    callback({
      id: snapshot.id,
      ...snapshot.data(),
    } as MatFlowProject);
  });
}

// ============================================================================
// UPDATE
// ============================================================================

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  boqStatus?: BOQStatus;
  location?: {
    district: string;
    address?: string;
  };
  settings?: Partial<ProjectSettings>;
}

export async function updateProject(
  orgId: string,
  projectId: string,
  userId: string,
  input: UpdateProjectInput
): Promise<void> {
  await updateDoc(projectDoc(orgId, projectId), {
    ...input,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
}

export async function updateProjectStats(
  orgId: string,
  projectId: string,
  stats: {
    totalBOQItems?: number;
    totalPlannedCost?: number;
    totalActualCost?: number;
  }
): Promise<void> {
  await updateDoc(projectDoc(orgId, projectId), {
    ...stats,
    updatedAt: serverTimestamp(),
  });
}

// ============================================================================
// DELETE (Soft)
// ============================================================================

export async function deleteProject(
  orgId: string,
  projectId: string,
  userId: string
): Promise<void> {
  await updateDoc(projectDoc(orgId, projectId), {
    isDeleted: true,
    deletedAt: serverTimestamp(),
    deletedBy: userId,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
}
