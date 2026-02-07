/**
 * Branding Service
 * Manages logo and favicon uploads and retrieval
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { storage, db } from '@/shared/services/firebase';

export interface BrandingAssets {
  logoUrl?: string;
  faviconUrl?: string;
  logoFileName?: string;
  faviconFileName?: string;
  updatedAt?: Timestamp | Date;
  updatedBy?: string;
}

const BRANDING_COLLECTION = 'settings';
const BRANDING_DOC = 'branding';
const STORAGE_PATH = 'branding';

/**
 * Upload logo file to Firebase Storage
 */
export async function uploadLogo(file: File, userId: string): Promise<string> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    // Create a unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `logo-${timestamp}.${fileExt}`;
    const storageRef = ref(storage, `${STORAGE_PATH}/${fileName}`);

    // Upload file
    await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);

    console.log('[uploadLogo] Upload complete, URL:', downloadURL);

    // Update Firestore with new logo URL
    const brandingRef = doc(db, BRANDING_COLLECTION, BRANDING_DOC);
    const existingData = await getDoc(brandingRef);

    await setDoc(brandingRef, {
      ...existingData.data(),
      logoUrl: downloadURL,
      logoFileName: fileName,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    }, { merge: true });

    console.log('[uploadLogo] Firestore updated successfully');

    return downloadURL;
  } catch (error) {
    console.error('Error uploading logo:', error);
    throw error;
  }
}

/**
 * Upload favicon file to Firebase Storage
 */
export async function uploadFavicon(file: File, userId: string): Promise<string> {
  try {
    // Validate file type
    const validTypes = ['image/png', 'image/x-icon', 'image/svg+xml', 'image/jpeg'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Favicon must be PNG, ICO, SVG, or JPEG');
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      throw new Error('Favicon size must be less than 1MB');
    }

    // Create a unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `favicon-${timestamp}.${fileExt}`;
    const storageRef = ref(storage, `${STORAGE_PATH}/${fileName}`);

    // Upload file
    await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);

    console.log('[uploadFavicon] Upload complete, URL:', downloadURL);

    // Update Firestore with new favicon URL
    const brandingRef = doc(db, BRANDING_COLLECTION, BRANDING_DOC);
    const existingData = await getDoc(brandingRef);

    await setDoc(brandingRef, {
      ...existingData.data(),
      faviconUrl: downloadURL,
      faviconFileName: fileName,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    }, { merge: true });

    console.log('[uploadFavicon] Firestore updated successfully');

    return downloadURL;
  } catch (error) {
    console.error('Error uploading favicon:', error);
    throw error;
  }
}

/**
 * Get current branding assets
 */
export async function getBrandingAssets(): Promise<BrandingAssets> {
  try {
    const brandingRef = doc(db, BRANDING_COLLECTION, BRANDING_DOC);
    const brandingDoc = await getDoc(brandingRef);

    if (brandingDoc.exists()) {
      return brandingDoc.data() as BrandingAssets;
    }

    return {};
  } catch (error) {
    console.error('Error getting branding assets:', error);
    return {};
  }
}

/**
 * Delete old logo from storage
 */
export async function deleteLogo(fileName: string): Promise<void> {
  try {
    const storageRef = ref(storage, `${STORAGE_PATH}/${fileName}`);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting logo:', error);
    // Don't throw - file might already be deleted
  }
}

/**
 * Delete old favicon from storage
 */
export async function deleteFavicon(fileName: string): Promise<void> {
  try {
    const storageRef = ref(storage, `${STORAGE_PATH}/${fileName}`);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting favicon:', error);
    // Don't throw - file might already be deleted
  }
}

/**
 * Reset branding to defaults
 */
export async function resetBranding(): Promise<void> {
  try {
    const brandingRef = doc(db, BRANDING_COLLECTION, BRANDING_DOC);
    const existingData = await getDoc(brandingRef);

    if (existingData.exists()) {
      const data = existingData.data() as BrandingAssets;

      // Delete old files
      if (data.logoFileName) {
        await deleteLogo(data.logoFileName);
      }
      if (data.faviconFileName) {
        await deleteFavicon(data.faviconFileName);
      }
    }

    // Clear Firestore data
    await setDoc(brandingRef, {
      logoUrl: null,
      faviconUrl: null,
      logoFileName: null,
      faviconFileName: null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error resetting branding:', error);
    throw error;
  }
}
