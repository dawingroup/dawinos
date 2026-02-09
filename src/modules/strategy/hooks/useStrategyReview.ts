// ============================================================================
// useStrategyReview HOOK
// DawinOS v2.0 - CEO Strategy Command
// Manages strategy review state with Firestore auto-save
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../shared/hooks/useAuth';
import { strategyReviewService } from '../services/strategyReview.service';
import { createEmptyReviewData } from '../constants/strategyReview.constants';
import type { StrategyReviewData } from '../types/strategy.types';

export interface UseStrategyReviewOptions {
  companyId: string;
  reviewId?: string;
  autoSaveMs?: number;
}

export interface UseStrategyReviewReturn {
  reviewData: StrategyReviewData;
  setReviewData: React.Dispatch<React.SetStateAction<StrategyReviewData>>;
  updateReviewField: <K extends keyof StrategyReviewData>(key: K, value: StrategyReviewData[K]) => void;
  isLoading: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;
  error: string | null;
  save: () => Promise<void>;
  deleteReview: () => Promise<void>;
}

export function useStrategyReview({
  companyId,
  reviewId,
  autoSaveMs = 5000,
}: UseStrategyReviewOptions): UseStrategyReviewReturn {
  const { user } = useAuth();
  const userId = user?.uid || '';

  // Generate a stable ID for new reviews
  const stableIdRef = useRef<string>(reviewId || crypto.randomUUID());
  const effectiveId = reviewId || stableIdRef.current;

  const [reviewData, setReviewData] = useState<StrategyReviewData>(
    () => createEmptyReviewData(companyId, userId) as unknown as StrategyReviewData
  );
  const [isLoading, setIsLoading] = useState(!!reviewId);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const reviewDataRef = useRef(reviewData);
  reviewDataRef.current = reviewData;

  // --------------------------------------------------------------------------
  // Load existing review
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!reviewId || !companyId) return;

    let cancelled = false;
    setIsLoading(true);

    strategyReviewService
      .getReview(companyId, reviewId)
      .then((data) => {
        if (cancelled) return;
        if (data) {
          setReviewData(data);
          setLastSavedAt(data.updatedAt);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [reviewId, companyId]);

  // --------------------------------------------------------------------------
  // Auto-save
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isDirty || !companyId || !userId) return;

    const timer = setTimeout(async () => {
      try {
        setIsSaving(true);
        await strategyReviewService.autoSave(
          companyId,
          effectiveId,
          reviewDataRef.current,
          userId
        );
        const now = new Date().toISOString();
        setLastSavedAt(now);
        setIsDirty(false);
      } catch (err) {
        console.error('Auto-save failed:', err);
      } finally {
        setIsSaving(false);
      }
    }, autoSaveMs);

    return () => clearTimeout(timer);
  }, [isDirty, companyId, userId, effectiveId, autoSaveMs]);

  // --------------------------------------------------------------------------
  // Mark dirty on data change (skip initial load)
  // --------------------------------------------------------------------------
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setIsDirty(true);
  }, [reviewData]);

  // --------------------------------------------------------------------------
  // Update helper
  // --------------------------------------------------------------------------
  const updateReviewField = useCallback(<K extends keyof StrategyReviewData>(
    key: K,
    value: StrategyReviewData[K]
  ) => {
    setReviewData((prev) => ({ ...prev, [key]: value }));
  }, []);

  // --------------------------------------------------------------------------
  // Manual save
  // --------------------------------------------------------------------------
  const save = useCallback(async () => {
    if (!companyId || !userId) return;
    setIsSaving(true);
    setError(null);
    try {
      await strategyReviewService.saveReview(
        companyId,
        effectiveId,
        reviewDataRef.current,
        userId
      );
      setLastSavedAt(new Date().toISOString());
      setIsDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  }, [companyId, userId, effectiveId]);

  // --------------------------------------------------------------------------
  // Delete
  // --------------------------------------------------------------------------
  const deleteReview = useCallback(async () => {
    if (!companyId) return;
    await strategyReviewService.deleteReview(companyId, effectiveId);
  }, [companyId, effectiveId]);

  return {
    reviewData,
    setReviewData,
    updateReviewField,
    isLoading,
    isSaving,
    lastSavedAt,
    error,
    save,
    deleteReview,
  };
}
