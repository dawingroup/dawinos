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
import { db } from '@/core/services/firebase/firestore';
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
