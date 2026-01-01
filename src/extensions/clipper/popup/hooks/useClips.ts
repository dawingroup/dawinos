import { useState, useEffect, useCallback } from 'react';
import type { ClipRecord } from '../../types/database';
import { clipService } from '../../lib/clip-service';

interface UseClipsReturn {
  clips: ClipRecord[];
  pendingCount: number;
  isLoading: boolean;
  syncClips: () => Promise<void>;
  deleteClip: (clipId: string) => Promise<void>;
  updateClip: (clipId: string, updates: Partial<ClipRecord>) => Promise<void>;
}

export function useClips(): UseClipsReturn {
  const [clips, setClips] = useState<ClipRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadClips = useCallback(async () => {
    try {
      const allClips = await clipService.getAllClips();
      // Sort by createdAt descending
      allClips.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setClips(allClips);
    } catch (error) {
      console.error('Failed to load clips:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClips();

    // Subscribe to clip events
    const unsubscribe = clipService.subscribe((event) => {
      if (event.type === 'clip-saved' || event.type === 'clip-updated' || event.type === 'clip-deleted') {
        loadClips();
      }
    });

    return () => unsubscribe();
  }, [loadClips]);

  const pendingCount = clips.filter((c) => c.syncStatus === 'pending').length;

  const syncClips = async () => {
    try {
      await chrome.runtime.sendMessage({ type: 'REQUEST_SYNC' });
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const deleteClip = async (clipId: string) => {
    try {
      await clipService.deleteClip(clipId);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const updateClip = async (clipId: string, updates: Partial<ClipRecord>) => {
    try {
      await clipService.updateClip(clipId, updates);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  return {
    clips,
    pendingCount,
    isLoading,
    syncClips,
    deleteClip,
    updateClip,
  };
}
