/**
 * Stage Gate Validation Utilities
 * Functions for validating stage transitions and gate criteria
 */

import type { DesignItem, DesignStage, RAGStatus, RAGStatusValue } from '../types';
import { getWorstStatus } from './rag-calculations';

/**
 * Gate criterion definition
 */
interface GateCriterion {
  aspect: string;
  requiredStatus: RAGStatusValue | RAGStatusValue[];
  allowNA?: boolean;
}

/**
 * Set of criteria for a gate
 */
interface GateCriteriaSet {
  mustMeet: GateCriterion[];
  shouldMeet: GateCriterion[];
  minimumReadiness: number;
}

/**
 * Gate criteria for each design stage
 */
export const GATE_CRITERIA: Record<DesignStage, GateCriteriaSet> = {
  concept: {
    mustMeet: [],
    shouldMeet: [],
    minimumReadiness: 0,
  },
  preliminary: {
    mustMeet: [
      { aspect: 'designCompleteness.overallDimensions', requiredStatus: 'green' },
    ],
    shouldMeet: [
      { aspect: 'designCompleteness.materialSpecs', requiredStatus: ['green', 'amber'] },
    ],
    minimumReadiness: 40,
  },
  technical: {
    mustMeet: [
      { aspect: 'designCompleteness.model3D', requiredStatus: 'green' },
      { aspect: 'designCompleteness.materialSpecs', requiredStatus: 'green' },
      { aspect: 'designCompleteness.hardwareSpecs', requiredStatus: 'green' },
      { aspect: 'qualityGates.clientApproval', requiredStatus: 'green' },
    ],
    shouldMeet: [
      { aspect: 'designCompleteness.productionDrawings', requiredStatus: ['green', 'amber'] },
    ],
    minimumReadiness: 60,
  },
  'pre-production': {
    mustMeet: [
      { aspect: 'designCompleteness.productionDrawings', requiredStatus: 'green' },
      { aspect: 'designCompleteness.joineryDetails', requiredStatus: 'green' },
      { aspect: 'designCompleteness.tolerances', requiredStatus: 'green' },
      { aspect: 'qualityGates.manufacturingReview', requiredStatus: 'green' },
    ],
    shouldMeet: [
      { aspect: 'manufacturingReadiness.materialAvailability', requiredStatus: ['green', 'amber'] },
      { aspect: 'manufacturingReadiness.costValidation', requiredStatus: ['green', 'amber'] },
    ],
    minimumReadiness: 80,
  },
  'production-ready': {
    mustMeet: [
      { aspect: 'ALL', requiredStatus: 'green', allowNA: true },
    ],
    shouldMeet: [],
    minimumReadiness: 95,
  },
};

/**
 * Result of a gate check
 */
export interface GateCheckResult {
  canAdvance: boolean;
  failures: string[];
  warnings: string[];
}

/**
 * Check if an item can advance to a target stage
 * @param item - Design item to check
 * @param targetStage - Target stage to advance to
 * @returns Gate check result
 */
export function canAdvanceToStage(
  item: DesignItem, 
  targetStage: DesignStage
): GateCheckResult {
  const criteria = GATE_CRITERIA[targetStage];
  if (!criteria) return { canAdvance: true, failures: [], warnings: [] };
  
  const failures: string[] = [];
  const warnings: string[] = [];
  
  // Check must-meet criteria
  for (const criterion of criteria.mustMeet) {
    if (criterion.aspect === 'ALL') {
      const worstStatus = getWorstStatus(item.ragStatus);
      if (worstStatus !== 'green') {
        failures.push('All aspects must be green for production release');
      }
    } else {
      const status = getAspectStatus(item.ragStatus, criterion.aspect);
      const required = Array.isArray(criterion.requiredStatus) 
        ? criterion.requiredStatus 
        : [criterion.requiredStatus];
      
      if (!required.includes(status) && status !== 'not-applicable') {
        failures.push(`${formatAspectName(criterion.aspect)} must be ${required.join(' or ')}`);
      }
    }
  }
  
  // Check should-meet criteria (warnings only)
  for (const criterion of criteria.shouldMeet) {
    const status = getAspectStatus(item.ragStatus, criterion.aspect);
    const required = Array.isArray(criterion.requiredStatus) 
      ? criterion.requiredStatus 
      : [criterion.requiredStatus];
    
    if (!required.includes(status) && status !== 'not-applicable') {
      warnings.push(`${formatAspectName(criterion.aspect)} should be ${required.join(' or ')}`);
    }
  }
  
  // Check minimum readiness
  if (criteria.minimumReadiness && item.overallReadiness < criteria.minimumReadiness) {
    failures.push(`Overall readiness must be at least ${criteria.minimumReadiness}%`);
  }
  
  return { canAdvance: failures.length === 0, failures, warnings };
}

/**
 * Get status of a specific aspect by path
 * @param ragStatus - RAG status object
 * @param path - Dot-notation path (e.g., 'designCompleteness.model3D')
 * @returns Status value
 */
function getAspectStatus(ragStatus: RAGStatus, path: string): RAGStatusValue {
  const parts = path.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = ragStatus;
  for (const part of parts) {
    current = current?.[part];
  }
  return current?.status || 'red';
}

/**
 * Format aspect path to human-readable name
 * @param path - Dot-notation path
 * @returns Formatted name
 */
function formatAspectName(path: string): string {
  const lastPart = path.split('.').pop() || path;
  return lastPart
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Ordered list of design stages
 */
export const STAGE_ORDER: DesignStage[] = [
  'concept',
  'preliminary',
  'technical',
  'pre-production',
  'production-ready',
];

/**
 * Get the next stage in the workflow
 * @param currentStage - Current stage
 * @returns Next stage or null if at end
 */
export function getNextStage(currentStage: DesignStage): DesignStage | null {
  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  if (currentIndex === -1 || currentIndex === STAGE_ORDER.length - 1) {
    return null;
  }
  return STAGE_ORDER[currentIndex + 1];
}

/**
 * Get the previous stage in the workflow
 * @param currentStage - Current stage
 * @returns Previous stage or null if at start
 */
export function getPreviousStage(currentStage: DesignStage): DesignStage | null {
  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  if (currentIndex <= 0) {
    return null;
  }
  return STAGE_ORDER[currentIndex - 1];
}

/**
 * Get stage index (0-based)
 * @param stage - Design stage
 * @returns Index in STAGE_ORDER
 */
export function getStageIndex(stage: DesignStage): number {
  return STAGE_ORDER.indexOf(stage);
}

/**
 * Check if stage A comes before stage B
 * @param stageA - First stage
 * @param stageB - Second stage
 * @returns True if stageA comes before stageB
 */
export function isStageBeforeOrEqual(stageA: DesignStage, stageB: DesignStage): boolean {
  return getStageIndex(stageA) <= getStageIndex(stageB);
}

/**
 * Get all stages up to and including the given stage
 * @param stage - Target stage
 * @returns Array of stages
 */
export function getStagesUpTo(stage: DesignStage): DesignStage[] {
  const index = getStageIndex(stage);
  return STAGE_ORDER.slice(0, index + 1);
}

/**
 * Get completion percentage through the stages
 * @param stage - Current stage
 * @returns Percentage 0-100
 */
export function getStageProgress(stage: DesignStage): number {
  const index = getStageIndex(stage);
  return Math.round((index / (STAGE_ORDER.length - 1)) * 100);
}
