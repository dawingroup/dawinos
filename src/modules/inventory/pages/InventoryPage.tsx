/**
 * InventoryPage Component
 * Main page for unified inventory management
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { InventoryList } from '../components/InventoryList';
import { InventoryItemModal } from '../components/InventoryItemModal';
import { InventoryItemDetail } from '../components/InventoryItemDetail';
import type { InventoryListItem } from '../types';

export function InventoryPage() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItemId, setEditItemId] = useState<string | undefined>();
  const [detailItem, setDetailItem] = useState<InventoryListItem | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // All hooks must be called before any early returns
  const handleEditItem = useCallback((item: InventoryListItem) => {
    setEditItemId(item.id);
    setModalOpen(true);
  }, []);

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
    try {
      const response = await fetch(
        'https://us-central1-dawinos.cloudfunctions.net/triggerKatanaSync?apiKey=dawin-internal-sync-key'
      );
      const data = await response.json();
      
      if (data.success) {
        alert(`Sync complete: ${data.stats.updated} updated, ${data.stats.created} created`);
        setRefreshKey(k => k + 1);
      } else {
        alert(`Sync failed: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to trigger sync');
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
    </div>
  );
}

export default InventoryPage;
