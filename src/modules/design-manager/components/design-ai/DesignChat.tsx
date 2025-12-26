/**
 * Design Chat Component
 * Main chat interface for AI design assistant
 */

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Minimize2, Maximize2, Sparkles } from 'lucide-react';
import { ChatThread } from './ChatThread';
import { ChatInput } from './ChatInput';
import { useDesignChat } from './useDesignChat';

interface DesignChatProps {
  designItemId: string;
  projectId: string;
  designItemName?: string;
  userId?: string;
}

export function DesignChat({ 
  designItemId, 
  projectId, 
  designItemName,
  userId 
}: DesignChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    isSending,
    error,
    sendMessage,
    clearError,
    usageStats,
  } = useDesignChat(designItemId, projectId, userId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && isOpen && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all z-50 group"
        title="Open Design AI Assistant"
      >
        <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" />
        {messages.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
            {messages.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div 
      className={`fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col transition-all ${
        isMinimized ? 'w-72 h-14' : 'w-96 h-[600px] max-h-[80vh]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-white" />
          <div>
            <h3 className="font-semibold text-white text-sm">Design AI</h3>
            {!isMinimized && designItemName && (
              <p className="text-xs text-white/80 truncate max-w-[180px]">{designItemName}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Error Banner */}
          {error && (
            <div className="px-4 py-2 bg-red-50 border-b border-red-100 flex items-center justify-between">
              <p className="text-sm text-red-600">{error}</p>
              <button onClick={clearError} className="text-red-400 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Design AI Assistant</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Ask about materials, design decisions, or upload reference images for analysis.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['Suggest materials', 'Analyze style', 'Manufacturing tips'].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-gray-700 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <ChatThread messages={messages} />
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <ChatInput 
            onSend={sendMessage} 
            isSending={isSending}
            disabled={isLoading}
          />

          {/* Usage Stats */}
          {usageStats && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <p className="text-xs text-gray-400 text-center">
                Tokens: {usageStats.inputTokens} in / {usageStats.outputTokens} out
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
