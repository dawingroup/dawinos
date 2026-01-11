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
  updateParsingJobStatus,
  type ParsingJob,
} from '../services/parsingService';
import type { ParsedBOQItem } from '../ai/schemas/boqSchema';
import * as XLSX from 'xlsx';

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

  // Parse Excel file locally
  const parseExcelLocally = async (file: File, jobId: string): Promise<ParsedBOQItem[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          // Update progress: Analyzing
          await updateParsingJobStatus(orgId, projectId, jobId, 'processing', { progress: 15 });
          
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Update progress: Extracting
          await updateParsingJobStatus(orgId, projectId, jobId, 'processing', { progress: 30 });
          
          const parsedItems: ParsedBOQItem[] = [];
          
          // Process each sheet
          for (let i = 0; i < workbook.SheetNames.length; i++) {
            const sheetName = workbook.SheetNames[i];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet) as Record<string, any>[];
            
            // Update progress based on sheet processing
            const sheetProgress = 30 + ((i + 1) / workbook.SheetNames.length) * 40;
            await updateParsingJobStatus(orgId, projectId, jobId, 'processing', { progress: Math.round(sheetProgress) });
            
            // Try to extract BOQ items from the sheet
            for (const row of jsonData) {
              // Look for common BOQ column patterns
              const item = extractBOQItem(row, parsedItems.length + 1);
              if (item) {
                parsedItems.push(item);
              }
            }
          }
          
          // Update progress: Matching
          await updateParsingJobStatus(orgId, projectId, jobId, 'processing', { progress: 80 });
          
          // Simulate material matching delay
          await new Promise(r => setTimeout(r, 500));
          
          // Update progress: Complete - save parsed items to job document
          await updateParsingJobStatus(orgId, projectId, jobId, 'completed', { 
            progress: 100,
            parsedItems
          });
          
          resolve(parsedItems);
        } catch (err) {
          reject(err);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };
  
  // Extract BOQ item from row data
  const extractBOQItem = (row: Record<string, any>, index: number): ParsedBOQItem | null => {
    // Common column name patterns for BOQ items
    const descKeys = ['description', 'desc', 'item', 'item description', 'particulars', 'work item'];
    const qtyKeys = ['qty', 'quantity', 'qnty', 'amount'];
    const unitKeys = ['unit', 'uom', 'units'];
    const rateKeys = ['rate', 'unit rate', 'price', 'unit price'];
    const amountKeys = ['amount', 'total', 'total amount', 'value'];
    
    const findValue = (keys: string[]) => {
      for (const key of keys) {
        const found = Object.entries(row).find(([k]) => k.toLowerCase().includes(key));
        if (found && found[1] !== undefined && found[1] !== '') {
          return found[1];
        }
      }
      return null;
    };
    
    const description = findValue(descKeys);
    const quantity = parseFloat(String(findValue(qtyKeys) || 0)) || 0;
    const unit = String(findValue(unitKeys) || 'nr');
    const rate = parseFloat(String(findValue(rateKeys) || 0)) || 0;
    const amount = parseFloat(String(findValue(amountKeys) || 0)) || quantity * rate;
    
    // Skip if no meaningful data
    if (!description || (quantity === 0 && rate === 0 && amount === 0)) {
      return null;
    }
    
    return {
      itemCode: String(index),
      description: String(description),
      quantity,
      unit,
      rate,
      amount,
      confidence: 0.8,
    };
  };

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
      
      // Process file locally (client-side parsing)
      if (fileType === 'excel' || fileType === 'csv') {
        try {
          await parseExcelLocally(file, jobId);
        } catch (parseErr) {
          console.error('Local parsing failed:', parseErr);
          await updateParsingJobStatus(orgId, projectId, jobId, 'failed', {
            errorMessage: parseErr instanceof Error ? parseErr.message : 'Parsing failed'
          });
        }
      } else {
        // PDF parsing not supported locally
        await updateParsingJobStatus(orgId, projectId, jobId, 'failed', {
          errorMessage: 'PDF parsing requires server-side processing. Please upload Excel or CSV files.'
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  }, [orgId, projectId, userId]);

  // Import selected items
  const importItems = useCallback(async (items: ParsedBOQItem[]) => {
    console.log('importItems called with', items?.length, 'items, userId:', userId);
    
    if (!userId) {
      setError('User not authenticated');
      console.error('Import failed: User not authenticated');
      return [];
    }
    
    if (!items || items.length === 0) {
      setError('No items to import');
      console.error('Import failed: No items provided');
      return [];
    }
    
    setIsImporting(true);
    setError(null);
    
    try {
      console.log('Calling importParsedItems...', { orgId, projectId, itemCount: items.length });
      const importedIds = await importParsedItems(orgId, projectId, items, userId);
      console.log('importParsedItems returned:', importedIds);
      
      // Clear active job after successful import
      setActiveJob(null);
      setActiveJobId(null);
      
      return importedIds;
    } catch (err) {
      console.error('importParsedItems error:', err);
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
