/**
 * Header Component
 * Top header with user menu and branding
 */

import { useAuth } from '@/shared/hooks';
import { LogOut, User } from 'lucide-react';

export interface HeaderProps {
  title?: string;
}

export function Header({ title = 'Dawin Design-to-Production' }: HeaderProps) {
  const { user, isAuthenticated, signInWithGoogle, signOut } = useAuth();

  return (
    <header className="h-14 border-b border-gray-200 bg-white px-4 flex items-center justify-between">
      {/* Left: Logo and Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[#872E5C] rounded-md flex items-center justify-center">
          <span className="text-white font-bold text-sm">DF</span>
        </div>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>

      {/* Right: User Menu */}
      <div className="flex items-center gap-3">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'User'} 
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
              <span className="text-sm text-gray-700 hidden sm:block">
                {user.displayName || user.email}
              </span>
            </div>
            <button
              onClick={() => signOut()}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => signInWithGoogle()}
            className="px-4 py-2 bg-[#872E5C] text-white rounded-md text-sm font-medium hover:bg-[#6a2449] transition-colors"
          >
            Sign in with Google
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;
