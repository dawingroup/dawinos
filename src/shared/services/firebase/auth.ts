/**
 * Firebase Auth Service
 * Authentication service utilities
 */

import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type Auth,
  type User
} from 'firebase/auth';
import { app } from './config';

// Initialize Firebase Authentication
export const auth: Auth = getAuth(app);

// Initialize Google Auth Provider with required scopes
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive');

/**
 * Sign in with Google popup
 */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  
  // Store Google access token for Drive API
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (credential?.accessToken) {
    localStorage.setItem('googleAccessToken', credential.accessToken);
  }
  
  return result.user;
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  localStorage.removeItem('googleAccessToken');
  await firebaseSignOut(auth);
}

/**
 * Get Google access token for Drive API
 */
export function getGoogleAccessToken(): string | null {
  return localStorage.getItem('googleAccessToken');
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export type { User };
