/**
 * MessageBubble - Renders a single WhatsApp message
 * Left-aligned for inbound, right-aligned for outbound
 */

import { WhatsAppStatusBadge } from './WhatsAppStatusBadge';
import type { WhatsAppMessage } from '../types';

interface Props {
  message: WhatsAppMessage;
}

function formatTime(timestamp: { toDate?: () => Date } | null | undefined): string {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp as unknown as string);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(timestamp: { toDate?: () => Date } | null | undefined): string {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp as unknown as string);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export function MessageBubble({ message }: Props) {
  const isOutbound = message.direction === 'outbound';

  return (
    <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[75%] rounded-lg px-3 py-2 ${
          isOutbound
            ? 'bg-green-100 text-green-900 rounded-br-none'
            : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
        }`}
      >
        {/* Sender name for outbound messages */}
        {isOutbound && message.senderName && (
          <p className="text-xs font-medium text-green-700 mb-0.5">{message.senderName}</p>
        )}

        {/* Template indicator */}
        {message.messageType === 'template' && (
          <span className="inline-block text-xs bg-gray-200 text-gray-600 rounded px-1.5 py-0.5 mb-1">
            Template
          </span>
        )}

        {/* Image */}
        {message.messageType === 'image' && message.imageUrl && (
          <div className="mb-1">
            <img
              src={message.imageUrl}
              alt={message.imageCaption || 'Image'}
              className="rounded max-w-full max-h-64 object-cover"
            />
          </div>
        )}

        {/* Message text */}
        {message.textContent && (
          <p className="text-sm whitespace-pre-wrap break-words">{message.textContent}</p>
        )}

        {/* Timestamp and status */}
        <div className={`flex items-center gap-1 mt-1 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs text-gray-500">{formatTime(message.sentAt)}</span>
          {isOutbound && <WhatsAppStatusBadge status={message.status} />}
        </div>

        {/* Error message */}
        {message.status === 'failed' && message.errorMessage && (
          <p className="text-xs text-red-500 mt-1">{message.errorMessage}</p>
        )}
      </div>
    </div>
  );
}

// Export for use by MessageThread to group messages by date
export { formatDate };
