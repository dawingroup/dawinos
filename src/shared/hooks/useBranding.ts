/**
 * useBranding Hook
 * Manages branding assets state and operations.
 *
 * Single source of truth: organizations/{orgId}/settings/general
 *   → branding.subsidiaries['dawin-group'].logoUrl / faviconUrl
 *
 * All upload UIs (BrandingSettings, LogoUpload, SubsidiaryBranding)
 * write to the same document, so a single onSnapshot is sufficient.
 */

import { useState, useEffect } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/shared/services/firebase';
import {
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

  // Subscribe to org settings after auth is ready
  useEffect(() => {
    let unsubFirestore: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      // Tear down previous listener when auth state changes
      if (unsubFirestore) {
        unsubFirestore();
        unsubFirestore = null;
      }

      if (!user) {
        setBranding({});
        setLoading(false);
        return;
      }

      // Listen to the single org-settings document
      const orgSettingsRef = doc(db, 'organizations', 'default', 'settings', 'general');
      unsubFirestore = onSnapshot(
        orgSettingsRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const sub = data?.branding?.subsidiaries?.['dawin-group'];
            const assets: BrandingAssets = {
              logoUrl: sub?.logoUrl || undefined,
              faviconUrl: sub?.faviconUrl || undefined,
            };
            console.log('[useBranding] Branding from org settings:', assets);
            setBranding(assets);
          } else {
            console.log('[useBranding] No org settings document exists');
            setBranding({});
          }
          setLoading(false);
        },
        (err) => {
          console.error('[useBranding] Error listening to org settings:', err);
          setError(err.message);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubFirestore) unsubFirestore();
    };
  }, []);

  const handleUploadLogo = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      await uploadLogo(file);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const handleUploadFavicon = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      await uploadFavicon(file);
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
