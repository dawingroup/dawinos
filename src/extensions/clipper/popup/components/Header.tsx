import { Settings, LogOut } from 'lucide-react';

interface User {
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}

interface HeaderProps {
  user: User;
  pendingCount: number;
  onSettingsClick: () => void;
  onSignOut: () => void;
}

export default function Header({ user, pendingCount, onSettingsClick, onSignOut }: HeaderProps) {
  return (
    <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">D</span>
        </div>
        <div>
          <h1 className="text-sm font-semibold text-gray-900">Dawin Clipper</h1>
          <p className="text-xs text-gray-500">{user.displayName || user.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {pendingCount > 0 && (
          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">
            {pendingCount} pending
          </span>
        )}
        
        <button
          onClick={onSettingsClick}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
        
        <button
          onClick={onSignOut}
          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
