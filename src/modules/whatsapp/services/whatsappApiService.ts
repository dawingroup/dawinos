/**
 * WhatsApp API Service
 * Calls Cloud Functions for Zoko API operations
 */

import { auth } from '@/shared/services/firebase/auth';
import type { SendMessagePayload, SendMessageResult } from '../types';

// Cloud Functions base URL for WhatsApp endpoints
const API_BASE = 'https://us-central1-dawinos.cloudfunctions.net';

/**
 * Get authentication headers with Firebase ID token
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      console.warn('Failed to get auth token:', error);
    }
  }

  return headers;
}

/**
 * Send a WhatsApp message (text, template, or image)
 */
export async function sendWhatsAppMessage(payload: SendMessagePayload): Promise<SendMessageResult> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}/sendWhatsAppMessage`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      conversationId: payload.conversationId || '',
      messageId: '',
      error: data.error || 'Failed to send message',
      windowClosed: data.windowClosed,
    };
  }

  return data as SendMessageResult;
}

/**
 * Trigger template sync from Zoko (admin only)
 */
export async function syncTemplates(): Promise<{ synced: number; removed: number }> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}/syncWhatsAppTemplates`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Template sync failed');
  }

  return response.json();
}

/**
 * Set up the Zoko webhook (admin only, one-time)
 */
export async function setupWebhook(): Promise<{ success: boolean; webhookUrl: string }> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}/setupZokoWebhook`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Webhook setup failed');
  }

  return response.json();
}
