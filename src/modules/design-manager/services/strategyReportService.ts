/**
 * Strategy Report Service
 * CRUD operations and management for persisted strategy reports
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
  Timestamp,
  arrayUnion,
} from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { db } from '@/shared/services/firebase';
import type {
  StrategyReportDocument,
  ReportStatus,
  VersionEntry,
  GenerationContext,
} from '../types/strategyReport';
import type { StrategyReport, GenerateStrategyInput } from '@/modules/strategy/types';

// Collection names
const STRATEGY_REPORTS_COLLECTION = 'strategyReports';
const PROJECT_STRATEGY_COLLECTION = 'projectStrategy';

// ============================================
// Report Creation
// ============================================

/**
 * Create a strategy report from AI generation and persist to Firestore
 */
export async function createStrategyReportFromGeneration(
  projectId: string,
  generatedReport: StrategyReport,
  userId: string,
  inputParams: GenerateStrategyInput,
  strategySnapshot?: any
): Promise<StrategyReportDocument> {
  const reportRef = doc(collection(db, STRATEGY_REPORTS_COLLECTION));
  const now = Timestamp.now();

  const generationContext: GenerationContext = {
    strategySnapshot,
    inputParameters: inputParams,
    generatedAt: now,
    generatedBy: userId,
    aiModel: 'gemini-2.0-flash',
  };

  const versionEntry: VersionEntry = {
    version: 1,
    changedBy: userId,
    changedAt: now,
    changeType: 'generated',
    changedFields: ['*'],
    changeNotes: 'Initial AI generation',
  };

  const report: Omit<StrategyReportDocument, 'id'> = {
    projectId,
    projectCode: inputParams.projectType || '',
    projectName: inputParams.projectName,
    reportTitle: generatedReport.reportTitle,
    version: 1,
    status: 'draft',

    // Content from AI
    executiveSummary: generatedReport.executiveSummary,
    trends: generatedReport.trends,
    recommendations: generatedReport.recommendations,
    materialPalette: generatedReport.materialPalette,
    colorScheme: generatedReport.colorScheme,
    productionFeasibility: generatedReport.productionFeasibility,
    productionDetails: generatedReport.productionDetails,
    nextSteps: generatedReport.nextSteps,
    productRecommendations: generatedReport.productRecommendations,
    inspirationGallery: generatedReport.inspirationGallery,

    versionHistory: [versionEntry],
    generationContext,

    manualEdits: [],
    isSynced: true,
    syncStatus: 'in_sync',
    lastSyncedAt: now,

    createdAt: now,
    createdBy: userId,
    updatedAt: now,
    updatedBy: userId,
  };

  await setDoc(reportRef, report);

  // Update projectStrategy to reference this report
  const strategyRef = doc(db, PROJECT_STRATEGY_COLLECTION, projectId);
  await updateDoc(strategyRef, {
    activeReportId: reportRef.id,
    reportHistory: arrayUnion(reportRef.id),
  });

  return { id: reportRef.id, ...report };
}

// ============================================
// Report CRUD Operations
// ============================================

/**
 * Get a strategy report by ID
 */
export async function getStrategyReport(reportId: string): Promise<StrategyReportDocument | null> {
  const docRef = doc(db, STRATEGY_REPORTS_COLLECTION, reportId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  return { id: docSnap.id, ...docSnap.data() } as StrategyReportDocument;
}

/**
 * Get all reports for a project
 */
export async function getProjectReports(projectId: string): Promise<StrategyReportDocument[]> {
  const q = query(
    collection(db, STRATEGY_REPORTS_COLLECTION),
    where('projectId', '==', projectId),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as StrategyReportDocument[];
}

/**
 * Update a strategy report
 */
export async function updateStrategyReport(
  reportId: string,
  updates: Partial<StrategyReportDocument>,
  userId: string
): Promise<void> {
  const docRef = doc(db, STRATEGY_REPORTS_COLLECTION, reportId);

  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
    version: increment(1),
  });
}

/**
 * Delete a strategy report (only if draft status)
 */
export async function deleteStrategyReport(reportId: string): Promise<void> {
  const report = await getStrategyReport(reportId);

  if (!report) {
    throw new Error('Report not found');
  }

  if (report.status !== 'draft') {
    throw new Error('Only draft reports can be deleted');
  }

  const docRef = doc(db, STRATEGY_REPORTS_COLLECTION, reportId);
  await deleteDoc(docRef);

  // Update projectStrategy to remove reference
  const strategyRef = doc(db, PROJECT_STRATEGY_COLLECTION, report.projectId);
  const strategyDoc = await getDoc(strategyRef);

  if (strategyDoc.exists()) {
    const data = strategyDoc.data();
    if (data.activeReportId === reportId) {
      await updateDoc(strategyRef, {
        activeReportId: null,
      });
    }
  }
}

// ============================================
// Status Management
// ============================================

/**
 * Transition report status
 */
export async function transitionReportStatus(
  reportId: string,
  newStatus: ReportStatus,
  userId: string,
  notes?: string
): Promise<void> {
  const report = await getStrategyReport(reportId);

  if (!report) {
    throw new Error('Report not found');
  }

  const now = Timestamp.now();
  const versionEntry: VersionEntry = {
    version: report.version + 1,
    changedBy: userId,
    changedAt: now,
    changeType: newStatus === 'finalized' ? 'finalized' : 'edited',
    changedFields: ['status'],
    changeNotes: notes,
  };

  const updates: Partial<StrategyReportDocument> = {
    status: newStatus,
    versionHistory: [...report.versionHistory, versionEntry],
  };

  if (newStatus === 'finalized') {
    updates.finalizedAt = now;
    updates.finalizedBy = userId;
  }

  await updateStrategyReport(reportId, updates, userId);
}

/**
 * Finalize a report (shorthand for transitioning to finalized status)
 */
export async function finalizeReport(reportId: string, userId: string): Promise<void> {
  await transitionReportStatus(reportId, 'finalized', userId, 'Report finalized for sharing');
}

// ============================================
// Synchronization & Refresh
// ============================================

/**
 * Check if strategy data is complete enough to auto-generate report
 */
function isStrategyComplete(strategy: any): boolean {
  return (
    strategy?.challenges?.painPoints?.length > 0 ||
    strategy?.challenges?.goals?.length > 0 ||
    strategy?.designBrief !== undefined
  );
}

/**
 * Get or generate active report for a project
 * Implements generate-on-first-access pattern for backward compatibility
 */
export async function getOrGenerateActiveReport(
  projectId: string,
  userId: string
): Promise<StrategyReportDocument | null> {
  const strategyRef = doc(db, PROJECT_STRATEGY_COLLECTION, projectId);
  const strategyDoc = await getDoc(strategyRef);

  if (!strategyDoc.exists()) return null;

  const strategy = strategyDoc.data();

  // Check for existing active report
  if (strategy.activeReportId) {
    const report = await getStrategyReport(strategy.activeReportId);
    if (report) return report;
  }

  // No active report - check if strategy is complete for auto-generation
  if (isStrategyComplete(strategy)) {
    // Return null here - caller should trigger manual generation
    // We don't want to auto-generate without user consent
    return null;
  }

  return null;
}

/**
 * Refresh report from strategy (regenerate or mark as synced)
 */
export async function refreshReportFromStrategy(
  reportId: string,
  userId: string,
  options: {
    preserveManualEdits: boolean;
    forceRegenerate: boolean;
  }
): Promise<StrategyReportDocument> {
  const report = await getStrategyReport(reportId);

  if (!report) {
    throw new Error('Report not found');
  }

  const now = Timestamp.now();

  if (options.forceRegenerate) {
    // Get the project strategy to regenerate from
    const strategyRef = doc(db, PROJECT_STRATEGY_COLLECTION, report.projectId);
    const strategyDoc = await getDoc(strategyRef);

    if (!strategyDoc.exists()) {
      throw new Error('Project strategy not found');
    }

    const strategy = strategyDoc.data();

    // Import and call the strategy generation function
    // We use dynamic import to avoid circular dependencies
    const { generateStrategyReportContent } = await import('./aiService');

    // Build input params from existing report context
    const inputParams: GenerateStrategyInput = {
      projectName: report.projectName,
      projectType: report.projectCode,
      // Use strategy data for regeneration
      challenges: strategy.challenges,
      spaceParameters: strategy.spaceParameters,
      budgetFramework: strategy.budgetFramework,
      designBrief: strategy.designBrief,
    };

    // Generate new content
    const generatedReport = await generateStrategyReportContent(inputParams);

    // Prepare updated content
    let updatedContent: Partial<StrategyReportDocument> = {
      executiveSummary: generatedReport.executiveSummary,
      trends: generatedReport.trends,
      recommendations: generatedReport.recommendations,
      materialPalette: generatedReport.materialPalette,
      colorScheme: generatedReport.colorScheme,
      productionFeasibility: generatedReport.productionFeasibility,
      productionDetails: generatedReport.productionDetails,
      nextSteps: generatedReport.nextSteps,
      productRecommendations: generatedReport.productRecommendations,
      inspirationGallery: generatedReport.inspirationGallery,
    };

    // Preserve manual edits if requested
    if (options.preserveManualEdits && report.manualEdits && report.manualEdits.length > 0) {
      // Apply manual edits on top of regenerated content
      for (const edit of report.manualEdits) {
        if (edit.field && edit.value !== undefined) {
          (updatedContent as any)[edit.field] = edit.value;
        }
      }
    }

    // Create version entry
    const versionEntry: VersionEntry = {
      version: report.version + 1,
      changedBy: userId,
      changedAt: now,
      changeType: 'regenerated',
      changedFields: Object.keys(updatedContent),
      changeNotes: options.preserveManualEdits
        ? 'Regenerated from strategy (manual edits preserved)'
        : 'Regenerated from strategy',
    };

    // Update generation context
    const generationContext: GenerationContext = {
      strategySnapshot: strategy,
      inputParameters: inputParams,
      generatedAt: now,
      generatedBy: userId,
      aiModel: 'gemini-2.0-flash',
    };

    await updateStrategyReport(
      reportId,
      {
        ...updatedContent,
        syncStatus: 'in_sync',
        isSynced: true,
        lastSyncedAt: now,
        staleReason: undefined,
        generationContext,
        versionHistory: [...report.versionHistory, versionEntry],
      },
      userId
    );

    return await getStrategyReport(reportId) as StrategyReportDocument;
  } else {
    // Just mark as synced (user reviewed and confirmed no changes needed)
    const versionEntry: VersionEntry = {
      version: report.version + 1,
      changedBy: userId,
      changedAt: now,
      changeType: 'edited',
      changedFields: ['syncStatus'],
      changeNotes: 'Marked as synced with current strategy',
    };

    await updateStrategyReport(
      reportId,
      {
        syncStatus: 'in_sync',
        isSynced: true,
        lastSyncedAt: now,
        staleReason: undefined,
        versionHistory: [...report.versionHistory, versionEntry],
      },
      userId
    );

    return await getStrategyReport(reportId) as StrategyReportDocument;
  }
}

// ============================================
// Client Portal Sharing
// ============================================

/**
 * Share a strategy report to client portal
 * Creates a clientPortalShare document with token-based access
 */
export async function shareStrategyReportToPortal(
  reportId: string,
  customerName: string,
  customerEmail: string | undefined,
  userId: string,
  options?: {
    expiresInDays?: number;
    allowComments?: boolean;
  }
): Promise<{ shareId: string; accessUrl: string; accessToken: string }> {
  const report = await getStrategyReport(reportId);

  if (!report) {
    throw new Error('Report not found');
  }

  if (report.status !== 'finalized') {
    throw new Error('Only finalized reports can be shared');
  }

  const accessToken = nanoid(32);
  const now = Timestamp.now();

  // Calculate expiration if specified
  let expiresAt: Timestamp | undefined;
  if (options?.expiresInDays) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + options.expiresInDays);
    expiresAt = Timestamp.fromDate(expirationDate);
  }

  // Create clientPortalShare document
  const shareRef = doc(collection(db, 'clientPortalShares'));
  const share = {
    type: 'strategy_report',
    projectId: report.projectId,
    projectName: report.projectName,
    customerName,
    customerEmail,
    contentId: reportId,
    contentTitle: report.reportTitle,
    accessToken,
    expiresAt,
    permissions: {
      canView: true,
      canComment: options?.allowComments ?? false,
    },
    status: 'active',
    viewCount: 0,
    createdAt: now,
    createdBy: userId,
  };

  await setDoc(shareRef, share);

  // Update report to mark as shared
  await updateStrategyReport(
    reportId,
    {
      sharedToPortal: true,
      sharedToPortalAt: now,
      sharedToPortalBy: userId,
      accessToken,
      status: 'shared',
    },
    userId
  );

  const accessUrl = `${window.location.origin}/client-portal/strategy/${accessToken}`;

  return { shareId: shareRef.id, accessUrl, accessToken };
}

/**
 * Get portal share by token
 */
export async function getPortalShareByToken(
  token: string,
  shareType?: string
): Promise<any | null> {
  const q = query(
    collection(db, 'clientPortalShares'),
    where('accessToken', '==', token),
    where('status', '==', 'active')
  );

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) return null;

  const shareDoc = querySnapshot.docs[0];
  const share = { id: shareDoc.id, ...shareDoc.data() };

  // Check type if specified
  if (shareType && share.type !== shareType) {
    return null;
  }

  // Check expiration
  if (share.expiresAt && share.expiresAt.toDate() < new Date()) {
    // Mark as expired
    await updateDoc(shareDoc.ref, { status: 'expired' });
    return null;
  }

  return share;
}

/**
 * Track a view of a shared report
 */
export async function trackShareView(shareId: string): Promise<void> {
  const shareRef = doc(db, 'clientPortalShares', shareId);
  await updateDoc(shareRef, {
    viewedAt: serverTimestamp(),
    viewCount: increment(1),
  });
}
