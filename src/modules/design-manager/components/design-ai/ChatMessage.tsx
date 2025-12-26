/**
 * Chat Message Component
 * Individual message bubble with support for images and analysis
 */

import { User, Sparkles } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from './useDesignChat';
import { ImageAnalysisCard } from './ImageAnalysisCard';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="text-center py-2">
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-blue-100' : 'bg-gradient-to-br from-purple-100 to-blue-100'
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-blue-600" />
        ) : (
          <Sparkles className="w-4 h-4 text-purple-600" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block px-4 py-2.5 rounded-2xl ${
          isUser 
            ? 'bg-blue-600 text-white rounded-br-md' 
            : 'bg-gray-100 text-gray-800 rounded-bl-md'
        }`}>
          {/* Image Preview */}
          {message.imageUrl && (
            <div className="mb-2">
              <img 
                src={message.imageUrl} 
                alt="Uploaded" 
                className="max-w-full rounded-lg max-h-48 object-cover"
              />
            </div>
          )}

          {/* Text Content */}
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Image Analysis Card */}
        {message.metadata?.imageAnalysis && (
          <div className="mt-2">
            <ImageAnalysisCard analysis={message.metadata.imageAnalysis} />
          </div>
        )}

        {/* Feature Recommendations */}
        {message.metadata?.featureRecommendations && message.metadata.featureRecommendations.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.metadata.featureRecommendations.map((rec, i) => (
              <span 
                key={i}
                className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs"
              >
                {rec}
              </span>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p className={`text-xs text-gray-400 mt-1 ${isUser ? 'text-right' : ''}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
