/**
 * Katana Sync Cloud Functions
 * Bidirectional sync between DawinOS Inventory and Katana MRP
 * 
 * PULL: Fetch prices and stock levels from Katana → Update Firestore
 * PUSH: Send enhanced metadata (categories, descriptions) to Katana
 */

const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { defineString, defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const { ALLOWED_ORIGINS } = require('../config/cors');

// Katana API configuration
const KATANA_API_BASE = defineString('KATANA_API_BASE', { default: 'https://api-okekivpl2a-uc.a.run.app' });
const KATANA_API_KEY = defineSecret('KATANA_API_KEY');
const KATANA_PUBLIC_API_BASE = 'https://api.katanamrp.com/v1';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const INVENTORY_COLLECTION = 'inventoryItems';

async function katanaRequest(endpoint, method = 'GET', body = null) {
  const apiKey = KATANA_API_KEY.value();
  if (!apiKey) {
    throw new Error('KATANA_API_KEY not configured');
  }

  const options = {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${KATANA_PUBLIC_API_BASE}${endpoint}`, options);
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Katana API error: ${response.status}${text ? ` - ${text}` : ''}`);
  }
  return response.json();
}

async function fetchKatanaMaterialsFromApi() {
  // Katana API seems to max at 50 per page, so use that
  const perPage = 50;
  const maxPages = 100; // 100 pages * 50 = 5000 max items

  // Step 1: Fetch materials to get material names
  let allMaterials = [];
  let page = 1;

  console.log('Starting to fetch materials from Katana...');
  
  while (page <= maxPages) {
    console.log(`Fetching materials page ${page}...`);
    const materialsResponse = await katanaRequest(
      `/materials?per_page=${perPage}&page=${page}`
    );
    const items = Array.isArray(materialsResponse)
      ? materialsResponse
      : materialsResponse?.data || [];

    console.log(`Page ${page}: got ${items.length} materials`);
    
    if (!items.length) {
      console.log(`No more materials at page ${page}, stopping.`);
      break;
    }
    
    allMaterials = allMaterials.concat(items);

    // Only stop if we got fewer items than requested (last page)
    if (items.length < perPage) {
      console.log(`Got ${items.length} < ${perPage} items, this is the last page.`);
      break;
    }
    
    page++;
  }

  console.log(`Total fetched: ${allMaterials.length} materials from Katana`);
  if (allMaterials.length > 0) {
    console.log('Sample material:', JSON.stringify(allMaterials[0], null, 2));
  }

  // Step 2: Fetch ALL variants (no type filter) to get SKUs and prices
  let allVariants = [];
  page = 1;

  console.log('Starting to fetch variants from Katana...');
  
  while (page <= maxPages) {
    console.log(`Fetching variants page ${page}...`);
    const variantsResponse = await katanaRequest(
      `/variants?per_page=${perPage}&page=${page}`
    );
    const items = Array.isArray(variantsResponse)
      ? variantsResponse
      : variantsResponse?.data || [];

    console.log(`Page ${page}: got ${items.length} variants`);
    
    if (!items.length) {
      console.log(`No more variants at page ${page}, stopping.`);
      break;
    }
    
    allVariants = allVariants.concat(items);

    if (items.length < perPage) {
      console.log(`Got ${items.length} < ${perPage} items, this is the last page.`);
      break;
    }
    
    page++;
  }

  console.log(`Total fetched: ${allVariants.length} variants from Katana`);

  // Build variant lookup by material_id
  const variantByMaterialId = new Map();
  for (const v of allVariants) {
    if (v.material_id) {
      variantByMaterialId.set(v.material_id, v);
    }
  }

  // Step 3: Fetch inventory for stock levels
  const inventoryMap = new Map();
  page = 1;

  console.log('Starting to fetch inventory from Katana...');
  
  while (page <= maxPages) {
    console.log(`Fetching inventory page ${page}...`);
    const inventoryResponse = await katanaRequest(
      `/inventory?extend=variant&per_page=${perPage}&page=${page}`
    );
    const items = Array.isArray(inventoryResponse)
      ? inventoryResponse
      : inventoryResponse?.data || [];

    console.log(`Page ${page}: got ${items.length} inventory items`);
    
    if (!items.length) break;
    
    for (const inv of items) {
      if (inv.variant_id) {
        const existing = inventoryMap.get(inv.variant_id) || {
          inStock: 0,
          committed: 0,
          available: 0,
        };

        inventoryMap.set(inv.variant_id, {
          inStock:
            (existing.inStock || 0) +
            (inv.in_stock || inv.quantity_on_hand || 0),
          committed: (existing.committed || 0) + (inv.committed || 0),
          available: (existing.available || 0) + (inv.available || 0),
        });
      }
    }

    if (items.length < perPage) break;
    page++;
  }

  console.log(`Total inventory entries mapped: ${inventoryMap.size}`);

  // Step 4: Use materials as the primary source (all 1,447 items)
  const materials = allMaterials.map((m) => {
    const variant = variantByMaterialId.get(m.id) || {};
    const variantId = variant.id || m.default_variant_id;
    const stock = variantId ? inventoryMap.get(variantId) || {} : {};

    // Use average_cost as the primary price (landed cost)
    const costPerUnit =
      parseFloat(variant.average_cost) ||
      parseFloat(variant.purchase_price) ||
      parseFloat(m.average_cost) ||
      0;

    return {
      id: m.id,
      variantId: variantId,
      // Material name from material object
      name: m.name || `Material #${m.id}`,
      // SKU from variant or material
      sku: variant.sku || m.sku || '',
      type: m.category_name || 'material',
      thickness: variant.thickness || 0,
      inStock: stock.inStock || 0,
      committed: stock.committed || 0,
      available: stock.available || 0,
      barcode: variant.internal_barcode || variant.registered_barcode || '',
      unit: m.unit || 'ea',
      costPerUnit,
      currency: m.currency || 'UGX',
    };
  });

  console.log(`Mapped ${materials.length} materials for sync`);
  return materials;
}

/**
 * PULL: Scheduled function to sync prices and stock from Katana
 * Runs every 6 hours
 */
const pullFromKatana = onSchedule({
  schedule: 'every 6 hours',
  timeZone: 'Africa/Nairobi',
  memory: '512MiB',
  timeoutSeconds: 300,
  secrets: [KATANA_API_KEY],
}, async (event) => {
  console.log('Starting Katana pull sync...');
  
  const stats = {
    fetched: 0,
    withPrices: 0,
    updated: 0,
    created: 0,
    errors: [],
  };

  try {
    const katanaMaterials = await fetchKatanaMaterialsFromApi();
    stats.fetched = katanaMaterials.length;
    stats.withPrices = katanaMaterials.filter((m) => (m?.costPerUnit || 0) > 0).length;
    console.log(`Fetched ${stats.fetched} materials from Katana`);
    console.log(`Materials with prices: ${stats.withPrices}/${stats.fetched}`);

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
          const updateData = {
            'pricing.costPerUnit': material.costPerUnit || 0,
            'pricing.lastSyncedFromKatana': admin.firestore.FieldValue.serverTimestamp(),
            'inventory.inStock': material.inStock || 0,
            'inventory.committed': material.committed || 0,
            'inventory.available': material.available || 0,
            'inventory.lastSyncedFromKatana': admin.firestore.FieldValue.serverTimestamp(),
            'katanaSync.lastPulledAt': admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };
          // Store variantId if available (needed for price lookups)
          if (material.variantId) {
            updateData.katanaVariantId = String(material.variantId);
          }
          await docRef.update(updateData);
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
            katanaVariantId: material.variantId ? String(material.variantId) : null,
            promotedFromPartId: null,
            tier: 'global',
            scopeId: null,
            dimensions: null,
            grainPattern: null,
            pricing: {
              costPerUnit: material.costPerUnit || 0,
              currency: material.currency || 'UGX',
              unit: material.unit || 'ea',
              lastSyncedFromKatana: admin.firestore.FieldValue.serverTimestamp(),
            },
            inventory: {
              inStock: material.inStock || 0,
              committed: material.committed || 0,
              available: material.available || 0,
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
    
    // After inventory sync, update material palette prices in all projects
    const paletteSyncStats = await syncMaterialPalettePrices();
    console.log('Material palette prices synced:', paletteSyncStats);
    
    // Log sync result to Firestore for monitoring
    await db.collection('syncLogs').add({
      type: 'katana-pull',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      stats: {
        ...stats,
        palettePricesUpdated: paletteSyncStats,
      },
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
  cors: ALLOWED_ORIGINS,
  secrets: [KATANA_API_KEY],
}, async (req, res) => {
  // Verify authorization (simple API key check)
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  if (apiKey !== 'dawin-internal-sync-key') {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  console.log('Manual Katana sync triggered');

  try {
    const katanaMaterials = await fetchKatanaMaterialsFromApi();
    const stats = {
      fetched: katanaMaterials.length || 0,
      withPrices: katanaMaterials.filter((m) => (m?.costPerUnit || 0) > 0).length,
      updated: 0,
      created: 0,
    };

    for (const material of katanaMaterials) {
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
          'inventory.committed': material.committed || 0,
          'inventory.available': material.available || 0,
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
            currency: 'UGX',
            unit: material.unit || 'ea',
            lastSyncedFromKatana: admin.firestore.FieldValue.serverTimestamp(),
          },
          inventory: {
            inStock: material.inStock || 0,
            committed: material.committed || 0,
            available: material.available || 0,
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

    // After inventory sync, update material palette prices in all projects
    const paletteSyncStats = await syncMaterialPalettePrices();
    
    res.json({ 
      success: true, 
      stats,
      palettePricesUpdated: paletteSyncStats,
    });

  } catch (error) {
    console.error('Manual sync failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Sync material palette prices from inventory items across all projects
 * Called after Katana sync to propagate price changes to design manager
 */
async function syncMaterialPalettePrices() {
  const stats = { projectsUpdated: 0, materialsUpdated: 0 };
  
  try {
    const projectsRef = db.collection('designProjects');
    const projectsSnapshot = await projectsRef.get();
    
    // Build inventory lookup maps once
    const inventoryRef = db.collection(INVENTORY_COLLECTION);
    const inventorySnapshot = await inventoryRef.get();
    
    const inventoryByIdMap = new Map();
    const inventoryBySkuMap = new Map();
    
    for (const docSnap of inventorySnapshot.docs) {
      const data = docSnap.data();
      const costPerUnit = data.pricing?.costPerUnit || 0;
      
      inventoryByIdMap.set(docSnap.id, costPerUnit);
      if (data.sku) {
        inventoryBySkuMap.set(data.sku, costPerUnit);
      }
    }
    
    // Update each project's material palette
    for (const projectDoc of projectsSnapshot.docs) {
      const projectData = projectDoc.data();
      const palette = projectData.materialPalette;
      
      if (!palette?.entries?.length || palette.mappedCount === 0) {
        continue;
      }
      
      let hasChanges = false;
      const entries = [...palette.entries];
      
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        
        if (!entry.inventoryId && !entry.inventorySku) {
          continue;
        }
        
        // Look up current price from inventory
        let currentPrice = entry.inventoryId 
          ? inventoryByIdMap.get(entry.inventoryId)
          : undefined;
        
        if (currentPrice === undefined && entry.inventorySku) {
          currentPrice = inventoryBySkuMap.get(entry.inventorySku);
        }
        
        if (currentPrice !== undefined && currentPrice > 0 && currentPrice !== entry.unitCost) {
          entries[i] = {
            ...entry,
            unitCost: currentPrice,
            updatedAt: {
              seconds: Math.floor(Date.now() / 1000),
              nanoseconds: 0,
            },
          };
          hasChanges = true;
          stats.materialsUpdated++;
        }
      }
      
      if (hasChanges) {
        await projectDoc.ref.update({
          'materialPalette.entries': entries,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: 'katana-sync',
        });
        stats.projectsUpdated++;
      }
    }
    
    console.log(`Material palette prices synced: ${stats.materialsUpdated} materials in ${stats.projectsUpdated} projects`);
    
  } catch (error) {
    console.error('Failed to sync material palette prices:', error);
  }
  
  return stats;
}

/**
 * Helper: Infer category from Katana type/name
 */
function inferCategory(type, name) {
  const lowerType = (type || '').toLowerCase();
  const lowerName = (name || '').toLowerCase();

  // Sheet goods detection - expanded patterns
  const sheetGoodsPatterns = [
    'board', 'sheet', 'panel', 'mdf', 'plywood', 'chipboard', 'melamine',
    'laminate', 'particleboard', 'osb', 'hardboard', 'fibreboard', 'hpl',
    'formica', 'veneer sheet', 'ply', 'marine', 'blockboard', 'mfc',
    'acrylic sheet', 'perspex', 'polycarb', 'abs sheet', 'pvc sheet',
    'compact', 'solid surface', 'corian', 'hdf', 'medium density'
  ];
  
  if (sheetGoodsPatterns.some(p => lowerType.includes(p) || lowerName.includes(p))) {
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

/**
 * Firestore trigger to handle sync requests
 * Client creates document in syncRequests collection, this processes it
 */
const { onDocumentCreated } = require('firebase-functions/v2/firestore');

const processSyncRequest = onDocumentCreated({
  document: 'syncRequests/{requestId}',
  memory: '1GiB',
  timeoutSeconds: 540,
  secrets: [KATANA_API_KEY],
}, async (event) => {
  const data = event.data?.data();
  if (!data) return;
  
  const requestRef = event.data.ref;
  const requestId = event.params.requestId;
  
  console.log(`Processing sync request ${requestId} of type: ${data.type}`);
  
  // Only process katana-sync requests
  if (data.type !== 'katana-sync') {
    await requestRef.update({ status: 'skipped', reason: 'Unknown request type' });
    return;
  }
  
  // Mark as processing
  await requestRef.update({ 
    status: 'processing',
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  try {
    const katanaMaterials = await fetchKatanaMaterialsFromApi();
    const stats = {
      fetched: katanaMaterials.length || 0,
      withPrices: katanaMaterials.filter((m) => (m?.costPerUnit || 0) > 0).length,
      updated: 0,
      created: 0,
      catalogWritten: 0,
    };
    
    // Log sample materials with prices for debugging
    const samplesWithPrice = katanaMaterials.filter((m) => (m?.costPerUnit || 0) > 0).slice(0, 3);
    console.log('Sample materials with prices:', JSON.stringify(samplesWithPrice, null, 2));
    
    // Write to katanaCatalog collection in batches of 400 (under 500 limit)
    const catalogRef = db.collection('katanaCatalog');
    const BATCH_SIZE = 400;
    
    for (let i = 0; i < katanaMaterials.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const chunk = katanaMaterials.slice(i, i + BATCH_SIZE);
      
      for (const material of chunk) {
        if (!material?.id) continue;
        
        const katanaId = String(material.id);
        const catalogDocRef = catalogRef.doc(katanaId);
        
        batch.set(catalogDocRef, {
          katanaId,
          sku: material.sku || '',
          name: material.name || 'Unknown',
          type: material.type || 'material',
          costPerUnit: material.costPerUnit || 0,
          inStock: material.inStock || 0,
          unit: material.unit || 'ea',
          currency: material.currency || 'UGX',
          lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
          source: 'katana-api',
        }, { merge: true });
        
        stats.catalogWritten++;
      }
      
      await batch.commit();
      console.log(`Committed catalog batch ${Math.floor(i / BATCH_SIZE) + 1}, items ${i + 1} to ${Math.min(i + BATCH_SIZE, katanaMaterials.length)}`);
    }
    
    console.log(`Total catalog items written: ${stats.catalogWritten}`);
    
    // Update inventory items in batches to speed up processing
    const inventoryRef = db.collection(INVENTORY_COLLECTION);
    
    // First, get all existing inventory items with katanaId
    const existingInventorySnapshot = await inventoryRef
      .where('katanaId', '!=', null)
      .get();
    
    const existingByKatanaId = new Map();
    existingInventorySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.katanaId) {
        existingByKatanaId.set(data.katanaId, doc.ref);
      }
    });
    
    console.log(`Found ${existingByKatanaId.size} existing inventory items with katanaId`);
    
    // Process inventory updates in batches
    const INV_BATCH_SIZE = 400;
    for (let i = 0; i < katanaMaterials.length; i += INV_BATCH_SIZE) {
      const invBatch = db.batch();
      const chunk = katanaMaterials.slice(i, i + INV_BATCH_SIZE);
      let batchOps = 0;
      
      for (const material of chunk) {
        if (!material?.id) continue;
        
        const katanaId = String(material.id);
        const existingRef = existingByKatanaId.get(katanaId);
        
        if (existingRef) {
          invBatch.update(existingRef, {
            'pricing.costPerUnit': material.costPerUnit || 0,
            'pricing.lastSyncedFromKatana': admin.firestore.FieldValue.serverTimestamp(),
            'inventory.inStock': material.inStock || 0,
            'inventory.committed': material.committed || 0,
            'inventory.available': material.available || 0,
            'inventory.lastSyncedFromKatana': admin.firestore.FieldValue.serverTimestamp(),
            'katanaSync.lastPulledAt': admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          stats.updated++;
          batchOps++;
        } else {
          const newRef = inventoryRef.doc();
          invBatch.set(newRef, {
            sku: material.sku || katanaId,
            name: material.name || 'Unknown',
            source: 'katana',
            katanaId,
            tier: 'global',
            category: inferCategory(material.type, material.name),
            pricing: {
              costPerUnit: material.costPerUnit || 0,
              currency: material.currency || 'UGX',
              unit: material.unit || 'ea',
              lastSyncedFromKatana: admin.firestore.FieldValue.serverTimestamp(),
            },
            inventory: {
              inStock: material.inStock || 0,
              committed: material.committed || 0,
              available: material.available || 0,
              lastSyncedFromKatana: admin.firestore.FieldValue.serverTimestamp(),
            },
            katanaSync: {
              isStandard: false,
              pendingPush: false,
              lastPulledAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            status: 'active',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: 'katana-sync',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: 'katana-sync',
          });
          stats.created++;
          batchOps++;
        }
      }
      
      if (batchOps > 0) {
        await invBatch.commit();
        console.log(`Committed inventory batch ${Math.floor(i / INV_BATCH_SIZE) + 1}, ${batchOps} operations`);
      }
    }
    
    // Sync material palette prices
    const paletteSyncStats = await syncMaterialPalettePrices();
    
    // Mark request as completed
    await requestRef.update({
      status: 'completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      stats: {
        ...stats,
        palettePricesUpdated: paletteSyncStats,
      },
    });
    
    console.log(`Sync request ${requestId} completed:`, stats);
    
  } catch (error) {
    console.error(`Sync request ${requestId} failed:`, error);
    
    await requestRef.update({
      status: 'error',
      error: error.message,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
});

module.exports = {
  pullFromKatana,
  pushToKatana,
  triggerKatanaSync,
  processSyncRequest,
};
