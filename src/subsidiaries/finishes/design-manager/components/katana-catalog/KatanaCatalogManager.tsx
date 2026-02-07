import { useMemo, useState } from 'react';
import { RefreshCw, Search, Check, X, Pencil, Database } from 'lucide-react';
import { useKatanaCatalog } from '../../hooks/useKatanaCatalog';
import {
  updateKatanaCatalogItem,
} from '../../services/katanaCatalogService';
import type { KatanaCatalogItem } from '../../types/katanaCatalog';
import { auth, db } from '@/shared/services/firebase';
import { collection, addDoc, onSnapshot, serverTimestamp, doc } from 'firebase/firestore';

type EditFormState = {
  katanaId: string;
  displayNameOverride: string;
  categoryOverride: string;
  aliases: string;
} | null;

export function KatanaCatalogManager() {
  const { items, loading, error, standardItems } = useKatanaCatalog();

  const [search, setSearch] = useState('');
  const [showStandardOnly, setShowStandardOnly] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>(null);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (showStandardOnly && !i.isStandard) return false;
      if (!q) return true;

      const haystack = [
        i.sku,
        i.name,
        i.displayNameOverride || '',
        i.categoryOverride || '',
        ...(i.aliases || []),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [items, search, showStandardOnly]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      standard: standardItems.length,
    };
  }, [items.length, standardItems.length]);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncError(null);

    try {
      // Verify user is authenticated
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be signed in to sync from Katana');
      }
      
      // Create a sync request document - Firestore trigger will process it
      const syncRequestsRef = collection(db, 'syncRequests');
      const requestDoc = await addDoc(syncRequestsRef, {
        type: 'katana-sync',
        status: 'pending',
        requestedBy: user.uid,
        requestedByEmail: user.email,
        requestedAt: serverTimestamp(),
      });
      
      // Wait for the sync to complete by listening to the document
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          unsubscribe();
          reject(new Error('Sync timed out after 60 seconds'));
        }, 60000);
        
        const unsubscribe = onSnapshot(doc(db, 'syncRequests', requestDoc.id), (snapshot) => {
          const data = snapshot.data();
          if (!data) return;
          
          if (data.status === 'completed') {
            clearTimeout(timeout);
            unsubscribe();
            console.log('Katana sync completed:', data.stats);
            resolve();
          } else if (data.status === 'error') {
            clearTimeout(timeout);
            unsubscribe();
            reject(new Error(data.error || 'Sync failed'));
          }
          // Still processing or pending - keep waiting
        });
      });
      
      // Catalog will be updated automatically via the hook's Firestore subscription
      
    } catch (e: any) {
      const message = e?.message || e?.code || 'Sync failed';
      setSyncError(message.replace('Firebase: ', ''));
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleStandard = async (item: KatanaCatalogItem, next: boolean) => {
    await updateKatanaCatalogItem(item.katanaId, { isStandard: next });
  };

  const openEdit = (item: KatanaCatalogItem) => {
    setEditForm({
      katanaId: item.katanaId,
      displayNameOverride: item.displayNameOverride || '',
      categoryOverride: item.categoryOverride || '',
      aliases: (item.aliases || []).join(', '),
    });
  };

  const closeEdit = () => {
    setEditForm(null);
  };

  const saveEdit = async () => {
    if (!editForm) return;

    const aliases = editForm.aliases
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    await updateKatanaCatalogItem(editForm.katanaId, {
      displayNameOverride: editForm.displayNameOverride.trim() || undefined,
      categoryOverride: editForm.categoryOverride.trim() || undefined,
      aliases,
    });

    setEditForm(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Katana Standard Items</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Curate which Katana SKUs are treated as standard (handled directly in Katana). Only non-standard items need special sourcing and approval.
          </p>
        </div>

        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={isSyncing ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} />
          {isSyncing ? 'Syncing…' : 'Sync from Katana'}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by SKU, name, alias…"
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={showStandardOnly}
              onChange={(e) => setShowStandardOnly(e.target.checked)}
              className="h-4 w-4"
            />
            Standard only
          </label>

          <div className="text-sm text-gray-600">
            <span className="font-medium">{stats.standard}</span> standard / {stats.total} total
          </div>
        </div>
      </div>

      {syncError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          {syncError}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          {error.message}
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading catalog…</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Standard</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">In Stock</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Landed Cost</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map((item) => (
                <tr key={item.katanaId} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={item.isStandard}
                      onChange={(e) => toggleStandard(item, e.target.checked)}
                      className="h-4 w-4"
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-600">{item.sku || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">
                      {item.displayNameOverride || item.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.displayNameOverride ? item.name : item.categoryOverride || item.type}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.categoryOverride || item.type || '-'}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">{item.inStock}</td>
                  <td className="px-4 py-3 text-right text-sm">
                    {item.costPerUnit > 0 ? (
                      <span className="font-medium text-green-700">
                        {item.costPerUnit.toLocaleString()} {item.currency || 'UGX'}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(item)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    No catalog items match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Edit Catalog Item</h3>
              <button onClick={closeEdit} className="p-2 hover:bg-gray-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display name override</label>
                <input
                  value={editForm.displayNameOverride}
                  onChange={(e) => setEditForm((p) => (p ? { ...p, displayNameOverride: e.target.value } : p))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category override</label>
                <input
                  value={editForm.categoryOverride}
                  onChange={(e) => setEditForm((p) => (p ? { ...p, categoryOverride: e.target.value } : p))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aliases (comma separated)</label>
                <input
                  value={editForm.aliases}
                  onChange={(e) => setEditForm((p) => (p ? { ...p, aliases: e.target.value } : p))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={closeEdit}
                className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
              >
                <Check className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
