/**
 * Design Chat Hook
 * Manages chat state and API calls for design AI assistant
 */

import { useState, useCallback, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/shared/services/firebase';

const API_BASE = 'https://api-okekivpl2a-uc.a.run.app';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  metadata?: {
    imageAnalysis?: ImageAnalysis;
    featureRecommendations?: string[];
    modelUsed?: string;
  };
}

export interface ImageAnalysis {
  styleElements: string[];
  detectedMaterials: string[];
  colorPalette: string[];
  constructionDetails: string[];
  suggestedFeatures: string[];
}

export interface UsageMetadata {
  inputTokens: number;
  outputTokens: number;
  modelUsed: string;
}

interface UseDesignChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  sendMessage: (message: string, imageData?: string) => Promise<void>;
  clearError: () => void;
  usageStats: UsageMetadata | null;
}

export function useDesignChat(
  designItemId: string,
  projectId: string,
  userId?: string
): UseDesignChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usageStats, setUsageStats] = useState<UsageMetadata | null>(null);

  // Load conversation from Firestore
  useEffect(() => {
    if (!designItemId) {
      setIsLoading(false);
      return;
    }

    const conversationRef = doc(db, 'designItemConversations', designItemId);
    
    const unsubscribe = onSnapshot(conversationRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const loadedMessages: ChatMessage[] = (data.messages || []).map((msg: any, index: number) => ({
          id: `${designItemId}-${index}`,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp?.toDate() || new Date(),
          imageUrl: msg.imageUrl,
          metadata: msg.metadata,
        }));
        setMessages(loadedMessages);
      } else {
        setMessages([]);
      }
      setIsLoading(false);
    }, (err) => {
      console.error('Error loading conversation:', err);
      setError('Failed to load conversation');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [designItemId]);

  const sendMessage = useCallback(async (message: string, imageData?: string) => {
    if (!message.trim() && !imageData) return;

    setIsSending(true);
    setError(null);

    // Optimistically add user message
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: message || '[Image uploaded]',
      timestamp: new Date(),
      imageUrl: imageData,
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch(`${API_BASE}/ai/design-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designItemId,
          projectId,
          message,
          imageData,
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
          })),
          userId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to send message');
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.text,
        timestamp: new Date(),
        metadata: {
          imageAnalysis: result.imageAnalysis,
          featureRecommendations: result.featureRecommendations,
          modelUsed: result.usageMetadata?.modelUsed,
        },
      };
      setMessages(prev => [...prev, assistantMessage]);
      setUsageStats(result.usageMetadata);

    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsSending(false);
    }
  }, [designItemId, projectId, messages, userId]);

  const clearError = useCallback(() => setError(null), []);

  return {
    messages,
    isLoading,
    isSending,
    error,
    sendMessage,
    clearError,
    usageStats,
  };
}
