/**
 * DynamicFavicon Component
 * Updates the page favicon based on uploaded branding
 */

import { useEffect } from 'react';
import { useBranding } from '@/shared/hooks/useBranding';

export function DynamicFavicon() {
  const { branding } = useBranding();

  useEffect(() => {
    console.log('[DynamicFavicon] Branding changed:', branding);
    if (!branding.faviconUrl) {
      console.log('[DynamicFavicon] No faviconUrl, skipping update');
      return;
    }

    // Find or create favicon link element
    let faviconLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement;

    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      faviconLink.type = 'image/svg+xml';
      document.head.appendChild(faviconLink);
    }

    // Update href to custom favicon
    console.log('[DynamicFavicon] Updating favicon to:', branding.faviconUrl);
    faviconLink.href = branding.faviconUrl;

    // Also update apple-touch-icon if exists
    const appleTouchIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
    if (appleTouchIcon) {
      appleTouchIcon.href = branding.faviconUrl;
    }
  }, [branding.faviconUrl]);

  return null; // This component doesn't render anything
}

export default DynamicFavicon;
