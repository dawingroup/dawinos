/**
 * MaterialsPage Component
 * Global materials administration page
 */

import { useAuth } from '@/contexts/AuthContext';
import { MaterialList } from '../components/materials';

export function MaterialsPage() {
  const { user } = useAuth();

  if (!user?.email) {
    return (
      <div className="p-6 text-center text-gray-500">
        Please log in to manage materials.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Material Library</h1>
        <p className="text-gray-500 mt-1">
          Manage global materials available to all projects. Customer and project-specific materials can be managed from their respective pages.
        </p>
      </div>

      <MaterialList
        tier="global"
        userId={user.email}
        title="Global Materials"
      />
    </div>
  );
}

export default MaterialsPage;
