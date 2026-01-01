import { useState, useEffect, useCallback } from 'react';

// Simplified clip type for chrome.storage
interface StoredClip {
  id: string;
  imageUrl: string;
  sourceUrl: string;
  title: string;
  thumbnailDataUrl?: string;
  createdAt: string;
  syncStatus: 'pending' | 'synced';
  tags?: string[];
}

// Map to ClipRecord-like structure for UI compatibility
interface ClipRecord {
  id: string;
  imageUrl: string;
  sourceUrl: string;
  title: string;
  thumbnailBlob?: Blob;
  thumbnailDataUrl?: string;
  createdAt: Date;
  syncStatus: 'pending' | 'synced';
  tags: string[];
  price?: { amount: number; formatted: string };
}

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
      // Load clips from chrome.storage.local
      const result = await chrome.storage.local.get(['clips']);
      const storedClips: StoredClip[] = result.clips || [];
      
      // Map to ClipRecord format
      const mappedClips: ClipRecord[] = storedClips.map((clip) => ({
        id: clip.id,
        imageUrl: clip.imageUrl,
        sourceUrl: clip.sourceUrl,
        title: clip.title,
        thumbnailDataUrl: clip.thumbnailDataUrl,
        createdAt: new Date(clip.createdAt),
        syncStatus: clip.syncStatus,
        tags: clip.tags || [],
      }));
      
      // Sort by createdAt descending
      mappedClips.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setClips(mappedClips);
      console.log('Loaded clips:', mappedClips.length);
    } catch (error) {
      console.error('Failed to load clips:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClips();

    // Listen for storage changes
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.clips) {
        console.log('Clips storage changed');
        loadClips();
      }
    };
    chrome.storage.onChanged.addListener(handleStorageChange);

    // Refresh clips when popup opens/focuses
    const handleFocus = () => loadClips();
    window.addEventListener('focus', handleFocus);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
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
      const result = await chrome.storage.local.get(['clips']);
      const clips: StoredClip[] = result.clips || [];
      const filtered = clips.filter((c) => c.id !== clipId);
      await chrome.storage.local.set({ clips: filtered });
      loadClips();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const updateClip = async (clipId: string, updates: Partial<ClipRecord>) => {
    try {
      const result = await chrome.storage.local.get(['clips']);
      const clips: StoredClip[] = result.clips || [];
      const index = clips.findIndex((c) => c.id === clipId);
      if (index !== -1) {
        clips[index] = { ...clips[index], ...updates, createdAt: clips[index].createdAt };
        await chrome.storage.local.set({ clips });
        loadClips();
      }
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
