/**
 * InventoryPage Component
 * Main page for unified inventory management with tabbed navigation
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { InventoryList } from '../components/InventoryList';
import { InventoryItemModal } from '../components/InventoryItemModal';
import { InventoryItemDetail } from '../components/InventoryItemDetail';
import StockLevelsByLocation from '../components/StockLevelsByLocation';
import WarehouseManager from '../components/WarehouseManager';
import type { InventoryListItem } from '../types';
import { db } from '@/firebase/config';
import { collection, addDoc, onSnapshot, serverTimestamp, doc } from 'firebase/firestore';

type InventoryTab = 'items' | 'stock-levels' | 'warehouses';

const TABS: { id: InventoryTab; label: string }[] = [
  { id: 'items', label: 'Items' },
  { id: 'stock-levels', label: 'Stock Levels' },
  { id: 'warehouses', label: 'Warehouses' },
];

export function InventoryPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<InventoryTab>('items');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItemId, setEditItemId] = useState<string | undefined>();
  const [detailItem, setDetailItem] = useState<InventoryListItem | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleViewItem = useCallback((item: InventoryListItem) => {
    setDetailItem(item);
  }, []);

  // Early return AFTER all hooks
  if (!user?.email) {
    return (
      <div className="p-6 text-center text-gray-500">
        Please log in to manage inventory.
      </div>
    );
  }

  const handleSyncKatana = async () => {
    if (!user) return;

    try {
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
          reject(new Error('Sync timed out after 120 seconds'));
        }, 120000);

        const unsubscribe = onSnapshot(doc(db, 'syncRequests', requestDoc.id), (snapshot) => {
          const data = snapshot.data();
          if (!data) return;

          if (data.status === 'completed') {
            clearTimeout(timeout);
            unsubscribe();
            console.log('Katana sync completed:', data.stats);
            alert(`Sync complete: ${data.stats?.catalogWritten || 0} catalog items, ${data.stats?.updated || 0} updated, ${data.stats?.created || 0} created`);
            setRefreshKey(k => k + 1);
            resolve();
          } else if (data.status === 'error') {
            clearTimeout(timeout);
            unsubscribe();
            alert(`Sync failed: ${data.error}`);
            reject(new Error(data.error || 'Sync failed'));
          }
        });
      });

    } catch (error: any) {
      alert(`Failed to sync: ${error?.message || 'Unknown error'}`);
      console.error(error);
    }
  };

  const handleAddItem = () => {
    setEditItemId(undefined);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditItemId(undefined);
  };

  const handleModalSaved = () => {
    setRefreshKey(k => k + 1);
  };

  const handleDetailClose = () => {
    setDetailItem(null);
  };

  const handleDetailEdit = () => {
    if (detailItem) {
      setEditItemId(detailItem.id);
      setDetailItem(null);
      setModalOpen(true);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <p className="text-gray-500 mt-1">
          Unified material library - single source of truth for all pricing and stock levels.
          Synced with Katana MRP.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'items' && (
        <>
          <InventoryList
            key={refreshKey}
            onSyncKatana={handleSyncKatana}
            onAddItem={handleAddItem}
            onItemClick={handleViewItem}
            showActions={true}
          />

          <InventoryItemModal
            isOpen={modalOpen}
            onClose={handleModalClose}
            onSaved={handleModalSaved}
            itemId={editItemId}
            userId={user.uid}
          />

          {detailItem && (
            <InventoryItemDetail
              itemId={detailItem.id}
              onClose={handleDetailClose}
              onEdit={handleDetailEdit}
            />
          )}
        </>
      )}

      {activeTab === 'stock-levels' && (
        <StockLevelsByLocation />
      )}

      {activeTab === 'warehouses' && (
        <WarehouseManager />
      )}
    </div>
  );
}

export default InventoryPage;
