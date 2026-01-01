import { useState, useEffect } from 'react';

interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for cached auth state
    chrome.storage.local.get(['user'], (result) => {
      if (result.user) {
        setUser(result.user);
      }
      setIsLoading(false);
    });
  }, []);

  const signIn = async () => {
    try {
      console.log('Starting sign in...');
      
      // Use chrome.identity for Google OAuth
      const token = await new Promise<string>((resolve, reject) => {
        console.log('Calling chrome.identity.getAuthToken...');
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
          console.log('getAuthToken callback:', { token: !!token, error: chrome.runtime.lastError });
          if (chrome.runtime.lastError || !token) {
            reject(new Error(chrome.runtime.lastError?.message || 'Failed to get token'));
            return;
          }
          resolve(token);
        });
      });

      // Get user info from Google
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${token}`
      );
      const userInfo = await response.json();

      const newUser: User = {
        uid: userInfo.id,
        displayName: userInfo.name,
        email: userInfo.email,
        photoURL: userInfo.picture,
      };

      setUser(newUser);
      await chrome.storage.local.set({ user: newUser });
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Get current token
      const token = await new Promise<string | undefined>((resolve) => {
        chrome.identity.getAuthToken({ interactive: false }, resolve);
      });

      if (token) {
        // Revoke token
        chrome.identity.removeCachedAuthToken({ token }, () => {});
      }

      setUser(null);
      await chrome.storage.local.remove(['user']);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return { user, isLoading, signIn, signOut };
}
