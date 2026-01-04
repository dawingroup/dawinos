/**
 * PROJECT SERVICE
 * 
 * Service for managing infrastructure projects within programs.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  writeBatch,
  increment,
  QueryConstraint,
  Firestore,
} from 'firebase/firestore';
import {
  Project,
  ProjectFormData,
  ProjectStatus,
  PROJECT_STATUSES,
  generateProjectCode,
  getStatusCountField,
} from '../types/project';
import { ProjectLocation, getDefaultLocation } from '../types/project-location';
import { getDefaultScope } from '../types/project-scope';
import { ProjectBudget, initializeProjectBudget } from '../types/project-budget';
import { ProgressRecord, initializeProjectProgress, calculateProgressStatus } from '../types/project-progress';
import { TimelineExtension, initializeProjectTimeline, calculateDaysBetween } from '../types/project-timeline';

// ─────────────────────────────────────────────────────────────────
// COLLECTION PATHS
// ─────────────────────────────────────────────────────────────────

const PROJECTS_PATH = 'projects';
const PROGRAMS_PATH = 'programs';
const ACTIVITY_LOG_PATH = 'activityLog';

// ─────────────────────────────────────────────────────────────────
// PROJECT SERVICE
// ─────────────────────────────────────────────────────────────────

export class ProjectService {
  private static instance: ProjectService;
  private db: Firestore;

  private constructor(db: Firestore) {
    this.db = db;
  }

  static getInstance(db: Firestore): ProjectService {
    if (!ProjectService.instance) {
      ProjectService.instance = new ProjectService(db);
    }
    return ProjectService.instance;
  }

  // ─────────────────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────────────────

  async createProject(
    data: ProjectFormData,
    userId: string
  ): Promise<Project> {
    // Get program to inherit fields
    const programDoc = await getDoc(doc(this.db, PROGRAMS_PATH, data.programId));
    if (!programDoc.exists()) {
      throw new Error('Program not found');
    }
    const program = programDoc.data();

    // Get project count for code generation
    const projectCount = await this.getProjectCountForProgram(data.programId);
    const projectCode = generateProjectCode(program.code, projectCount + 1);

    // Build project
    const projectData: Omit<Project, 'id'> = {
      programId: data.programId,
      engagementId: program.engagementId,
      projectCode,
      name: data.name,
      description: data.description,
      status: 'planning',
      implementationType: program.implementationType,
      projectType: data.projectType,
      location: {
        ...getDefaultLocation(),
        ...data.location,
        siteName: data.location.siteName || data.name,
      } as ProjectLocation,
      scope: getDefaultScope(),
      budget: initializeProjectBudget(data.budgetAmount, data.budgetCurrency, userId),
      progress: initializeProjectProgress(),
      timeline: initializeProjectTimeline(data.estimatedStartDate, data.estimatedEndDate),
      matflowLinked: false,
      createdAt: Timestamp.now(),
      createdBy: userId,
      updatedAt: Timestamp.now(),
      updatedBy: userId,
    };

    // Add to Firestore
    const projectsRef = collection(this.db, PROJECTS_PATH);
    const docRef = await addDoc(projectsRef, projectData);

    // Update program stats
    await this.updateProgramStats(data.programId, 'planning', 1);

    // Log activity
    await this.logActivity(docRef.id, 'project_created', userId, {
      projectName: data.name,
      projectCode,
    });

    return {
      id: docRef.id,
      ...projectData,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // READ
  // ─────────────────────────────────────────────────────────────────

  async getProject(projectId: string): Promise<Project | null> {
    const docRef = doc(this.db, PROJECTS_PATH, projectId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as Project;
  }

  async getProjectsByProgram(
    programId: string,
    options: {
      status?: ProjectStatus[];
      orderByField?: 'name' | 'createdAt' | 'status';
      orderDirection?: 'asc' | 'desc';
      limitCount?: number;
    } = {}
  ): Promise<Project[]> {
    const constraints: QueryConstraint[] = [
      where('programId', '==', programId),
    ];

    if (options.status?.length) {
      constraints.push(where('status', 'in', options.status));
    }

    constraints.push(
      orderBy(options.orderByField || 'createdAt', options.orderDirection || 'desc')
    );

    if (options.limitCount) {
      constraints.push(limit(options.limitCount));
    }

    const q = query(collection(this.db, PROJECTS_PATH), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Project[];
  }

  async getProjectsByEngagement(engagementId: string): Promise<Project[]> {
    const q = query(
      collection(this.db, PROJECTS_PATH),
      where('engagementId', '==', engagementId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Project[];
  }

  subscribeToProject(
    projectId: string,
    callback: (project: Project | null) => void
  ): () => void {
    const docRef = doc(this.db, PROJECTS_PATH, projectId);

    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() } as Project);
      } else {
        callback(null);
      }
    });
  }

  subscribeToProjectsByProgram(
    programId: string,
    callback: (projects: Project[]) => void
  ): () => void {
    const q = query(
      collection(this.db, PROJECTS_PATH),
      where('programId', '==', programId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Project[];
      callback(projects);
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────────────────────────

  async updateProject(
    projectId: string,
    updates: Partial<Project>,
    userId: string
  ): Promise<void> {
    const docRef = doc(this.db, PROJECTS_PATH, projectId);

    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    await this.logActivity(projectId, 'project_updated', userId, {
      updatedFields: Object.keys(updates),
    });
  }

  async updateProjectStatus(
    projectId: string,
    newStatus: ProjectStatus,
    userId: string,
    notes?: string
  ): Promise<void> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const oldStatus = project.status;

    // Validate transition
    if (!PROJECT_STATUSES[oldStatus].allowedTransitions.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${oldStatus} to ${newStatus}`);
    }

    const batch = writeBatch(this.db);
    const projectRef = doc(this.db, PROJECTS_PATH, projectId);

    const updates: Record<string, unknown> = {
      status: newStatus,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    };

    // Handle specific transitions
    if (newStatus === 'active' && !project.timeline.actualStartDate) {
      updates['timeline.actualStartDate'] = new Date();
    }

    if (newStatus === 'completed') {
      updates['timeline.actualEndDate'] = new Date();
    }

    batch.update(projectRef, updates);

    // Update program stats
    const programRef = doc(this.db, PROGRAMS_PATH, project.programId);
    batch.update(programRef, {
      [`projectStats.byStatus.${getStatusCountField(oldStatus)}`]: increment(-1),
      [`projectStats.byStatus.${getStatusCountField(newStatus)}`]: increment(1),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();

    await this.logActivity(projectId, 'status_changed', userId, {
      fromStatus: oldStatus,
      toStatus: newStatus,
      notes,
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // PROGRESS TRACKING
  // ─────────────────────────────────────────────────────────────────

  async recordProgress(
    projectId: string,
    record: Omit<ProgressRecord, 'id' | 'recordedBy' | 'recordedAt'>,
    userId: string
  ): Promise<string> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const recordId = `prog-${Date.now()}`;
    const progressRecord: ProgressRecord = {
      id: recordId,
      ...record,
      recordedBy: userId,
      recordedAt: Timestamp.now(),
    };

    const progressStatus = calculateProgressStatus(
      record.physicalProgress,
      project.progress.plannedProgress
    );

    const docRef = doc(this.db, PROJECTS_PATH, projectId);
    await updateDoc(docRef, {
      'progress.physicalProgress': record.physicalProgress,
      'progress.lastPhysicalUpdate': serverTimestamp(),
      'progress.physicalUpdateMethod': 'manual',
      'progress.progressVariance': record.physicalProgress - project.progress.plannedProgress,
      'progress.progressStatus': progressStatus,
      'progress.progressHistory': [...project.progress.progressHistory, progressRecord],
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    await this.logActivity(projectId, 'progress_recorded', userId, {
      physicalProgress: record.physicalProgress,
      financialProgress: record.financialProgress,
    });

    return recordId;
  }

  // ─────────────────────────────────────────────────────────────────
  // TIMELINE EXTENSIONS
  // ─────────────────────────────────────────────────────────────────

  async requestExtension(
    projectId: string,
    extension: Omit<TimelineExtension, 'id' | 'status' | 'approvalId' | 'approvedBy' | 'approvedAt' | 'newEndDate' | 'approvedDays'>,
    userId: string
  ): Promise<string> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const extensionId = `ext-${Date.now()}`;
    const newExtension: TimelineExtension = {
      id: extensionId,
      ...extension,
      approvedDays: 0,
      status: 'pending',
    };

    const docRef = doc(this.db, PROJECTS_PATH, projectId);
    await updateDoc(docRef, {
      'timeline.extensions': [...project.timeline.extensions, newExtension],
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    await this.logActivity(projectId, 'extension_requested', userId, {
      extensionId,
      requestedDays: extension.requestedDays,
      reason: extension.reason,
    });

    return extensionId;
  }

  async approveExtension(
    projectId: string,
    extensionId: string,
    approvedDays: number,
    userId: string
  ): Promise<void> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const extensionIndex = project.timeline.extensions.findIndex(
      (e: TimelineExtension) => e.id === extensionId
    );
    if (extensionIndex === -1) {
      throw new Error('Extension not found');
    }

    const extension = project.timeline.extensions[extensionIndex];
    const currentEndDate = new Date(project.timeline.currentEndDate);
    const newEndDate = new Date(currentEndDate);
    newEndDate.setDate(newEndDate.getDate() + approvedDays);

    const updatedExtensions = [...project.timeline.extensions];
    updatedExtensions[extensionIndex] = {
      ...extension,
      approvedDays,
      status: approvedDays === extension.requestedDays ? 'approved' : 'partial',
      approvedBy: userId,
      approvedAt: Timestamp.now(),
      newEndDate,
    };

    const docRef = doc(this.db, PROJECTS_PATH, projectId);
    await updateDoc(docRef, {
      'timeline.extensions': updatedExtensions,
      'timeline.currentEndDate': newEndDate,
      'timeline.currentDuration': project.timeline.currentDuration + approvedDays,
      'timeline.totalExtensionDays': project.timeline.totalExtensionDays + approvedDays,
      'timeline.daysRemaining': calculateDaysBetween(new Date(), newEndDate),
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    await this.logActivity(projectId, 'extension_approved', userId, {
      extensionId,
      approvedDays,
      newEndDate: newEndDate.toISOString(),
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // LOCATION UPDATE
  // ─────────────────────────────────────────────────────────────────

  async updateLocation(
    projectId: string,
    location: Partial<ProjectLocation>,
    userId: string
  ): Promise<void> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const docRef = doc(this.db, PROJECTS_PATH, projectId);
    const updatedLocation = { ...project.location, ...location };

    await updateDoc(docRef, {
      location: updatedLocation,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    await this.logActivity(projectId, 'location_updated', userId, {
      updatedFields: Object.keys(location),
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // BUDGET UPDATE
  // ─────────────────────────────────────────────────────────────────

  async updateBudget(
    projectId: string,
    budgetUpdates: Partial<ProjectBudget>,
    userId: string
  ): Promise<void> {
    const docRef = doc(this.db, PROJECTS_PATH, projectId);

    const updates: Record<string, unknown> = {};
    Object.entries(budgetUpdates).forEach(([key, value]) => {
      updates[`budget.${key}`] = value;
    });
    updates['budget.lastUpdated'] = serverTimestamp();
    updates['budget.lastUpdatedBy'] = userId;
    updates['updatedAt'] = serverTimestamp();
    updates['updatedBy'] = userId;

    await updateDoc(docRef, updates);

    await this.logActivity(projectId, 'budget_updated', userId, {
      updatedFields: Object.keys(budgetUpdates),
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // MATFLOW INTEGRATION
  // ─────────────────────────────────────────────────────────────────

  async linkToMatFlow(
    projectId: string,
    boqId: string,
    userId: string
  ): Promise<void> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const boqIds = project.matflowBoqIds || [];
    if (!boqIds.includes(boqId)) {
      boqIds.push(boqId);
    }

    const docRef = doc(this.db, PROJECTS_PATH, projectId);
    await updateDoc(docRef, {
      matflowLinked: true,
      matflowBoqId: project.matflowBoqId || boqId,
      matflowBoqIds: boqIds,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    await this.logActivity(projectId, 'matflow_linked', userId, { boqId });
  }

  // ─────────────────────────────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────────────────────────────

  async deleteProject(
    projectId: string,
    userId: string,
    reason?: string
  ): Promise<void> {
    await this.updateProjectStatus(projectId, 'cancelled', userId, reason);
  }

  // ─────────────────────────────────────────────────────────────────
  // HELPER METHODS
  // ─────────────────────────────────────────────────────────────────

  private async getProjectCountForProgram(programId: string): Promise<number> {
    const q = query(
      collection(this.db, PROJECTS_PATH),
      where('programId', '==', programId)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  private async updateProgramStats(
    programId: string,
    status: ProjectStatus,
    delta: number
  ): Promise<void> {
    const programRef = doc(this.db, PROGRAMS_PATH, programId);
    await updateDoc(programRef, {
      'projectStats.total': increment(delta),
      [`projectStats.byStatus.${getStatusCountField(status)}`]: increment(delta),
      updatedAt: serverTimestamp(),
    });
  }

  private async logActivity(
    projectId: string,
    action: string,
    userId: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    const activityRef = collection(
      this.db,
      PROJECTS_PATH,
      projectId,
      ACTIVITY_LOG_PATH
    );

    await addDoc(activityRef, {
      action,
      userId,
      details,
      timestamp: serverTimestamp(),
    });
  }
}

// Export singleton factory
export function getProjectService(db: Firestore): ProjectService {
  return ProjectService.getInstance(db);
}
