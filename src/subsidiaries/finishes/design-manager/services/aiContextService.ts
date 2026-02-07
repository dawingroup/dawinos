/**
 * AI Context Service
 * Manages shared context across AI tools with change detection
 * 
 * Features:
 * - Tracks data snapshots for each section
 * - Detects when data changes between AI sessions
 * - Provides unified context to all AI tools
 * - Stores AI outputs with their source data snapshots
 */

import { doc, getDoc, setDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { db } from '@/shared/services/firebase';
import type { DesignItem } from '../types';

export interface DataSnapshot {
  timestamp: number;
  hash: string;
  data: Record<string, any>;
}

export interface AIOutput {
  id: string;
  toolName: string;
  timestamp: number;
  output: any;
  sourceSnapshot: DataSnapshot;
  isStale: boolean;
}

export interface AIContext {
  designItemId: string;
  projectId: string;
  lastUpdated: number;
  
  // Current data snapshots by section
  snapshots: {
    overview?: DataSnapshot;
    parameters?: DataSnapshot;
    parts?: DataSnapshot;
    files?: DataSnapshot;
    ragStatus?: DataSnapshot;
  };
  
  // AI outputs with their source snapshots
  outputs: AIOutput[];
  
  // Change flags
  changesDetected: {
    overview: boolean;
    parameters: boolean;
    parts: boolean;
    files: boolean;
    ragStatus: boolean;
  };
}

/**
 * Simple hash function for detecting data changes
 */
function hashData(data: any): string {
  if (!data || typeof data !== 'object') {
    return String(data || 'empty');
  }
  try {
    const keys = Object.keys(data).sort();
    const str = JSON.stringify(data, keys);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  } catch {
    return 'error';
  }
}

/**
 * Extract relevant data from a design item for a specific section
 */
function extractSectionData(item: DesignItem, section: string): Record<string, any> {
  switch (section) {
    case 'overview':
      return {
        name: item.name,
        description: item.description,
        category: item.category,
        priority: item.priority,
        currentStage: item.currentStage,
        sourcingType: (item as any).sourcingType,
      };
    case 'parameters':
      return (item as any).parameters || {};
    case 'parts':
      return { parts: (item as any).parts || [] };
    case 'ragStatus':
      return item.ragStatus || {};
    default:
      return {};
  }
}

/**
 * Create a snapshot of section data
 */
function createSnapshot(data: Record<string, any>): DataSnapshot {
  return {
    timestamp: Date.now(),
    hash: hashData(data),
    data,
  };
}

/**
 * Load AI context from Firestore
 */
export async function loadAIContext(designItemId: string, projectId: string): Promise<AIContext | null> {
  try {
    const contextRef = doc(db, 'aiContext', designItemId);
    const snapshot = await getDoc(contextRef);
    
    if (snapshot.exists()) {
      return snapshot.data() as AIContext;
    }
    return null;
  } catch (error) {
    console.error('Error loading AI context:', error);
    return null;
  }
}

/**
 * Save AI context to Firestore
 */
export async function saveAIContext(context: AIContext): Promise<void> {
  try {
    const contextRef = doc(db, 'aiContext', context.designItemId);
    await setDoc(contextRef, {
      ...context,
      lastUpdated: Date.now(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving AI context:', error);
  }
}

/**
 * Update context with current item data and detect changes
 */
export function updateContextWithItem(
  context: AIContext | null, 
  item: DesignItem,
  projectId: string
): AIContext {
  const sections = ['overview', 'parameters', 'parts', 'ragStatus'] as const;
  
  const newContext: AIContext = context || {
    designItemId: item.id,
    projectId,
    lastUpdated: Date.now(),
    snapshots: {},
    outputs: [],
    changesDetected: {
      overview: false,
      parameters: false,
      parts: false,
      files: false,
      ragStatus: false,
    },
  };
  
  // Check each section for changes
  for (const section of sections) {
    const currentData = extractSectionData(item, section);
    const currentHash = hashData(currentData);
    const previousSnapshot = newContext.snapshots[section];
    
    if (!previousSnapshot) {
      // First time - no change detected
      newContext.snapshots[section] = createSnapshot(currentData);
      newContext.changesDetected[section] = false;
    } else if (previousSnapshot.hash !== currentHash) {
      // Data has changed
      newContext.changesDetected[section] = true;
      // Mark relevant outputs as stale
      newContext.outputs = newContext.outputs.map(output => {
        if (output.sourceSnapshot.hash === previousSnapshot.hash) {
          return { ...output, isStale: true };
        }
        return output;
      });
    }
  }
  
  return newContext;
}

/**
 * Record an AI output with its source snapshot
 */
export function recordAIOutput(
  context: AIContext,
  toolName: string,
  output: any,
  sourceSections: string[]
): AIContext {
  // Create combined snapshot from source sections
  const combinedData: Record<string, any> = {};
  for (const section of sourceSections) {
    const snapshot = context.snapshots[section as keyof typeof context.snapshots];
    if (snapshot) {
      combinedData[section] = snapshot.data;
    }
  }
  
  const aiOutput: AIOutput = {
    id: `${toolName}-${Date.now()}`,
    toolName,
    timestamp: Date.now(),
    output,
    sourceSnapshot: createSnapshot(combinedData),
    isStale: false,
  };
  
  // Clear change flags for used sections
  const updatedChanges = { ...context.changesDetected };
  for (const section of sourceSections) {
    updatedChanges[section as keyof typeof updatedChanges] = false;
  }
  
  // Update snapshots to current
  const updatedSnapshots = { ...context.snapshots };
  for (const section of sourceSections) {
    const data = combinedData[section];
    if (data) {
      updatedSnapshots[section as keyof typeof updatedSnapshots] = createSnapshot(data);
    }
  }
  
  return {
    ...context,
    snapshots: updatedSnapshots,
    outputs: [...context.outputs.slice(-9), aiOutput], // Keep last 10 outputs
    changesDetected: updatedChanges,
    lastUpdated: Date.now(),
  };
}

/**
 * Get the latest output for a specific tool
 */
export function getLatestOutput(context: AIContext, toolName: string): AIOutput | null {
  const toolOutputs = context.outputs.filter(o => o.toolName === toolName);
  return toolOutputs.length > 0 ? toolOutputs[toolOutputs.length - 1] : null;
}

/**
 * Check if any sections have changes that affect a tool
 */
export function hasRelevantChanges(
  context: AIContext, 
  relevantSections: string[]
): boolean {
  return relevantSections.some(
    section => context.changesDetected[section as keyof typeof context.changesDetected]
  );
}

/**
 * Get a summary of changes for display
 */
export function getChangeSummary(context: AIContext): string[] {
  const changes: string[] = [];
  const labels: Record<string, string> = {
    overview: 'Overview information',
    parameters: 'Parameters & specifications',
    parts: 'Parts list',
    files: 'Attached files',
    ragStatus: 'RAG status',
  };
  
  for (const [section, hasChange] of Object.entries(context.changesDetected)) {
    if (hasChange) {
      changes.push(labels[section] || section);
    }
  }
  
  return changes;
}
