/**
 * BOQ Parsing Hook
 * Manages file upload, parsing jobs, and import of parsed items
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/core/hooks/useAuth';
import {
  uploadBOQFile,
  createParsingJob,
  subscribeToParsingJob,
  importParsedItems,
  getParsingJobs,
  type ParsingJob,
} from '../services/parsingService';
import type { ParsedBOQItem } from '../ai/schemas/boqSchema';

// Default organization ID
const DEFAULT_ORG_ID = 'default';

interface UseBOQParsingOptions {
  projectId: string;
}

export function useBOQParsing({ projectId }: UseBOQParsingOptions) {
  const { user } = useAuth();
  const orgId = (user as { organizationId?: string })?.organizationId || DEFAULT_ORG_ID;
  const userId = user?.uid;
  
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<ParsingJob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsingHistory, setParsingHistory] = useState<ParsingJob[]>([]);

  // Subscribe to active job updates
  useEffect(() => {
    if (!activeJobId || !projectId) return;
    
    const unsubscribe = subscribeToParsingJob(
      orgId,
      projectId,
      activeJobId,
      (job) => {
        setActiveJob(job);
        
        if (job?.status === 'completed') {
          // Refresh parsing history when job completes
          loadParsingHistory();
        } else if (job?.status === 'failed') {
          setError(job.errorMessage || 'Parsing failed');
        }
      }
    );
    
    return () => unsubscribe();
  }, [activeJobId, orgId, projectId]);

  // Load parsing history
  const loadParsingHistory = useCallback(async () => {
    if (!projectId) return;
    
    try {
      const jobs = await getParsingJobs(orgId, projectId);
      setParsingHistory(jobs);
    } catch (err) {
      console.error('Failed to load parsing history:', err);
    }
  }, [orgId, projectId]);

  // Load history on mount
  useEffect(() => {
    loadParsingHistory();
  }, [loadParsingHistory]);

  // Start parsing a file
  const startParsing = useCallback(async (file: File) => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      // Upload file
      const { fileUrl, fileType } = await uploadBOQFile(orgId, projectId, file);
      
      // Create parsing job
      const jobId = await createParsingJob(
        orgId,
        projectId,
        userId,
        file.name,
        fileUrl,
        fileType
      );
      
      setActiveJobId(jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  }, [orgId, projectId, userId]);

  // Import selected items
  const importItems = useCallback(async (items: ParsedBOQItem[]) => {
    if (!userId) {
      setError('User not authenticated');
      return [];
    }
    
    setIsImporting(true);
    setError(null);
    
    try {
      const importedIds = await importParsedItems(orgId, projectId, items, userId);
      
      // Clear active job after successful import
      setActiveJob(null);
      setActiveJobId(null);
      
      return importedIds;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import items');
      return [];
    } finally {
      setIsImporting(false);
    }
  }, [orgId, projectId, userId]);

  // Clear active job
  const clearActiveJob = useCallback(() => {
    setActiveJob(null);
    setActiveJobId(null);
    setError(null);
  }, []);

  // Computed states
  const isProcessing = activeJob?.status === 'processing' || isUploading;
  const progress = activeJob?.progress || 0;
  const parsedItems = activeJob?.parsedItems || [];

  return {
    // State
    activeJob,
    isProcessing,
    isUploading,
    isImporting,
    progress,
    parsedItems,
    parsingHistory,
    error,
    
    // Actions
    startParsing,
    importItems,
    clearActiveJob,
    refreshHistory: loadParsingHistory,
  };
}
