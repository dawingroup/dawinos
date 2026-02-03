/**
 * DawinOS Settings Service
 * Firestore operations for organization settings and user management
 */

import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db } from '@/core/services/firebase/firestore';
import { storage } from '@/shared/services/firebase';
import type {
  OrganizationSettings,
  DawinUser,
  UserInvite,
  GlobalRole,
  SubsidiaryAccess,
  AuditLogEntry,
} from './types';

const DEFAULT_ORG_ID = 'default';

// ============================================================================
// COLLECTION REFERENCES
// ============================================================================

function getOrgSettingsRef(orgId: string = DEFAULT_ORG_ID) {
  return doc(db, 'organizations', orgId, 'settings', 'general');
}

function getUsersRef(orgId: string = DEFAULT_ORG_ID) {
  return collection(db, 'organizations', orgId, 'users');
}

function getUserRef(orgId: string, userId: string) {
  return doc(db, 'organizations', orgId, 'users', userId);
}

function getInvitesRef(orgId: string = DEFAULT_ORG_ID) {
  return collection(db, 'organizations', orgId, 'invites');
}

function getAuditLogRef(orgId: string = DEFAULT_ORG_ID) {
  return collection(db, 'organizations', orgId, 'auditLog');
}

// ============================================================================
// ORGANIZATION SETTINGS
// ============================================================================

export async function getOrganizationSettings(
  orgId: string = DEFAULT_ORG_ID
): Promise<OrganizationSettings | null> {
  const docSnap = await getDoc(getOrgSettingsRef(orgId));
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  return {
    ...data,
    id: orgId,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
  } as OrganizationSettings;
}

export function subscribeToOrganizationSettings(
  orgId: string = DEFAULT_ORG_ID,
  callback: (settings: OrganizationSettings | null) => void,
  onError?: (error: Error) => void
): () => void {
  return onSnapshot(
    getOrgSettingsRef(orgId),
    (docSnap) => {
      if (!docSnap.exists()) {
        callback(null);
        return;
      }
      
      const data = docSnap.data();
      callback({
        ...data,
        id: orgId,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      } as OrganizationSettings);
    },
    (error) => {
      console.error('[Settings] Error subscribing to organization settings:', error);
      callback(null);
      if (onError) onError(error);
    }
  );
}

export async function updateOrganizationSettings(
  orgId: string = DEFAULT_ORG_ID,
  updates: Partial<OrganizationSettings>
): Promise<void> {
  const ref = getOrgSettingsRef(orgId);
  const docSnap = await getDoc(ref);
  
  if (!docSnap.exists()) {
    // Create new settings
    await setDoc(ref, {
      ...updates,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    await updateDoc(ref, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }
}

/**
 * Upload subsidiary logo to Firebase Storage
 */
export async function uploadSubsidiaryLogo(
  file: File,
  subsidiaryId: string,
  type: 'primary' | 'light' | 'favicon' = 'primary',
  orgId: string = DEFAULT_ORG_ID
): Promise<string> {
  console.log('🔍 Upload Debug:', { file: file.name, size: file.size, type: file.type, subsidiaryId, orgId });
  
  // Validate file
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    throw new Error('File size exceeds 2MB limit');
  }
  
  const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Allowed: PNG, JPG, SVG, WebP');
  }
  
  // Generate storage path
  const ext = file.name.split('.').pop() || 'png';
  const storagePath = `organizations/${orgId}/branding/${subsidiaryId}/${type}-logo.${ext}`;
  console.log('📁 Storage Path:', storagePath);
  const storageRef = ref(storage, storagePath);
  
  try {
    // Upload file
    await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        orgId,
        subsidiaryId,
        type,
        uploadedAt: new Date().toISOString(),
      },
    });
    console.log('✅ File uploaded to storage');
    
    // Get download URL
    const downloadUrl = await getDownloadURL(storageRef);
    console.log('🔗 Download URL:', downloadUrl);
    
    // Update organization settings with logo URL
    const fieldMap = {
      primary: 'logoUrl',
      light: 'logoLightUrl',
      favicon: 'faviconUrl',
    };
    
    // Get current settings
    const settings = await getOrganizationSettings(orgId);
    console.log('📋 Current Settings:', settings);
    
    // Handle migration from old branding structure to new one
    let currentBranding = settings?.branding;
    if (!currentBranding || !currentBranding.subsidiaries) {
      console.log('🔄 Migrating branding structure');
      currentBranding = {
        groupPrimaryColor: '#872E5C',
        groupSecondaryColor: '#E18425',
        subsidiaries: {
          'dawin-group': { primaryColor: '#872E5C', secondaryColor: '#E18425' },
          'dawin-finishes': { primaryColor: '#872E5C', secondaryColor: '#E18425' },
          'dawin-advisory': { primaryColor: '#1a365d', secondaryColor: '#3182ce' },
          'dawin-capital': { primaryColor: '#1a202c', secondaryColor: '#2d3748' },
          'dawin-technology': { primaryColor: '#553c9a', secondaryColor: '#805ad5' },
        }
      };
    }
    
    // Update subsidiary branding
    const updatedBranding = {
      ...currentBranding,
      subsidiaries: {
        ...currentBranding.subsidiaries,
        [subsidiaryId]: {
          ...currentBranding.subsidiaries[subsidiaryId as keyof typeof currentBranding.subsidiaries],
          [fieldMap[type]]: downloadUrl,
        },
      },
    };
    
    console.log('💾 Updated Branding:', updatedBranding);
    
    await updateOrganizationSettings(orgId, {
      branding: updatedBranding,
    });
    console.log('✅ Settings updated');
    
    return downloadUrl;
  } catch (error) {
      console.error('❌ Upload Error:', error);
      throw error;
    }
  }

/**
 * Delete subsidiary logo from Firebase Storage
 */
export async function deleteSubsidiaryLogo(
  subsidiaryId: string,
  type: 'primary' | 'light' | 'favicon' = 'primary',
  orgId: string = DEFAULT_ORG_ID
): Promise<void> {
  const fieldMap = {
    primary: 'logoUrl',
    light: 'logoLightUrl',
    favicon: 'faviconUrl',
  };
  const fieldKey = fieldMap[type] as 'logoUrl' | 'logoLightUrl' | 'faviconUrl';

  // Get current settings to find the URL
  const settings = await getOrganizationSettings(orgId);
  const currentBranding = settings?.branding;

  if (!currentBranding?.subsidiaries) {
    console.warn('No branding subsidiaries found');
    return;
  }

  const subsidiaryBranding = currentBranding.subsidiaries[subsidiaryId as keyof typeof currentBranding.subsidiaries];
  const currentUrl = subsidiaryBranding?.[fieldKey];

  if (currentUrl) {
    try {
      // Try to delete the file from storage using the URL
      // The storage path follows: organizations/{orgId}/branding/{subsidiaryId}/{type}-logo.{ext}
      const storagePath = `organizations/${orgId}/branding/${subsidiaryId}/${type}-logo`;

      // Try common extensions
      const extensions = ['png', 'jpg', 'jpeg', 'svg', 'webp'];
      let deleted = false;

      for (const ext of extensions) {
        try {
          const storageRef = ref(storage, `${storagePath}.${ext}`);
          await deleteObject(storageRef);
          deleted = true;
          console.log(`✅ Deleted logo: ${storagePath}.${ext}`);
          break;
        } catch {
          // Try next extension
        }
      }

      if (!deleted) {
        console.warn('Logo file not found in storage, clearing URL only');
      }
    } catch (error) {
      console.warn('Error deleting logo file:', error);
    }
  }

  // Clear the URL in settings
  const updatedBranding = {
    ...currentBranding,
    subsidiaries: {
      ...currentBranding.subsidiaries,
      [subsidiaryId]: {
        ...currentBranding.subsidiaries[subsidiaryId as keyof typeof currentBranding.subsidiaries],
        [fieldKey]: null,
      },
    },
  };

  await updateOrganizationSettings(orgId, {
    branding: updatedBranding,
  });

  console.log(`✅ Cleared ${type} logo URL for ${subsidiaryId}`);
}

/**
 * Upload organization logo to Firebase Storage (legacy)
 */
export async function uploadOrganizationLogo(
  file: File,
  orgId: string = DEFAULT_ORG_ID,
  type: 'primary' | 'light' | 'favicon' = 'primary'
): Promise<string> {
  // Delegate to subsidiary upload for dawin-group
  return uploadSubsidiaryLogo(file, 'dawin-group', type, orgId);
}

/**
 * Delete organization logo from Firebase Storage
 */
export async function deleteOrganizationLogo(
  orgId: string = DEFAULT_ORG_ID,
  type: 'primary' | 'light' | 'favicon' = 'primary'
): Promise<void> {
  // Get current settings to find the URL
  const settings = await getOrganizationSettings(orgId);
  const fieldMap = {
    primary: 'logoUrl',
    light: 'logoLightUrl',
    favicon: 'faviconUrl',
  };
  
  const currentUrl = settings?.branding?.[fieldMap[type] as keyof typeof settings.branding];
  
  if (currentUrl) {
    try {
      // Extract storage path from URL and delete
      const storageRef = ref(storage, `organizations/${orgId}/branding/${type}-logo`);
      await deleteObject(storageRef);
    } catch (error) {
      // Ignore if file doesn't exist
      console.warn('Logo file not found:', error);
    }
  }
  
  // Clear the URL in settings
  await updateOrganizationSettings(orgId, {
    branding: {
      ...settings?.branding,
      [fieldMap[type]]: null,
    },
  } as Partial<OrganizationSettings>);
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export async function getUsers(orgId: string = DEFAULT_ORG_ID): Promise<DawinUser[]> {
  const q = query(getUsersRef(orgId), orderBy('displayName'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      lastLoginAt: data.lastLoginAt?.toDate?.()?.toISOString() || data.lastLoginAt,
    } as DawinUser;
  });
}

export function subscribeToUsers(
  orgId: string = DEFAULT_ORG_ID,
  callback: (users: DawinUser[]) => void,
  onError?: (error: Error) => void
): () => void {
  // Don't use orderBy to avoid index requirement for empty collections
  const usersRef = getUsersRef(orgId);
  
  return onSnapshot(
    usersRef,
    (snapshot) => {
      const users = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          ...data,
          id: docSnap.id,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
          lastLoginAt: data.lastLoginAt?.toDate?.()?.toISOString() || data.lastLoginAt,
        } as DawinUser;
      });
      callback(users);
    },
    (error) => {
      console.error('[Settings] Error subscribing to users:', error);
      // Still call callback with empty array so loading stops
      callback([]);
      if (onError) onError(error);
    }
  );
}

export async function getUser(
  orgId: string,
  userId: string
): Promise<DawinUser | null> {
  const docSnap = await getDoc(getUserRef(orgId, userId));
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  return {
    ...data,
    id: docSnap.id,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    lastLoginAt: data.lastLoginAt?.toDate?.()?.toISOString() || data.lastLoginAt,
  } as DawinUser;
}

export async function getUserByUid(
  orgId: string,
  uid: string
): Promise<DawinUser | null> {
  const q = query(getUsersRef(orgId), where('uid', '==', uid));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  const doc = snapshot.docs[0];
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    lastLoginAt: data.lastLoginAt?.toDate?.()?.toISOString() || data.lastLoginAt,
  } as DawinUser;
}

export async function createUser(
  orgId: string,
  userData: Omit<DawinUser, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const usersRef = getUsersRef(orgId);
  const newDocRef = doc(usersRef);
  
  await setDoc(newDocRef, {
    ...userData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return newDocRef.id;
}

export async function updateUser(
  orgId: string,
  userId: string,
  updates: Partial<DawinUser>
): Promise<void> {
  await updateDoc(getUserRef(orgId, userId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserAccess(
  orgId: string,
  userId: string,
  subsidiaryAccess: SubsidiaryAccess[]
): Promise<void> {
  await updateDoc(getUserRef(orgId, userId), {
    subsidiaryAccess,
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserRole(
  orgId: string,
  userId: string,
  globalRole: GlobalRole
): Promise<void> {
  await updateDoc(getUserRef(orgId, userId), {
    globalRole,
    updatedAt: serverTimestamp(),
  });
}

export async function deactivateUser(
  orgId: string,
  userId: string
): Promise<void> {
  await updateDoc(getUserRef(orgId, userId), {
    isActive: false,
    updatedAt: serverTimestamp(),
  });
}

export async function reactivateUser(
  orgId: string,
  userId: string
): Promise<void> {
  await updateDoc(getUserRef(orgId, userId), {
    isActive: true,
    updatedAt: serverTimestamp(),
  });
}

// ============================================================================
// USER INVITES
// ============================================================================

export async function createInvite(
  orgId: string,
  invite: Omit<UserInvite, 'id' | 'createdAt' | 'status'>
): Promise<string> {
  const invitesRef = getInvitesRef(orgId);
  const newDocRef = doc(invitesRef);
  
  await setDoc(newDocRef, {
    ...invite,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  
  return newDocRef.id;
}

export async function getPendingInvites(orgId: string = DEFAULT_ORG_ID): Promise<UserInvite[]> {
  const q = query(
    getInvitesRef(orgId),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      expiresAt: data.expiresAt?.toDate?.()?.toISOString() || data.expiresAt,
    } as UserInvite;
  });
}

export async function revokeInvite(orgId: string, inviteId: string): Promise<void> {
  await updateDoc(doc(getInvitesRef(orgId), inviteId), {
    status: 'revoked',
  });
}

// ============================================================================
// AUDIT LOG
// ============================================================================

export async function logAuditEvent(
  orgId: string,
  entry: Omit<AuditLogEntry, 'id' | 'timestamp'>
): Promise<void> {
  const auditRef = getAuditLogRef(orgId);
  const newDocRef = doc(auditRef);
  
  await setDoc(newDocRef, {
    ...entry,
    timestamp: serverTimestamp(),
  });
}

export async function getAuditLog(
  orgId: string = DEFAULT_ORG_ID,
  limit: number = 50
): Promise<AuditLogEntry[]> {
  const q = query(
    getAuditLogRef(orgId),
    orderBy('timestamp', 'desc')
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.slice(0, limit).map((doc) => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
    } as AuditLogEntry;
  });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

export async function initializeOrganization(
  orgId: string,
  ownerUid: string,
  ownerEmail: string,
  ownerName: string,
  orgName: string
): Promise<void> {
  // Create organization settings
  await setDoc(getOrgSettingsRef(orgId), {
    info: {
      name: orgName,
      shortName: orgName.substring(0, 3).toUpperCase(),
    },
    branding: {
      primaryColor: '#872E5C',
      secondaryColor: '#E18425',
    },
    defaultCurrency: 'UGX',
    defaultLanguage: 'en',
    timezone: 'Africa/Kampala',
    fiscalYearStart: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  // Create owner user
  const usersRef = getUsersRef(orgId);
  await setDoc(doc(usersRef), {
    uid: ownerUid,
    email: ownerEmail,
    displayName: ownerName,
    globalRole: 'owner',
    isActive: true,
    subsidiaryAccess: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
