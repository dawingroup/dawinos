/**
 * ConversationListItem - Single conversation row in the sidebar
 */

import { MessageSquare } from 'lucide-react';
import type { WhatsAppConversation } from '../types';

interface Props {
  conversation: WhatsAppConversation;
  isSelected: boolean;
  onClick: () => void;
}

function formatRelativeTime(timestamp: { toDate?: () => Date } | null | undefined): string {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp as unknown as string);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function ConversationListItem({ conversation, isSelected, onClick }: Props) {
  const hasUnread = conversation.unreadCount > 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b transition-colors hover:bg-gray-50 ${
        isSelected ? 'bg-green-50 border-l-2 border-l-green-600' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar placeholder */}
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <MessageSquare className="w-5 h-5 text-green-600" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Name and time */}
          <div className="flex items-center justify-between">
            <p className={`text-sm truncate ${hasUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
              {conversation.customerName}
            </p>
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
              {formatRelativeTime(conversation.lastMessageAt)}
            </span>
          </div>

          {/* Last message preview and unread badge */}
          <div className="flex items-center justify-between mt-0.5">
            <p className={`text-xs truncate ${hasUnread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              {conversation.lastMessageDirection === 'outbound' && (
                <span className="text-gray-400">You: </span>
              )}
              {conversation.lastMessageText || 'No messages'}
            </p>
            {hasUnread && (
              <span className="flex-shrink-0 ml-2 w-5 h-5 rounded-full bg-green-600 text-white text-xs flex items-center justify-center">
                {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
