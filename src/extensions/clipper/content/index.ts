/**
 * Content Script - Runs on every page
 * Handles image detection, selection, and clipping
 */

import './styles.css';
import type { Message } from '../types/messages';

let isClippingModeActive = false;
let hoveredImageUrl: string | null = null;

// Initialize
console.log('Dawin Clipper content script loaded');

// Listen for messages from service worker
chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  handleMessage(message)
    .then(sendResponse)
    .catch((error) => {
      console.error('Content script error:', error);
      sendResponse({ success: false, error: error.message });
    });
  
  return true;
});

async function handleMessage(message: Message): Promise<unknown> {
  switch (message.type) {
    case 'TOGGLE_CLIPPING_MODE':
      toggleClippingMode();
      return { success: true, isActive: isClippingModeActive };
    
    case 'QUICK_CLIP':
      if ('imageUrl' in message) {
        return quickClip(message.imageUrl);
      }
      return { success: false, error: 'No image URL' };
    
    case 'QUICK_CLIP_FOCUSED':
      if (hoveredImageUrl) {
        return quickClip(hoveredImageUrl);
      }
      // No focused image, toggle clipping mode instead
      toggleClippingMode();
      return { success: false, message: 'No focused image' };
    
    default:
      return { success: false, error: 'Unknown message type' };
  }
}

function toggleClippingMode(): void {
  isClippingModeActive = !isClippingModeActive;
  
  if (isClippingModeActive) {
    activateClippingMode();
  } else {
    deactivateClippingMode();
  }
}

function activateClippingMode(): void {
  console.log('Clipping mode activated');
  document.body.classList.add('dawin-clipping-active');
  
  // Add event listeners
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('mouseout', handleMouseOut);
  document.addEventListener('click', handleClick, true);
  document.addEventListener('keydown', handleKeyDown);
  
  showToast('Clipping mode active. Click an image to clip. Press ESC to cancel.');
}

function deactivateClippingMode(): void {
  console.log('Clipping mode deactivated');
  document.body.classList.remove('dawin-clipping-active');
  
  // Remove event listeners
  document.removeEventListener('mouseover', handleMouseOver);
  document.removeEventListener('mouseout', handleMouseOut);
  document.removeEventListener('click', handleClick, true);
  document.removeEventListener('keydown', handleKeyDown);
  
  // Remove any highlights
  removeAllHighlights();
}

function handleMouseOver(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  const imageUrl = getImageUrl(target);
  
  if (imageUrl) {
    hoveredImageUrl = imageUrl;
    highlightElement(target);
  }
}

function handleMouseOut(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  removeHighlight(target);
  
  if (getImageUrl(target) === hoveredImageUrl) {
    hoveredImageUrl = null;
  }
}

function handleClick(event: MouseEvent): void {
  if (!isClippingModeActive) return;
  
  const target = event.target as HTMLElement;
  const imageUrl = getImageUrl(target);
  
  if (imageUrl) {
    event.preventDefault();
    event.stopPropagation();
    
    quickClip(imageUrl);
    
    // Optionally keep clipping mode active for multi-select
    // deactivateClippingMode();
  }
}

function handleKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    isClippingModeActive = false;
    deactivateClippingMode();
    showToast('Clipping cancelled');
  }
}

function getImageUrl(element: HTMLElement): string | null {
  // Standard img element
  if (element instanceof HTMLImageElement) {
    return element.currentSrc || element.src;
  }
  
  // Background image
  const bgImage = window.getComputedStyle(element).backgroundImage;
  if (bgImage && bgImage !== 'none') {
    const match = bgImage.match(/url\(["']?(.+?)["']?\)/);
    if (match) {
      return match[1];
    }
  }
  
  // Check for lazy-loaded images
  const lazyAttrs = ['data-src', 'data-lazy-src', 'data-original'];
  for (const attr of lazyAttrs) {
    const value = element.getAttribute(attr);
    if (value) return value;
  }
  
  return null;
}

function highlightElement(element: HTMLElement): void {
  element.classList.add('dawin-highlight');
}

function removeHighlight(element: HTMLElement): void {
  element.classList.remove('dawin-highlight');
}

function removeAllHighlights(): void {
  document.querySelectorAll('.dawin-highlight').forEach((el) => {
    el.classList.remove('dawin-highlight');
  });
}

async function quickClip(imageUrl: string): Promise<{ success: boolean }> {
  try {
    showToast('Clipping image...');
    
    // Request image fetch through service worker (handles CORS)
    const response = await chrome.runtime.sendMessage({
      type: 'FETCH_IMAGE',
      url: imageUrl,
    });
    
    if (!response.success) {
      showToast('Failed to clip image: ' + response.error, 'error');
      return { success: false };
    }
    
    // Extract page metadata
    const metadata = extractPageMetadata();
    
    // Save clip (will be implemented in Phase 3)
    await chrome.runtime.sendMessage({
      type: 'SAVE_CLIP',
      clip: {
        imageUrl,
        sourceUrl: window.location.href,
        title: metadata.title,
        metadata,
      },
    });
    
    showToast('Image clipped!', 'success');
    return { success: true };
  } catch (error) {
    console.error('Quick clip failed:', error);
    showToast('Failed to clip image', 'error');
    return { success: false };
  }
}

function extractPageMetadata(): { title: string; description?: string } {
  const title = document.querySelector('h1')?.textContent?.trim() ||
    document.title ||
    'Untitled';
  
  const description = document.querySelector('meta[name="description"]')?.getAttribute('content') ||
    document.querySelector('[itemprop="description"]')?.textContent?.trim();
  
  return { title, description };
}

// Toast notification
let toastElement: HTMLElement | null = null;
let toastTimeout: ReturnType<typeof setTimeout> | null = null;

function showToast(message: string, type: 'info' | 'success' | 'error' = 'info'): void {
  if (!toastElement) {
    toastElement = document.createElement('div');
    toastElement.id = 'dawin-toast';
    document.body.appendChild(toastElement);
  }
  
  const colors = {
    info: '#2563EB',
    success: '#16A34A',
    error: '#DC2626',
  };
  
  toastElement.textContent = message;
  toastElement.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${colors[type]};
    color: white;
    border-radius: 8px;
    font-family: system-ui, sans-serif;
    font-size: 14px;
    z-index: 2147483647;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: opacity 0.3s;
  `;
  
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }
  
  toastTimeout = setTimeout(() => {
    if (toastElement) {
      toastElement.style.opacity = '0';
      setTimeout(() => {
        toastElement?.remove();
        toastElement = null;
      }, 300);
    }
  }, 3000);
}

// Track hovered images for quick clip shortcut
document.addEventListener('mouseover', (event) => {
  const target = event.target as HTMLElement;
  const imageUrl = getImageUrl(target);
  if (imageUrl) {
    hoveredImageUrl = imageUrl;
  }
});

document.addEventListener('mouseout', (event) => {
  const target = event.target as HTMLElement;
  if (getImageUrl(target) === hoveredImageUrl) {
    hoveredImageUrl = null;
  }
});
