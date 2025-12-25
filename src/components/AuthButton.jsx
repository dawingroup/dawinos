import React from 'react';
import { LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AuthButton = () => {
  const { user, signInWithGoogle, logout, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-lg">
          <User className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-800 font-medium">
            {user.displayName || user.email}
          </span>
        </div>
        <button
          onClick={logout}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={signInWithGoogle}
      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      <LogIn className="h-4 w-4" />
      <span>Sign in with Google</span>
    </button>
  );
};

export default AuthButton;
