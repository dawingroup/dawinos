/**
 * useClips Hook
 * React hook for managing design clips
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  subscribeToClips, 
  createClip, 
  updateClip, 
  deleteClip,
  linkClipToDesignItem,
} from '../services/clipService';
import type { DesignClip, ClipFilter } from '../types';

interface UseClipsOptions {
  filter?: ClipFilter;
  projectId?: string;
}

interface UseClipsReturn {
  clips: DesignClip[];
  loading: boolean;
  error: Error | null;
  createClip: (clip: Omit<DesignClip, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => Promise<string>;
  updateClip: (clipId: string, updates: Partial<DesignClip>) => Promise<void>;
  deleteClip: (clipId: string) => Promise<void>;
  linkToDesignItem: (clipId: string, projectId: string, designItemId: string) => Promise<void>;
  refresh: () => void;
}

export function useClips(options: UseClipsOptions = {}): UseClipsReturn {
  const { user } = useAuth();
  const [clips, setClips] = useState<DesignClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const filter: ClipFilter = {
    ...options.filter,
    projectId: options.projectId,
  };

  useEffect(() => {
    if (!user?.email) {
      setClips([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToClips(user.email, filter, (newClips) => {
      setClips(newClips);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.email, options.projectId, refreshKey]);

  const handleCreateClip = useCallback(async (
    clipData: Omit<DesignClip, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ) => {
    if (!user?.email) throw new Error('Not authenticated');
    
    return createClip({
      ...clipData,
      createdBy: user.email,
      syncStatus: 'synced',
    });
  }, [user?.email]);

  const handleUpdateClip = useCallback(async (clipId: string, updates: Partial<DesignClip>) => {
    await updateClip(clipId, updates);
  }, []);

  const handleDeleteClip = useCallback(async (clipId: string) => {
    await deleteClip(clipId);
  }, []);

  const handleLinkToDesignItem = useCallback(async (
    clipId: string, 
    projectId: string, 
    designItemId: string
  ) => {
    await linkClipToDesignItem(clipId, projectId, designItemId);
  }, []);

  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  return {
    clips,
    loading,
    error,
    createClip: handleCreateClip,
    updateClip: handleUpdateClip,
    deleteClip: handleDeleteClip,
    linkToDesignItem: handleLinkToDesignItem,
    refresh,
  };
}
