/**
 * Simplified Service Worker - No external dependencies
 */

// Message router
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((error) => {
      console.error('Message handler error:', error);
      sendResponse({ type: 'ERROR', code: 'HANDLER_ERROR', message: error.message });
    });
  return true;
});

async function handleMessage(message: { type: string; [key: string]: unknown }, _sender: chrome.runtime.MessageSender): Promise<unknown> {
  console.log('Service worker received message:', message.type);
  
  switch (message.type) {
    case 'TOGGLE_CLIPPING_MODE':
      return toggleClippingMode();
    
    case 'FETCH_IMAGE':
      return fetchImage(message.url as string);
    
    case 'SAVE_CLIP':
      return saveClipToStorage(message.clip as ClipData);
    
    case 'SAVE_DETAILED_CLIP':
      return saveDetailedClipToStorage(message.data as DetailedClipData);
    
    case 'GET_CLIPS':
      return getClipsFromStorage();
    
    case 'REQUEST_SYNC':
      return { success: true };
    
    default:
      return { success: false, error: 'Unknown message type' };
  }
}

interface ClipData {
  imageUrl: string;
  sourceUrl: string;
  title: string;
  metadata?: Record<string, unknown>;
}

type ClipType = 'inspiration' | 'reference' | 'parts-source' | 'procurement' | 'material' | 'asset' | 'product-idea';

interface DetailedClipData {
  imageUrl: string;
  sourceUrl: string;
  title: string;
  clipType: ClipType;
  projectId?: string;
  designItemId?: string;
  notes?: string;
  // Extracted metadata
  price?: { amount: number; currency: string; formatted?: string; confidence?: number };
  brand?: string;
  sku?: string;
  description?: string;
  dimensions?: { width: number; height: number; depth?: number; unit: string };
  materials?: string[];
  colors?: string[];
}

interface StoredClip {
  id: string;
  imageUrl: string;
  sourceUrl: string;
  title: string;
  thumbnailDataUrl?: string;
  createdAt: string;
  syncStatus: 'pending' | 'synced';
  // Enhanced fields
  clipType?: ClipType;
  projectId?: string;
  designItemId?: string;
  notes?: string;
  analysisStatus?: 'pending' | 'analyzing' | 'completed' | 'failed';
  // Extracted metadata
  price?: { amount: number; currency: string; formatted: string };
  brand?: string;
  sku?: string;
  description?: string;
  dimensions?: { width: number; height: number; depth?: number; unit: string };
  materials?: string[];
  colors?: string[];
}

async function toggleClippingMode(): Promise<{ success: boolean }> {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!activeTab?.id) {
    console.error('No active tab found');
    return { success: false };
  }
  
  console.log('Toggling clipping mode on tab:', activeTab.id);
  
  // Always inject content script first
  try {
    await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      files: ['content.js'],
    });
    console.log('Content script injected');
  } catch (error) {
    console.log('Content script injection error (might already be loaded):', error);
  }
  
  // Inject styles
  try {
    await chrome.scripting.insertCSS({
      target: { tabId: activeTab.id },
      css: `
        body.dawin-clipping-active { cursor: crosshair !important; }
        .dawin-highlight { outline: 3px solid #872E5C !important; outline-offset: 2px; }
      `,
    });
  } catch (error) {
    console.log('CSS injection error:', error);
  }
  
  // Send toggle message
  try {
    await chrome.tabs.sendMessage(activeTab.id, { type: 'TOGGLE_CLIPPING_MODE' });
    console.log('Toggle message sent');
  } catch (error) {
    console.error('Failed to send toggle message:', error);
  }
  
  return { success: true };
}

async function fetchImage(url: string): Promise<{ success: boolean; dataUrl?: string; error?: string }> {
  try {
    const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const blob = await response.blob();
    const dataUrl = await blobToDataUrl(blob);
    
    return { success: true, dataUrl };
  } catch (error) {
    console.error('Failed to fetch image:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function saveClipToStorage(clipData: ClipData): Promise<{ success: boolean; clipId?: string }> {
  try {
    const clip: StoredClip = {
      id: 'clip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      imageUrl: clipData.imageUrl,
      sourceUrl: clipData.sourceUrl,
      title: clipData.title || 'Untitled',
      createdAt: new Date().toISOString(),
      syncStatus: 'pending',
    };
    
    // Try to get thumbnail
    try {
      const imgResponse = await fetch(clipData.imageUrl, { mode: 'cors', credentials: 'omit' });
      if (imgResponse.ok) {
        const blob = await imgResponse.blob();
        clip.thumbnailDataUrl = await blobToDataUrl(blob);
      }
    } catch (e) {
      console.log('Could not fetch thumbnail:', e);
    }
    
    // Get existing clips from local storage
    const result = await chrome.storage.local.get(['clips']);
    const clips: StoredClip[] = result.clips || [];
    
    // Add new clip
    clips.unshift(clip);
    
    // Save to local storage
    await chrome.storage.local.set({ clips });
    console.log('Clip saved locally:', clip.id);
    
    // Sync to Firestore
    await syncClipToFirestore(clip);
    
    return { success: true, clipId: clip.id };
  } catch (error) {
    console.error('Failed to save clip:', error);
    return { success: false };
  }
}

/**
 * Save a detailed clip with clip type and linkages
 */
async function saveDetailedClipToStorage(clipData: DetailedClipData): Promise<{ success: boolean; clipId?: string }> {
  try {
    const clip: StoredClip = {
      id: 'clip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      imageUrl: clipData.imageUrl,
      sourceUrl: clipData.sourceUrl,
      title: clipData.title || 'Untitled',
      createdAt: new Date().toISOString(),
      syncStatus: 'pending',
      // Enhanced fields
      clipType: clipData.clipType,
      projectId: clipData.projectId,
      designItemId: clipData.designItemId,
      notes: clipData.notes,
      analysisStatus: 'pending',
      // Extracted metadata - include price!
      price: clipData.price ? {
        amount: clipData.price.amount,
        currency: clipData.price.currency,
        formatted: clipData.price.formatted || `${clipData.price.currency} ${clipData.price.amount.toFixed(2)}`,
      } : undefined,
      brand: clipData.brand,
      sku: clipData.sku,
      description: clipData.description,
      dimensions: clipData.dimensions,
      materials: clipData.materials,
      colors: clipData.colors,
    };
    
    // Try to get thumbnail
    try {
      const imgResponse = await fetch(clipData.imageUrl, { mode: 'cors', credentials: 'omit' });
      if (imgResponse.ok) {
        const blob = await imgResponse.blob();
        clip.thumbnailDataUrl = await blobToDataUrl(blob);
      }
    } catch (e) {
      console.log('Could not fetch thumbnail:', e);
    }
    
    // Get existing clips from local storage
    const result = await chrome.storage.local.get(['clips']);
    const clips: StoredClip[] = result.clips || [];
    
    // Add new clip
    clips.unshift(clip);
    
    // Save to local storage
    await chrome.storage.local.set({ clips });
    console.log('Detailed clip saved locally:', clip.id, 'type:', clip.clipType);
    
    // Sync to Firestore with enhanced fields
    await syncClipToFirestore(clip);
    
    return { success: true, clipId: clip.id };
  } catch (error) {
    console.error('Failed to save detailed clip:', error);
    return { success: false };
  }
}

/**
 * Sync a clip to Firestore using Firebase REST API
 */
async function syncClipToFirestore(clip: StoredClip): Promise<void> {
  try {
    // Get user info from storage
    const userResult = await chrome.storage.local.get(['user']);
    const user = userResult.user;
    
    if (!user?.uid) {
      console.log('No user signed in, skipping Firestore sync');
      return;
    }
    
    // Get Google OAuth access token
    const accessToken = await new Promise<string>((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        if (chrome.runtime.lastError || !token) {
          reject(new Error(chrome.runtime.lastError?.message || 'No token'));
          return;
        }
        resolve(token);
      });
    });
    
    // Exchange Google OAuth token for Firebase ID token
    const firebaseApiKey = 'AIzaSyCfSYtxRoHxp9bEUkVbCFTnMmq58QzUsg8'; // dawinos web API key
    const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${firebaseApiKey}`;
    
    const signInResponse = await fetch(signInUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postBody: `access_token=${accessToken}&providerId=google.com`,
        requestUri: 'http://localhost',
        returnSecureToken: true,
        returnIdpCredential: true,
      }),
    });
    
    if (!signInResponse.ok) {
      const errorText = await signInResponse.text();
      console.error('Firebase sign-in failed:', signInResponse.status, errorText);
      return;
    }
    
    const signInResult = await signInResponse.json();
    const firebaseIdToken = signInResult.idToken;
    const firebaseUid = signInResult.localId;
    
    console.log('Got Firebase token for user:', firebaseUid);
    
    // Firebase project config
    const projectId = 'dawinos';
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/designClips`;
    
    // Create Firestore document with enhanced fields
    const fields: Record<string, unknown> = {
      sourceUrl: { stringValue: clip.sourceUrl },
      imageUrl: { stringValue: clip.imageUrl },
      thumbnailUrl: { stringValue: clip.thumbnailDataUrl || clip.imageUrl },
      title: { stringValue: clip.title },
      tags: { arrayValue: { values: [] } },
      syncStatus: { stringValue: 'synced' },
      createdBy: { stringValue: firebaseUid },
      createdAt: { timestampValue: new Date().toISOString() },
      updatedAt: { timestampValue: new Date().toISOString() },
      // Enhanced fields
      clipType: { stringValue: clip.clipType || 'inspiration' },
      analysisStatus: { stringValue: clip.analysisStatus || 'pending' },
      clipContext: { 
        mapValue: { 
          fields: { 
            module: { stringValue: 'clipper' },
            triggeredFrom: { stringValue: clip.sourceUrl }
          } 
        } 
      },
      linkages: { arrayValue: { values: [] } },
    };
    
    // Add optional fields if present
    if (clip.projectId) {
      fields.projectId = { stringValue: clip.projectId };
      // Add linkage for project
      (fields.linkages as any).arrayValue.values.push({
        mapValue: {
          fields: {
            type: { stringValue: 'project' },
            targetId: { stringValue: clip.projectId },
            role: { stringValue: clip.clipType === 'inspiration' ? 'inspiration' : 'reference' },
            createdAt: { timestampValue: new Date().toISOString() },
          }
        }
      });
    }
    
    if (clip.designItemId) {
      fields.designItemId = { stringValue: clip.designItemId };
      // Add linkage for design item
      (fields.linkages as any).arrayValue.values.push({
        mapValue: {
          fields: {
            type: { stringValue: 'design-item' },
            targetId: { stringValue: clip.designItemId },
            role: { stringValue: clip.clipType === 'parts-source' ? 'source' : clip.clipType === 'procurement' ? 'procurement' : 'reference' },
            createdAt: { timestampValue: new Date().toISOString() },
          }
        }
      });
    }
    
    if (clip.notes) {
      fields.notes = { stringValue: clip.notes };
    }
    
    // Add price if present
    if (clip.price) {
      fields.price = {
        mapValue: {
          fields: {
            amount: { doubleValue: clip.price.amount },
            currency: { stringValue: clip.price.currency },
            formatted: { stringValue: clip.price.formatted },
          }
        }
      };
    }
    
    // Add other metadata fields
    if (clip.brand) {
      fields.brand = { stringValue: clip.brand };
    }
    if (clip.sku) {
      fields.sku = { stringValue: clip.sku };
    }
    if (clip.description) {
      fields.description = { stringValue: clip.description };
    }
    if (clip.dimensions) {
      fields.dimensions = {
        mapValue: {
          fields: {
            width: { doubleValue: clip.dimensions.width },
            height: { doubleValue: clip.dimensions.height },
            ...(clip.dimensions.depth ? { depth: { doubleValue: clip.dimensions.depth } } : {}),
            unit: { stringValue: clip.dimensions.unit },
          }
        }
      };
    }
    if (clip.materials && clip.materials.length > 0) {
      fields.materials = {
        arrayValue: {
          values: clip.materials.map(m => ({ stringValue: m }))
        }
      };
    }
    if (clip.colors && clip.colors.length > 0) {
      fields.colors = {
        arrayValue: {
          values: clip.colors.map(c => ({ stringValue: c }))
        }
      };
    }
    
    const firestoreDoc = { fields };
    
    const response = await fetch(firestoreUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firebaseIdToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(firestoreDoc),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Firestore sync failed:', response.status, errorText);
      return;
    }
    
    const result = await response.json();
    console.log('Clip synced to Firestore:', result.name);
    
    // Update local clip status
    const clipsResult = await chrome.storage.local.get(['clips']);
    const clips: StoredClip[] = clipsResult.clips || [];
    const clipIndex = clips.findIndex(c => c.id === clip.id);
    if (clipIndex !== -1) {
      clips[clipIndex].syncStatus = 'synced';
      await chrome.storage.local.set({ clips });
    }
  } catch (error) {
    console.error('Firestore sync error:', error);
  }
}

async function getClipsFromStorage(): Promise<{ success: boolean; clips: StoredClip[] }> {
  const result = await chrome.storage.local.get(['clips']);
  return { success: true, clips: result.clips || [] };
}

// Setup on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Dawin Clipper installed');
  setupContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
  console.log('Dawin Clipper started');
  setupContextMenus();
});

function setupContextMenus(): void {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'dawin-clip-image',
      title: 'Clip to Dawin',
      contexts: ['image'],
    });
  });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;
  
  if (info.menuItemId === 'dawin-clip-image' && info.srcUrl) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'QUICK_CLIP',
      imageUrl: info.srcUrl,
    });
  }
});

console.log('Service worker loaded');
