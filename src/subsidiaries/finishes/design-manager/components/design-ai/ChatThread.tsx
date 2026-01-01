/**
 * Chat Thread Component
 * Displays list of chat messages
 */

import { ChatMessage as ChatMessageComponent } from './ChatMessage';
import type { ChatMessage } from './useDesignChat';

interface ChatThreadProps {
  messages: ChatMessage[];
}

export function ChatThread({ messages }: ChatThreadProps) {
  return (
    <div className="p-4 space-y-4">
      {messages.map((message) => (
        <ChatMessageComponent key={message.id} message={message} />
      ))}
    </div>
  );
}
