/**
 * CORE PROJECT SERVICE
 * =================================================================
 * This is the canonical service for managing "Project" entities within Dawin Advisory.
 * It consolidates logic from the original Delivery and MatFlow services.
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
  ProjectStage, 
  ProjectSettings 
} from '../types/project.types';

// =================================================================
// SERVICE CONFIGURATION
// =================================================================

const getProjectsCollection = (orgId: string) => `organizations/${orgId}/advisory_projects`;
const getProjectDoc = (orgId: string, id: string) => `${getProjectsCollection(orgId)}/${id}`;
const getProgramDoc = (orgId: string, id: string) => `organizations/${orgId}/advisory_programs/${id}`;


// =================================================================
// PROJECT SERVICE CLASS
// =================================================================

export class ProjectService {
  private db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  // ─────────────────────────────────────────────────────────────────
  // CODE GENERATION (Adapted from MatFlow)
  // ─────────────────────────────────────────────────────────────────
  private async generateProjectCode(orgId: string, programCode: string): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2);
    const prefix = `${programCode}-${year}-`;

    const q = query(
      collection(this.db, getProjectsCollection(orgId)),
      where('projectCode', '>=', prefix),
      where('projectCode', '<', prefix + '\uf8ff'),
      orderBy('projectCode', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return `${prefix}001`;
    }
    
    const lastCode = snapshot.docs[0].data().projectCode;
    const lastNumber = parseInt(lastCode.split('-').pop() || '0', 10);
    return `${prefix}${String(lastNumber + 1).padStart(3, '0')}`;
  }


  // ─────────────────────────────────────────────────────────────────
  // CREATE (Consolidated)
  // ─────────────────────────────────────────────────────────────────
  async createProject(
    orgId: string,
    userId: string,
    data: ProjectFormData
  ): Promise<Project> {

    // 1. Get Program for context
    const programDocRef = doc(this.db, getProgramDoc(orgId, data.programId));
    const programDoc = await getDoc(programDocRef);
    if (!programDoc.exists()) {
      throw new Error('Program not found');
    }
    const program = programDoc.data();

    // 2. Generate Code
    const projectCode = await this.generateProjectCode(orgId, program.code || 'PROG');

    // 3. Define Default Structures
    const defaultSettings: ProjectSettings = {
      taxEnabled: false,
      taxRate: 18,
      defaultWastagePercent: 10,
    };
    
    const defaultStages: ProjectStage[] = [
        { id: 'preliminaries', name: 'Preliminaries', order: 1, status: 'not_started', completionPercent: 0 },
        { id: 'substructures', name: 'Substructures', order: 2, status: 'not_started', completionPercent: 0 },
        { id: 'superstructure', name: 'Superstructure', order: 3, status: 'not_started', completionPercent: 0 },
        { id: 'finishes', name: 'Finishes', order: 4, status: 'not_started', completionPercent: 0 },
        { id: 'external_works', name: 'External Works', order: 5, status: 'not_started', completionPercent: 0 },
    ];

    // 4. Build Canonical Project Object
    const newProjectData: Omit<Project, 'id'> = {
      name: data.name,
      projectCode,
      description: data.description || '',
      programId: data.programId,
      engagementId: program.engagementId,
      customerId: data.customerId || program.customerId,
      customerName: program.customerName, // Inherit from program
      status: 'planning',
      projectType: data.projectType,
      location: {
        country: program.location?.country || 'Unknown',
        region: data.location.region || program.location?.region || '',
        district: data.location.district || '',
        siteName: data.location.siteName || data.name,
      },
      budget: {
        currency: data.budgetCurrency,
        totalBudget: data.budgetAmount,
        spent: 0,
        remaining: data.budgetAmount,
        variance: 0,
        varianceStatus: 'on_track',
        contingencyPercent: 10,
      },
      progress: {
        physicalProgress: 0,
        financialProgress: 0,
        completionPercent: 0,
      },
      timeline: {
        plannedStartDate: data.estimatedStartDate,
        plannedEndDate: data.estimatedEndDate,
        currentStartDate: data.estimatedStartDate,
        currentEndDate: data.estimatedEndDate,
        isDelayed: false,
        daysRemaining: Math.floor((data.estimatedEndDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24)),
      },
      settings: defaultSettings,
      stages: defaultStages,
      members: [],
      boqIds: [],
      createdAt: Timestamp.now(),
      createdBy: userId,
      updatedAt: Timestamp.now(),
      updatedBy: userId,
      version: 1,
      isDeleted: false,
    };

    // 5. Save to Firestore
    const docRef = await addDoc(collection(this.db, getProjectsCollection(orgId)), newProjectData);

    // 6. Update Program Stats
    await updateDoc(programDocRef, {
        'projectStats.total': increment(1),
        'projectStats.byStatus.planning': increment(1),
    });

    return { id: docRef.id, ...newProjectData };
  }

  // ─────────────────────────────────────────────────────────────────
  // READ (Adapted from Delivery)
  // ─────────────────────────────────────────────────────────────────

  async getProject(orgId: string, projectId: string): Promise<Project | null> {
    const docRef = doc(this.db, getProjectDoc(orgId, projectId));
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists() || snapshot.data().isDeleted) {
      return null;
    }
    return { id: snapshot.id, ...snapshot.data() } as Project;
  }

  async getProjectsByProgram(orgId: string, programId: string): Promise<Project[]> {
    const q = query(
      collection(this.db, getProjectsCollection(orgId)),
      where('programId', '==', programId),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[];
  }
  
  subscribeToProject(orgId: string, projectId: string, callback: (project: Project | null) => void): () => void {
    const docRef = doc(this.db, getProjectDoc(orgId, projectId));
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists() && !snapshot.data().isDeleted) {
        callback({ id: snapshot.id, ...snapshot.data() } as Project);
      } else {
        callback(null);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // UPDATE (Consolidated)
  // ─────────────────────────────────────────────────────────────────

  async updateProject(orgId: string, projectId: string, userId: string, updates: Partial<Project>): Promise<void> {
    const docRef = doc(this.db, getProjectDoc(orgId, projectId));
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
      version: increment(1),
    });
  }
  
  // Includes logic from delivery/project-service
  async updateProjectStatus(orgId: string, projectId: string, newStatus: ProjectStatus, userId: string): Promise<void> {
    const project = await this.getProject(orgId, projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    const oldStatus = project.status;
    // TODO: Add back status transition validation logic if needed

    const batch = writeBatch(this.db);
    const projectRef = doc(this.db, getProjectDoc(orgId, projectId));
    batch.update(projectRef, { status: newStatus, updatedAt: serverTimestamp(), updatedBy: userId });

    const programRef = doc(this.db, getProgramDoc(orgId, project.programId));
    batch.update(programRef, {
        [`projectStats.byStatus.${oldStatus}`]: increment(-1),
        [`projectStats.byStatus.${newStatus}`]: increment(1),
    });

    await batch.commit();
  }

  // ─────────────────────────────────────────────────────────────────
  // DELETE (Soft Delete from MatFlow)
  // ─────────────────────────────────────────────────────────────────

  async deleteProject(orgId: string, projectId: string, userId: string): Promise<void> {
    const docRef = doc(this.db, getProjectDoc(orgId, projectId));
    const project = await this.getProject(orgId, projectId);

    if(!project) return;

    await updateDoc(docRef, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: userId,
      status: 'cancelled', // Also update status
    });

    // Decrement program stats
    const programRef = doc(this.db, getProgramDoc(orgId, project.programId));
    await updateDoc(programRef, {
        'projectStats.total': increment(-1),
        [`projectStats.byStatus.${project.status}`]: increment(-1),
    });
  }
}

// =================================================================
// SERVICE INSTANCE FACTORY
// =================================================================

let projectServiceInstance: ProjectService;

export function getProjectService(db: Firestore): ProjectService {
  if (!projectServiceInstance) {
    projectServiceInstance = new ProjectService(db);
  }
  return projectServiceInstance;
}
