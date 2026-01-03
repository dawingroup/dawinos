/**
 * Katana Sync Cloud Functions
 * Bidirectional sync between DawinOS Inventory and Katana MRP
 * 
 * PULL: Fetch prices and stock levels from Katana → Update Firestore
 * PUSH: Send enhanced metadata (categories, descriptions) to Katana
 */

const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { defineString } = require('firebase-functions/params');
const admin = require('firebase-admin');

// Katana API configuration
const KATANA_API_BASE = defineString('KATANA_API_BASE', { default: 'https://api-okekivpl2a-uc.a.run.app' });

// Ensure admin is initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const INVENTORY_COLLECTION = 'inventoryItems';

/**
 * PULL: Scheduled function to sync prices and stock from Katana
 * Runs every 6 hours
 */
const pullFromKatana = onSchedule({
  schedule: 'every 6 hours',
  timeZone: 'Africa/Nairobi',
  memory: '512MiB',
  timeoutSeconds: 300,
}, async (event) => {
  console.log('Starting Katana pull sync...');
  
  const stats = {
    fetched: 0,
    updated: 0,
    created: 0,
    errors: [],
  };

  try {
    // Fetch materials from Katana API
    const response = await fetch(`${KATANA_API_BASE.value()}/api/katana/get-materials`);
    const data = await response.json();

    if (!response.ok || !data?.success) {
      throw new Error(data?.error || data?.message || 'Failed to fetch from Katana');
    }

    const katanaMaterials = data.materials || [];
    stats.fetched = katanaMaterials.length;
    console.log(`Fetched ${stats.fetched} materials from Katana`);

    // Process each material
    for (const material of katanaMaterials) {
      try {
        if (!material?.id) continue;

        const katanaId = String(material.id);
        
        // Check if item exists in inventory
        const inventoryRef = db.collection(INVENTORY_COLLECTION);
        const existingQuery = await inventoryRef
          .where('katanaId', '==', katanaId)
          .limit(1)
          .get();

        if (!existingQuery.empty) {
          // Update existing item with prices and stock
          const docRef = existingQuery.docs[0].ref;
          await docRef.update({
            'pricing.costPerUnit': material.costPerUnit || 0,
            'pricing.lastSyncedFromKatana': admin.firestore.FieldValue.serverTimestamp(),
            'inventory.inStock': material.inStock || 0,
            'inventory.lastSyncedFromKatana': admin.firestore.FieldValue.serverTimestamp(),
            'katanaSync.lastPulledAt': admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          stats.updated++;
        } else {
          // Create new inventory item from Katana
          const newItem = {
            sku: material.sku || katanaId,
            name: material.name || 'Unknown',
            displayName: material.name,
            description: null,
            category: inferCategory(material.type, material.name),
            subcategory: material.type || null,
            tags: [],
            aliases: [],
            source: 'katana',
            katanaId: katanaId,
            promotedFromPartId: null,
            tier: 'global',
            scopeId: null,
            dimensions: null,
            grainPattern: null,
            pricing: {
              costPerUnit: material.costPerUnit || 0,
              currency: 'KES',
              unit: material.unit || 'ea',
              lastSyncedFromKatana: admin.firestore.FieldValue.serverTimestamp(),
            },
            inventory: {
              inStock: material.inStock || 0,
              reorderLevel: null,
              lastSyncedFromKatana: admin.firestore.FieldValue.serverTimestamp(),
            },
            katanaSync: {
              isStandard: false,
              pendingPush: false,
              lastPulledAt: admin.firestore.FieldValue.serverTimestamp(),
              lastPushedAt: null,
              syncErrors: [],
            },
            status: 'active',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: 'katana-sync',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: 'katana-sync',
          };

          await inventoryRef.add(newItem);
          stats.created++;
        }
      } catch (itemError) {
        stats.errors.push(`Item ${material.id}: ${itemError.message}`);
      }
    }

    console.log('Katana pull sync completed:', stats);
    
    // Log sync result to Firestore for monitoring
    await db.collection('syncLogs').add({
      type: 'katana-pull',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      stats,
      success: stats.errors.length === 0,
    });

  } catch (error) {
    console.error('Katana pull sync failed:', error);
    
    await db.collection('syncLogs').add({
      type: 'katana-pull',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      error: error.message,
      success: false,
    });
  }
});

/**
 * PUSH: Trigger to send metadata updates to Katana
 * Fires when an inventory item with katanaId is updated
 */
const pushToKatana = onDocumentUpdated({
  document: 'inventoryItems/{itemId}',
  memory: '256MiB',
  timeoutSeconds: 60,
}, async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();

  if (!before || !after) return;

  // Only push if item has a katanaId and metadata changed
  if (!after.katanaId) return;
  if (!after.katanaSync?.pendingPush) return;

  // Check if relevant metadata changed
  const metadataChanged = 
    before.displayName !== after.displayName ||
    before.category !== after.category ||
    before.subcategory !== after.subcategory ||
    before.description !== after.description ||
    JSON.stringify(before.tags) !== JSON.stringify(after.tags);

  if (!metadataChanged) {
    // Clear pending push flag if no actual changes
    await event.data.after.ref.update({
      'katanaSync.pendingPush': false,
    });
    return;
  }

  console.log(`Pushing metadata to Katana for item ${after.katanaId}`);

  try {
    // Call Katana API to update material
    const response = await fetch(`${KATANA_API_BASE.value()}/api/katana/update-material`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: after.katanaId,
        name: after.displayName || after.name,
        category: after.category,
        type: after.subcategory,
        notes: after.description,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    // Mark as synced
    await event.data.after.ref.update({
      'katanaSync.lastPushedAt': admin.firestore.FieldValue.serverTimestamp(),
      'katanaSync.pendingPush': false,
      'katanaSync.syncErrors': [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Successfully pushed metadata to Katana for ${after.katanaId}`);

  } catch (error) {
    console.error(`Failed to push to Katana for ${after.katanaId}:`, error);

    // Record error
    await event.data.after.ref.update({
      'katanaSync.syncErrors': admin.firestore.FieldValue.arrayUnion(
        `${new Date().toISOString()}: ${error.message}`
      ),
    });
  }
});

/**
 * Manual trigger to force a full sync from Katana
 * Can be called via HTTP request
 */
const { onRequest } = require('firebase-functions/v2/https');

const triggerKatanaSync = onRequest({
  memory: '512MiB',
  timeoutSeconds: 300,
  cors: true,
}, async (req, res) => {
  // Verify authorization (simple API key check)
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  if (apiKey !== 'dawin-internal-sync-key') {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  console.log('Manual Katana sync triggered');

  try {
    // Reuse the pull logic
    const response = await fetch(`${KATANA_API_BASE.value()}/api/katana/get-materials`);
    const data = await response.json();

    if (!response.ok || !data?.success) {
      throw new Error(data?.error || 'Failed to fetch from Katana');
    }

    const stats = { fetched: data.materials?.length || 0, updated: 0, created: 0 };

    for (const material of data.materials || []) {
      if (!material?.id) continue;

      const katanaId = String(material.id);
      const inventoryRef = db.collection(INVENTORY_COLLECTION);
      const existingQuery = await inventoryRef
        .where('katanaId', '==', katanaId)
        .limit(1)
        .get();

      if (!existingQuery.empty) {
        await existingQuery.docs[0].ref.update({
          'pricing.costPerUnit': material.costPerUnit || 0,
          'pricing.lastSyncedFromKatana': admin.firestore.FieldValue.serverTimestamp(),
          'inventory.inStock': material.inStock || 0,
          'inventory.lastSyncedFromKatana': admin.firestore.FieldValue.serverTimestamp(),
          'katanaSync.lastPulledAt': admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        stats.updated++;
      } else {
        // Create new (simplified for manual sync)
        await inventoryRef.add({
          sku: material.sku || katanaId,
          name: material.name || 'Unknown',
          source: 'katana',
          katanaId,
          tier: 'global',
          category: inferCategory(material.type, material.name),
          pricing: {
            costPerUnit: material.costPerUnit || 0,
            currency: 'KES',
            unit: material.unit || 'ea',
            lastSyncedFromKatana: admin.firestore.FieldValue.serverTimestamp(),
          },
          inventory: {
            inStock: material.inStock || 0,
            lastSyncedFromKatana: admin.firestore.FieldValue.serverTimestamp(),
          },
          katanaSync: {
            isStandard: false,
            pendingPush: false,
            lastPulledAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          status: 'active',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: 'manual-sync',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: 'manual-sync',
        });
        stats.created++;
      }
    }

    res.json({ success: true, stats });

  } catch (error) {
    console.error('Manual sync failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Helper: Infer category from Katana type/name
 */
function inferCategory(type, name) {
  const lowerType = (type || '').toLowerCase();
  const lowerName = (name || '').toLowerCase();

  if (lowerType.includes('board') || lowerType.includes('sheet') ||
      lowerName.includes('mdf') || lowerName.includes('plywood') ||
      lowerName.includes('chipboard') || lowerName.includes('melamine')) {
    return 'sheet-goods';
  }
  if (lowerType.includes('hardware') || lowerName.includes('hinge') ||
      lowerName.includes('handle') || lowerName.includes('drawer slide')) {
    return 'hardware';
  }
  if (lowerType.includes('edge') || lowerName.includes('edge')) {
    return 'edge-banding';
  }
  if (lowerType.includes('finish') || lowerName.includes('lacquer') ||
      lowerName.includes('stain') || lowerName.includes('polish')) {
    return 'finishing';
  }
  if (lowerType.includes('adhesive') || lowerName.includes('glue')) {
    return 'adhesives';
  }
  if (lowerType.includes('fastener') || lowerName.includes('screw') ||
      lowerName.includes('nail') || lowerName.includes('bolt')) {
    return 'fasteners';
  }

  return 'other';
}

module.exports = {
  pullFromKatana,
  pushToKatana,
  triggerKatanaSync,
};
