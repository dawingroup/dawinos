/**
 * Branding Service
 * Manages platform-level logo and favicon uploads.
 *
 * Single source of truth: organizations/{orgId}/settings/general
 *   → branding.subsidiaries['dawin-group'].logoUrl / faviconUrl
 *
 * Delegates storage & Firestore writes to settingsService so that
 * all branding UIs (BrandingSettings, LogoUpload, SubsidiaryBranding)
 * read/write the same Firestore document.
 */

import {
  uploadSubsidiaryLogo,
  deleteSubsidiaryLogo,
} from '@/core/settings/settingsService';

export interface BrandingAssets {
  logoUrl?: string;
  faviconUrl?: string;
}

const DEFAULT_SUBSIDIARY = 'dawin-group';

/**
 * Upload logo file (delegates to org-settings subsidiary upload)
 */
export async function uploadLogo(file: File): Promise<string> {
  return uploadSubsidiaryLogo(file, DEFAULT_SUBSIDIARY, 'primary');
}

/**
 * Upload favicon file (delegates to org-settings subsidiary upload)
 */
export async function uploadFavicon(file: File): Promise<string> {
  return uploadSubsidiaryLogo(file, DEFAULT_SUBSIDIARY, 'favicon');
}

/**
 * Reset branding to defaults (removes logo and favicon)
 */
export async function resetBranding(): Promise<void> {
  await deleteSubsidiaryLogo(DEFAULT_SUBSIDIARY, 'primary');
  await deleteSubsidiaryLogo(DEFAULT_SUBSIDIARY, 'favicon');
}
