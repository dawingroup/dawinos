// ============================================================================
// AI ASSISTANT PANEL
// DawinOS v2.0 - Intelligence Layer
// Floating AI assistant chat panel
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  X,
  Minimize2,
  Settings,
  Copy,
  BarChart3,
  Briefcase,
  FileText,
  MessageCircle,
  Bot,
  User,
  Loader2,
} from 'lucide-react';

import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Badge } from '@/core/components/ui/badge';
import { ScrollArea } from '@/core/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/core/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';

import { MODULE_COLOR, ASSISTANT_MODES, AssistantModeId } from '../../constants';
import type { AssistantMessage } from '../../types';

interface AIAssistantPanelProps {
  open: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  initialMode?: AssistantModeId;
  context?: Record<string, any>;
}

const modeIcons: Record<AssistantModeId, React.ReactNode> = {
  general: <MessageCircle className="h-4 w-4" />,
  data_analyst: <BarChart3 className="h-4 w-4" />,
  strategic_advisor: <Briefcase className="h-4 w-4" />,
  document_expert: <FileText className="h-4 w-4" />,
};

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  open,
  onClose,
  onMinimize,
  initialMode = 'general',
}) => {
  const [mode, setMode] = useState<AssistantModeId>(initialMode);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add welcome message on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      const modeConfig = ASSISTANT_MODES.find(m => m.id === mode);
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Hello! I'm your ${modeConfig?.label}. ${modeConfig?.description}. How can I help you today?`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [open, mode, messages.length]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiMessage: AssistantMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: generateMockResponse(input.trim(), mode),
        timestamp: new Date(),
        actions: [
          { label: 'View Details', action: 'view_details' },
          { label: 'Export', action: 'export' },
        ],
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleModeChange = (newMode: AssistantModeId) => {
    setMode(newMode);
    const modeConfig = ASSISTANT_MODES.find(m => m.id === newMode);
    setMessages([
      {
        id: 'mode-change',
        role: 'assistant',
        content: `Switched to ${modeConfig?.label} mode. ${modeConfig?.description}.`,
        timestamp: new Date(),
      },
    ]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  if (!open) return null;

  const currentModeConfig = ASSISTANT_MODES.find(m => m.id === mode);

  return (
    <div
      className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-48px)] h-[600px] max-h-[calc(100vh-100px)] flex flex-col rounded-xl shadow-2xl overflow-hidden z-50 bg-background border"
    >
      {/* Header */}
      <div
        className="p-4 flex items-center gap-3 text-white"
        style={{ backgroundColor: MODULE_COLOR }}
      >
        <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
          <Bot className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">AI Assistant</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Badge
                variant="secondary"
                className="cursor-pointer bg-white/20 hover:bg-white/30 text-white border-0"
              >
                {currentModeConfig?.label}
              </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {ASSISTANT_MODES.map((m) => (
                <DropdownMenuItem
                  key={m.id}
                  onClick={() => handleModeChange(m.id)}
                  className={mode === m.id ? 'bg-muted' : ''}
                >
                  <span className="mr-2">{modeIcons[m.id]}</span>
                  <div>
                    <p className="font-medium">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.description}</p>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {onMinimize && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onMinimize}>
                  <Minimize2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Minimize</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Close</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 bg-muted/30">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                  message.role === 'user' ? 'bg-muted' : ''
                }`}
                style={message.role === 'assistant' ? { backgroundColor: MODULE_COLOR } : {}}
              >
                {message.role === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4 text-white" />
                )}
              </div>

              <div
                className={`max-w-[80%] p-3 rounded-xl shadow-sm ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                {message.actions && message.actions.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {message.actions.map((action, idx) => (
                      <Button
                        key={idx}
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs"
                        style={{ borderColor: MODULE_COLOR, color: MODULE_COLOR }}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {message.role === 'assistant' && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-50 hover:opacity-100"
                            onClick={() => copyMessage(message.content)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-2">
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: MODULE_COLOR }}
              >
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-background p-3 rounded-xl shadow-sm flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: MODULE_COLOR }} />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            style={{ backgroundColor: MODULE_COLOR }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Mock response generator (replace with actual AI)
function generateMockResponse(input: string, mode: AssistantModeId): string {
  const responses: Record<AssistantModeId, string[]> = {
    general: [
      "I've analyzed your request. Based on the current data in DawinOS, I can help you with that.",
      "That's an interesting question. Let me look into the available data and provide you with insights.",
      "I understand what you're looking for. Here's what I found in the system...",
    ],
    data_analyst: [
      "Looking at the metrics, I can see some interesting patterns. The data suggests...",
      "Based on my analysis of the available data, here are the key trends I've identified...",
      "I've run the numbers and here's what the data tells us...",
    ],
    strategic_advisor: [
      "From a strategic perspective, I recommend considering the following approach...",
      "Based on market conditions and your current position, here's my strategic recommendation...",
      "Looking at this strategically, there are several factors to consider...",
    ],
    document_expert: [
      "I've reviewed the document structure. Here are my recommendations for improvement...",
      "Based on best practices for this type of document, I suggest...",
      "The document analysis reveals several key points that should be addressed...",
    ],
  };

  const modeResponses = responses[mode];
  const randomResponse = modeResponses[Math.floor(Math.random() * modeResponses.length)];

  return `${randomResponse}\n\nRegarding "${input.substring(0, 50)}${input.length > 50 ? '...' : ''}", I would recommend exploring the relevant modules in DawinOS for more detailed information.`;
}

export default AIAssistantPanel;
