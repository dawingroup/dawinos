/**
 * WhatsApp Communication Module - Types
 * Mirrors Firestore collection schemas
 */

import { Timestamp } from 'firebase/firestore';

// ============================================
// Conversation Types
// ============================================

export interface WhatsAppConversation {
  id: string;
  customerId: string | null;
  customerName: string;
  phoneNumber: string; // Normalized format e.g. '256XXXXXXXXX'
  zokoContactId?: string;

  // 24-hour window tracking
  lastInboundAt: Timestamp | null;
  windowExpiresAt: Timestamp | null;
  isWindowOpen: boolean;

  // Conversation state
  status: ConversationStatus;
  unreadCount: number;
  lastMessageText: string;
  lastMessageAt: Timestamp;
  lastMessageDirection: MessageDirection;

  // Assignment
  assignedTo?: string;
  assignedToName?: string;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ConversationStatus = 'active' | 'archived' | 'blocked';
export type MessageDirection = 'inbound' | 'outbound';

// ============================================
// Message Types
// ============================================

export interface WhatsAppMessage {
  id: string;
  conversationId: string;

  direction: MessageDirection;
  messageType: WhatsAppMessageType;
  textContent?: string;

  // Template info
  templateId?: string;
  templateName?: string;
  templateParams?: Record<string, string>;

  // Media
  imageUrl?: string;
  imageCaption?: string;

  // Delivery status
  status: MessageDeliveryStatus;
  zokoMessageId?: string;
  errorMessage?: string;

  // Sender info
  senderType: SenderType;
  senderId?: string;
  senderName?: string;

  // Timestamps
  sentAt: Timestamp;
  deliveredAt?: Timestamp;
  readAt?: Timestamp;
  createdAt: Timestamp;
}

export type WhatsAppMessageType = 'text' | 'template' | 'image' | 'greeting';
export type MessageDeliveryStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
export type SenderType = 'system' | 'employee' | 'customer';

// ============================================
// Template Types
// ============================================

export interface WhatsAppTemplate {
  id: string;
  zokoTemplateId: string;
  name: string;
  language: string;
  category: string;
  bodyText: string; // With {{1}}, {{2}} placeholders
  headerType?: 'text' | 'image' | 'document' | null;
  headerText?: string | null;
  footerText?: string | null;
  parameterCount: number;
  status: TemplateStatus;
  lastSyncedAt: Timestamp;
  createdAt?: Timestamp;
}

export type TemplateStatus = 'approved' | 'pending' | 'rejected' | 'removed';

// ============================================
// Config Types
// ============================================

export interface WhatsAppConfig {
  enabled: boolean;
  zokoApiKeyConfigured: boolean;
  webhookRegistered: boolean;
  webhookUrl?: string;
  defaultCountryCode: string;
  rateLimitPerMinute: number;
  allowedSenderRoles: string[];
  lastTemplateSyncAt?: Timestamp;
}

// ============================================
// UI / Form Types
// ============================================

export interface SendMessagePayload {
  conversationId?: string;
  customerId?: string;
  customerName?: string;
  phoneNumber: string;
  messageType: WhatsAppMessageType;
  text?: string;
  templateId?: string;
  templateName?: string;
  templateParams?: Record<string, string>;
  imageUrl?: string;
  imageCaption?: string;
}

export interface SendMessageResult {
  success: boolean;
  conversationId: string;
  messageId: string;
  zokoMessageId?: string;
  error?: string;
  windowClosed?: boolean;
}

export interface TemplateFormData {
  templateId: string;
  templateName: string;
  params: Record<string, string>;
}

export interface ConversationFilter {
  status?: ConversationStatus;
  assignedTo?: string;
  customerId?: string;
  search?: string;
}

export interface WindowState {
  isOpen: boolean;
  expiresAt: Date | null;
  timeRemainingMs: number;
  isExpiringSoon: boolean; // Less than 2 hours
}
