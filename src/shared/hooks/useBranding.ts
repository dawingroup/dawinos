/**
 * useBranding Hook
 * Manages branding assets state and operations
 */

import { useState, useEffect } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/shared/services/firebase';
import {
  getBrandingAssets,
  uploadLogo,
  uploadFavicon,
  resetBranding,
  type BrandingAssets,
} from '@/shared/services/branding.service';

export function useBranding() {
  const [branding, setBranding] = useState<BrandingAssets>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to branding changes
  useEffect(() => {
    const brandingRef = doc(db, 'settings', 'branding');

    const unsubscribe = onSnapshot(
      brandingRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as BrandingAssets;
          console.log('[useBranding] Received branding update:', data);
          setBranding(data);
        } else {
          console.log('[useBranding] No branding document exists');
          setBranding({});
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to branding:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleUploadLogo = async (file: File, userId: string) => {
    setUploading(true);
    setError(null);
    try {
      await uploadLogo(file, userId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const handleUploadFavicon = async (file: File, userId: string) => {
    setUploading(true);
    setError(null);
    try {
      await uploadFavicon(file, userId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const handleReset = async () => {
    setUploading(true);
    setError(null);
    try {
      await resetBranding();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return {
    branding,
    loading,
    uploading,
    error,
    uploadLogo: handleUploadLogo,
    uploadFavicon: handleUploadFavicon,
    resetBranding: handleReset,
  };
}
