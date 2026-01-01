import { useAuth } from '@/contexts/AuthContext';
import { KatanaCatalogManager } from '../components/katana-catalog/KatanaCatalogManager';

export function KatanaCatalogPage() {
  const { user } = useAuth();

  if (!user?.email) {
    return (
      <div className="p-6 text-center text-gray-500">
        Please log in to manage Katana catalog items.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Katana Catalog</h1>
        <p className="text-gray-500 mt-1">
          Maintain a global list of standard Katana SKUs. Standard items are handled directly in Katana; only special items require sourcing and approvals in the app.
        </p>
      </div>

      <KatanaCatalogManager />
    </div>
  );
}

export default KatanaCatalogPage;
