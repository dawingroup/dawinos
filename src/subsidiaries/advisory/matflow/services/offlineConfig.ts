/**
 * Firebase Offline Configuration
 * Initialize and manage Firestore offline persistence
 */

import {
  enableIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence,
  disableNetwork,
  enableNetwork,
  waitForPendingWrites,
  onSnapshotsInSync,
} from 'firebase/firestore';
import { db } from '@/core/services/firebase';

// ============================================================================
// PERSISTENCE INITIALIZATION
// ============================================================================

let persistenceInitialized = false;
let persistenceError: Error | null = null;

/**
 * Initialize Firestore offline persistence
 * Should be called once at app startup
 */
export async function initializeOfflinePersistence(): Promise<{
  success: boolean;
  error?: Error;
  multiTabSupported: boolean;
}> {
  if (persistenceInitialized) {
    return { success: true, multiTabSupported: true };
  }

  try {
    // Try multi-tab persistence first (preferred)
    await enableMultiTabIndexedDbPersistence(db);
    persistenceInitialized = true;
    console.log('[Offline] Multi-tab persistence enabled');
    return { success: true, multiTabSupported: true };
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    
    if (error.code === 'failed-precondition') {
      // Multiple tabs open, fall back to single-tab
      console.warn('[Offline] Multiple tabs detected, using single-tab persistence');
      
      try {
        await enableIndexedDbPersistence(db);
        persistenceInitialized = true;
        return { success: true, multiTabSupported: false };
      } catch (innerErr: unknown) {
        persistenceError = innerErr as Error;
        console.error('[Offline] Failed to enable persistence:', innerErr);
        return { success: false, error: innerErr as Error, multiTabSupported: false };
      }
    } else if (error.code === 'unimplemented') {
      // Browser doesn't support IndexedDB
      console.error('[Offline] Browser does not support offline persistence');
      persistenceError = err as Error;
      return { success: false, error: err as Error, multiTabSupported: false };
    } else {
      persistenceError = err as Error;
      console.error('[Offline] Unknown persistence error:', err);
      return { success: false, error: err as Error, multiTabSupported: false };
    }
  }
}

/**
 * Get persistence initialization status
 */
export function getPersistenceStatus(): {
  initialized: boolean;
  error: Error | null;
} {
  return {
    initialized: persistenceInitialized,
    error: persistenceError,
  };
}

// ============================================================================
// NETWORK CONTROL
// ============================================================================

/**
 * Manually disable network access (force offline mode)
 */
export async function goOffline(): Promise<void> {
  await disableNetwork(db);
  console.log('[Offline] Network disabled');
}

/**
 * Re-enable network access
 */
export async function goOnline(): Promise<void> {
  await enableNetwork(db);
  console.log('[Offline] Network enabled');
}

/**
 * Wait for all pending writes to complete
 */
export async function waitForSync(): Promise<void> {
  await waitForPendingWrites(db);
  console.log('[Offline] All pending writes synced');
}

/**
 * Subscribe to snapshot sync events
 */
export function onSyncComplete(callback: () => void): () => void {
  return onSnapshotsInSync(db, callback);
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Estimate current cache size
 */
export async function estimateCacheSize(): Promise<{
  usage: number;
  quota: number;
  percentUsed: number;
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
      percentUsed: estimate.quota
        ? ((estimate.usage || 0) / estimate.quota) * 100
        : 0,
    };
  }
  
  return { usage: 0, quota: 0, percentUsed: 0 };
}

/**
 * Request persistent storage (prevents browser from evicting cache)
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if ('storage' in navigator && 'persist' in navigator.storage) {
    const isPersisted = await navigator.storage.persisted();
    if (!isPersisted) {
      return await navigator.storage.persist();
    }
    return true;
  }
  return false;
}

/**
 * Clear Firestore cache (use with caution)
 */
export async function clearCache(): Promise<void> {
  // Note: Firestore doesn't provide a direct method to clear cache
  // The cache is managed automatically
  // This is a placeholder for manual IndexedDB clearing if needed
  
  if ('indexedDB' in window) {
    const databases = await indexedDB.databases();
    for (const dbInfo of databases) {
      if (dbInfo.name?.includes('firestore')) {
        console.warn('[Offline] Firestore cache found:', dbInfo.name);
        // Don't actually delete - just log for now
        // indexedDB.deleteDatabase(dbInfo.name);
      }
    }
  }
}

export const offlineConfig = {
  initializeOfflinePersistence,
  getPersistenceStatus,
  goOffline,
  goOnline,
  waitForSync,
  onSyncComplete,
  estimateCacheSize,
  requestPersistentStorage,
  clearCache,
};

export default offlineConfig;
