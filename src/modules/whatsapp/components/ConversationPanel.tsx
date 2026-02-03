/**
 * ConversationPanel - Main conversation view with message thread and compose bar
 */

import { useEffect, useCallback } from 'react';
import { MessageSquare, Phone, User } from 'lucide-react';
import { useMessages, useConversationWindow, useWhatsAppSend } from '../hooks';
import { markConversationRead } from '../services/whatsappService';
import { MessageThread } from './MessageThread';
import { ComposeBar } from './ComposeBar';
import { WhatsAppWindowBanner } from './WhatsAppWindowBanner';
import { formatPhoneForDisplay } from '../utils/phoneUtils';
import type { WhatsAppConversation, TemplateFormData } from '../types';

interface Props {
  conversation: WhatsAppConversation | null;
}

export function ConversationPanel({ conversation }: Props) {
  const { messages, loading: messagesLoading } = useMessages(conversation?.id);
  const windowState = useConversationWindow(conversation);
  const { sendText, sendTemplate, sending, error } = useWhatsAppSend();

  // Mark conversation as read when selected
  useEffect(() => {
    if (conversation?.id && conversation.unreadCount > 0) {
      markConversationRead(conversation.id);
    }
  }, [conversation?.id, conversation?.unreadCount]);

  const handleSendText = useCallback(
    (text: string) => {
      if (!conversation) return;
      sendText(conversation.id, conversation.phoneNumber, text);
    },
    [conversation, sendText]
  );

  const handleSendTemplate = useCallback(
    (data: TemplateFormData) => {
      if (!conversation) return;
      sendTemplate(
        conversation.id,
        conversation.phoneNumber,
        data.templateId,
        data.templateName,
        data.params
      );
    },
    [conversation, sendTemplate]
  );

  // Empty state
  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
        <MessageSquare className="w-16 h-16 mb-4" />
        <p className="text-lg font-medium">Select a conversation</p>
        <p className="text-sm">Choose a conversation from the list to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Conversation header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{conversation.customerName}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Phone className="w-3 h-3" />
            {formatPhoneForDisplay(conversation.phoneNumber)}
          </p>
        </div>
      </div>

      {/* Window status banner */}
      <WhatsAppWindowBanner windowState={windowState} />

      {/* Error banner */}
      {error && (
        <div className="px-4 py-2 bg-red-50 text-red-700 text-sm border-b">
          {error}
        </div>
      )}

      {/* Message thread */}
      <MessageThread messages={messages} loading={messagesLoading} />

      {/* Compose bar */}
      <ComposeBar
        windowState={windowState}
        onSendText={handleSendText}
        onSendTemplate={handleSendTemplate}
        sending={sending}
      />
    </div>
  );
}
