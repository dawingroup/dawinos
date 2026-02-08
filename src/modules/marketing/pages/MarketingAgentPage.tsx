/**
 * MarketingAgentPage
 * AI-powered marketing assistant with chat, content generation, and key dates
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Bot,
  Send,
  Calendar,
  Sparkles,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  RefreshCw,
  Target,
  Clock,
  Tag,
  Globe,
  MessageSquare,
  Settings2,
  X,
} from 'lucide-react';
import { useMarketingAgent } from '../hooks';
import type {
  AgentMessage,
  ContentGenerationRequest,
  ContentTone,
  GeneratedContent,
  MarketingKeyDate,
  MarketingDateCategory,
} from '../types';
import { CONTENT_TONES } from '../types/marketing-agent.types';
import type { SocialPlatform } from '../types/campaign.types';
import { SOCIAL_PLATFORMS } from '../constants';

// ============================================
// Simple Markdown Renderer
// ============================================

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) elements.push(<br key={`br-${lineIndex}`} />);

    // Process inline formatting
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let partKey = 0;

    while (remaining.length > 0) {
      // Bold: **text**
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          parts.push(<span key={`${lineIndex}-${partKey++}`}>{remaining.slice(0, boldMatch.index)}</span>);
        }
        parts.push(<strong key={`${lineIndex}-${partKey++}`} className="font-semibold">{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
        continue;
      }

      // List item: - text
      if (remaining.match(/^- /)) {
        parts.push(<span key={`${lineIndex}-${partKey++}`} className="ml-2">{'• '}{remaining.slice(2)}</span>);
        remaining = '';
        continue;
      }

      // Numbered list: 1. text
      const numMatch = remaining.match(/^(\d+)\. /);
      if (numMatch) {
        parts.push(<span key={`${lineIndex}-${partKey++}`} className="ml-2">{remaining}</span>);
        remaining = '';
        continue;
      }

      // No match, output remaining
      parts.push(<span key={`${lineIndex}-${partKey++}`}>{remaining}</span>);
      remaining = '';
    }

    elements.push(...parts);
  });

  return elements;
}

// ============================================
// Chat Message Bubble
// ============================================

function ChatBubble({ message }: { message: AgentMessage }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-primary text-primary-foreground' : 'bg-purple-100 text-purple-700'
      }`}>
        {isUser ? (
          <MessageSquare className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Message */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block text-left rounded-xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-gray-100 text-gray-900'
        }`}>
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <div>{renderMarkdown(message.content)}</div>
          )}
        </div>

        {/* Actions */}
        {!isUser && (
          <div className="flex items-center gap-1 mt-1">
            <button
              onClick={handleCopy}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Copy"
            >
              {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            </button>
            <span className="text-[10px] text-gray-400">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Content Generator Panel
// ============================================

function ContentGeneratorPanel({
  onGenerate,
  generating,
}: {
  onGenerate: (request: ContentGenerationRequest) => void;
  generating: boolean;
}) {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<ContentTone>('professional');
  const [platforms, setPlatforms] = useState<SocialPlatform[]>(['instagram']);
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeCTA, setIncludeCTA] = useState(true);

  const togglePlatform = (p: SocialPlatform) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleGenerate = () => {
    if (!topic.trim()) return;
    onGenerate({
      type: 'social_post',
      topic: topic.trim(),
      platforms,
      tone,
      length: 'medium',
      includeHashtags,
      includeCallToAction: includeCTA,
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-purple-500" />
        Generate Content
      </h3>

      {/* Topic */}
      <div>
        <label className="text-xs font-medium text-gray-600">Topic / Theme</label>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. New Italian marble collection launch, home renovation tips..."
          rows={2}
          className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none"
        />
      </div>

      {/* Tone */}
      <div>
        <label className="text-xs font-medium text-gray-600">Tone</label>
        <select
          value={tone}
          onChange={(e) => setTone(e.target.value as ContentTone)}
          className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
        >
          {Object.entries(CONTENT_TONES).map(([key, config]) => (
            <option key={key} value={key}>{config.label} — {config.description}</option>
          ))}
        </select>
      </div>

      {/* Platforms */}
      <div>
        <label className="text-xs font-medium text-gray-600">Platforms</label>
        <div className="flex gap-2 mt-1 flex-wrap">
          {(Object.entries(SOCIAL_PLATFORMS) as [SocialPlatform, { label: string; color: string }][]).map(
            ([key, { label, color }]) => (
              <button
                key={key}
                onClick={() => togglePlatform(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  platforms.includes(key)
                    ? 'text-white border-transparent'
                    : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
                style={platforms.includes(key) ? { backgroundColor: color } : undefined}
              >
                {label}
              </button>
            )
          )}
        </div>
      </div>

      {/* Options */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={includeHashtags}
            onChange={(e) => setIncludeHashtags(e.target.checked)}
            className="rounded border-gray-300"
          />
          Include Hashtags
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={includeCTA}
            onChange={(e) => setIncludeCTA(e.target.checked)}
            className="rounded border-gray-300"
          />
          Call to Action
        </label>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={generating || !topic.trim() || platforms.length === 0}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm font-medium"
      >
        {generating ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate Post
          </>
        )}
      </button>
    </div>
  );
}

// ============================================
// Generated Content Display
// ============================================

function GeneratedContentDisplay({
  content,
}: {
  content: GeneratedContent;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Generated Content</h3>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100"
        >
          {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Main Content */}
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap">
          {content.headline && (
            <div className="font-semibold text-base mb-2">{content.headline}</div>
          )}
          {content.content}
        </div>

        {/* Hashtags */}
        {content.hashtags.length > 0 && (
          <div>
            <span className="text-xs font-medium text-gray-500">Hashtags:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {content.hashtags.map((tag) => (
                <span key={tag} className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Strategy Alignment */}
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-green-600" />
            <span className="text-xs font-semibold text-green-800">Strategy Alignment</span>
            <span className="ml-auto text-sm font-bold text-green-700">{content.strategyAlignment.overall}%</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-green-600">Brand Voice</span>
              <div className="font-medium text-green-800">{content.strategyAlignment.brandVoice}%</div>
            </div>
            <div>
              <span className="text-green-600">Target Audience</span>
              <div className="font-medium text-green-800">{content.strategyAlignment.targetAudience}%</div>
            </div>
            <div>
              <span className="text-green-600">Business Goals</span>
              <div className="font-medium text-green-800">{content.strategyAlignment.businessGoals}%</div>
            </div>
          </div>
        </div>

        {/* Platform Variants */}
        {content.platformVariants.length > 1 && (
          <div>
            <span className="text-xs font-medium text-gray-500">Platform Variants:</span>
            <div className="mt-2 space-y-2">
              {content.platformVariants.map((v) => (
                <div key={v.platform} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold capitalize">{v.platform}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      v.withinLimit ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {v.characterCount} chars {v.withinLimit ? '✓' : '(over limit)'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 whitespace-pre-wrap">{v.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Key Dates Panel
// ============================================

const CATEGORY_COLORS: Record<MarketingDateCategory, string> = {
  holiday: 'bg-red-100 text-red-700',
  industry_event: 'bg-blue-100 text-blue-700',
  seasonal: 'bg-green-100 text-green-700',
  company_milestone: 'bg-purple-100 text-purple-700',
  product_launch: 'bg-orange-100 text-orange-700',
  cultural: 'bg-pink-100 text-pink-700',
  sales_event: 'bg-yellow-100 text-yellow-800',
  custom: 'bg-gray-100 text-gray-700',
};

function KeyDatesPanel({
  dates,
  loading,
  onDiscover,
  onAcknowledge,
  onDelete,
}: {
  dates: MarketingKeyDate[];
  loading: boolean;
  onDiscover: () => void;
  onAcknowledge: (id: string) => void;
  onDelete: (id: string) => void;
}) {

  // Show upcoming dates sorted by date
  const upcomingDates = dates
    .filter((d) => d.date.toMillis() >= Date.now())
    .sort((a, b) => a.date.toMillis() - b.date.toMillis());

  const pastDates = dates
    .filter((d) => d.date.toMillis() < Date.now())
    .sort((a, b) => b.date.toMillis() - a.date.toMillis())
    .slice(0, 5);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-500" />
          Key Marketing Dates
        </h3>
        <button
          onClick={onDiscover}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <Globe className="h-3 w-3" />
          )}
          Discover Dates
        </button>
      </div>

      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {dates.length === 0 && !loading ? (
          <div className="text-center py-8">
            <Calendar className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No key dates yet</p>
            <p className="text-xs text-gray-400 mt-1">Click "Discover Dates" to find marketing opportunities</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 text-gray-300 animate-spin" />
          </div>
        ) : (
          <>
            {upcomingDates.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Upcoming</p>
                {upcomingDates.map((date) => (
                  <KeyDateCard
                    key={date.id}
                    date={date}
                    onAcknowledge={onAcknowledge}
                    onDelete={onDelete}
                  />
                ))}
              </>
            )}
            {pastDates.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">Recent</p>
                {pastDates.map((date) => (
                  <KeyDateCard
                    key={date.id}
                    date={date}
                    onAcknowledge={onAcknowledge}
                    onDelete={onDelete}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function KeyDateCard({
  date,
  onAcknowledge,
  onDelete,
}: {
  date: MarketingKeyDate;
  onAcknowledge: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const dateObj = date.date.toDate();
  const daysUntil = Math.ceil((dateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isPast = daysUntil < 0;

  return (
    <div className={`border rounded-lg p-3 transition-colors ${
      date.acknowledged ? 'border-gray-200 bg-gray-50' : 'border-blue-200 bg-blue-50/30'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">{date.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[date.category]}`}>
              {date.category.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {dateObj.toLocaleDateString()}
            </span>
            {!isPast && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {daysUntil === 0 ? 'Today' : `${daysUntil}d away`}
              </span>
            )}
            {date.leadTimeDays > 0 && !isPast && (
              <span className="text-orange-600">
                Start prep in {Math.max(0, daysUntil - date.leadTimeDays)}d
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!date.acknowledged && (
            <button
              onClick={() => onAcknowledge(date.id)}
              className="p-1 text-blue-500 hover:bg-blue-100 rounded"
              title="Acknowledge"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-gray-400 hover:bg-gray-200 rounded"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 text-xs">
          <p className="text-gray-600">{date.description}</p>

          {date.suggestedActions.length > 0 && (
            <div>
              <span className="font-medium text-gray-700">Suggested Actions:</span>
              <ul className="mt-1 space-y-0.5">
                {date.suggestedActions.map((action, i) => (
                  <li key={i} className="text-gray-600 flex items-start gap-1">
                    <span className="text-gray-400 mt-0.5">•</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {date.suggestedContentThemes.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <Tag className="h-3 w-3 text-gray-400" />
              {date.suggestedContentThemes.map((theme) => (
                <span key={theme} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">
                  {theme}
                </span>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => onDelete(date.id)}
              className="text-red-500 hover:text-red-700 text-[10px] flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" /> Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Page
// ============================================

type ActiveTab = 'chat' | 'generate' | 'dates' | 'strategy';

// ============================================
// Strategy Setup Panel
// ============================================

function StrategySetupPanel({
  context,
  onChange,
}: {
  context: Record<string, any>;
  onChange: (ctx: Record<string, any>) => void;
}) {
  const [brandVoice, setBrandVoice] = useState(context.brandVoice || '');
  const [targetMarket, setTargetMarket] = useState(context.targetMarket || '');
  const [businessGoals, setBusinessGoals] = useState((context.businessGoals || []).join(', '));
  const [contentPillars, setContentPillars] = useState((context.contentPillars || []).join(', '));
  const [productFocus, setProductFocus] = useState((context.productFocus || []).join(', '));
  const [uniqueSellingPoints, setUniqueSellingPoints] = useState((context.uniqueSellingPoints || []).join(', '));
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const splitTrim = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
    onChange({
      ...context,
      brandVoice,
      targetMarket,
      businessGoals: splitTrim(businessGoals),
      contentPillars: splitTrim(contentPillars),
      productFocus: splitTrim(productFocus),
      uniqueSellingPoints: splitTrim(uniqueSellingPoints),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
        <Settings2 className="h-4 w-4 text-gray-500" />
        Strategy Context
      </h3>
      <p className="text-xs text-gray-500">
        Define your business strategy so the AI can align all generated content with your goals.
      </p>

      <div>
        <label className="text-xs font-medium text-gray-600">Brand Voice</label>
        <input
          value={brandVoice}
          onChange={(e) => setBrandVoice(e.target.value)}
          placeholder="e.g. Professional yet approachable, luxury-focused"
          className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600">Target Market</label>
        <input
          value={targetMarket}
          onChange={(e) => setTargetMarket(e.target.value)}
          placeholder="e.g. Homeowners, architects, interior designers in East Africa"
          className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600">Business Goals (comma-separated)</label>
        <input
          value={businessGoals}
          onChange={(e) => setBusinessGoals(e.target.value)}
          placeholder="e.g. Increase brand awareness, drive showroom visits, grow online sales"
          className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600">Content Pillars (comma-separated)</label>
        <input
          value={contentPillars}
          onChange={(e) => setContentPillars(e.target.value)}
          placeholder="e.g. Design inspiration, product quality, customer stories, expert tips"
          className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600">Product Focus (comma-separated)</label>
        <input
          value={productFocus}
          onChange={(e) => setProductFocus(e.target.value)}
          placeholder="e.g. Italian marble, porcelain tiles, natural stone, custom finishes"
          className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600">Unique Selling Points (comma-separated)</label>
        <input
          value={uniqueSellingPoints}
          onChange={(e) => setUniqueSellingPoints(e.target.value)}
          placeholder="e.g. Direct import from Italy, largest showroom in EA, expert installation"
          className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
        />
      </div>

      <button
        onClick={handleSave}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
      >
        {saved ? (
          <>
            <Check className="h-4 w-4" />
            Saved!
          </>
        ) : (
          <>
            <Settings2 className="h-4 w-4" />
            Save Strategy Context
          </>
        )}
      </button>
    </div>
  );
}

export default function MarketingAgentPage() {
  const {
    messages,
    sendMessage,
    clearChat,
    chatLoading,
    generatedContent,
    generatePostContent,
    generating,
    keyDates,
    loadKeyDates,
    discoverDates,
    saveDates,
    acknowledgeDt,
    removeDt,
    datesLoading,
    strategyContext,
    setStrategyContext,
    error,
  } = useMarketingAgent();

  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [inputValue, setInputValue] = useState('');
  const [dismissedError, setDismissedError] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load key dates on mount
  useEffect(() => {
    loadKeyDates();
  }, [loadKeyDates]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset error dismissal when error changes
  useEffect(() => {
    setDismissedError(false);
  }, [error]);

  // Auto-resize textarea
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, []);

  // Send chat message
  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || chatLoading) return;
    const msg = inputValue;
    setInputValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await sendMessage(msg);
  }, [inputValue, chatLoading, sendMessage]);

  // Handle content generation
  const handleGenerate = useCallback(async (request: ContentGenerationRequest) => {
    await generatePostContent(request);
  }, [generatePostContent]);

  // Handle discover dates
  const handleDiscoverDates = useCallback(async () => {
    const dates = await discoverDates({ region: 'East Africa', country: 'Uganda', industry: 'interior design' });
    if (dates.length > 0) {
      await saveDates(dates);
    }
  }, [discoverDates, saveDates]);

  const tabs: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'generate', label: 'Generate', icon: Sparkles },
    { id: 'dates', label: 'Key Dates', icon: Calendar },
    { id: 'strategy', label: 'Strategy', icon: Settings2 },
  ];

  return (
    <>
      <Helmet>
        <title>Marketing AI Agent | Marketing Hub</title>
      </Helmet>

      <div className="h-[calc(100vh-7rem)] flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Marketing AI Agent</h1>
              <p className="text-xs text-gray-500">Strategy-aligned content creation & marketing planning</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {tab.id === 'dates' && keyDates.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded-full font-semibold">
                      {keyDates.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="h-full flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => (
                  <ChatBubble key={msg.id} message={msg} />
                ))}
                {chatLoading && (
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-purple-700" />
                    </div>
                    <div className="bg-gray-100 rounded-xl px-4 py-3">
                      <div className="flex gap-1">
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <textarea
                      ref={textareaRef}
                      value={inputValue}
                      onChange={handleInputChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Ask me about marketing dates, content ideas, campaign planning..."
                      rows={1}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none"
                      style={{ minHeight: '42px', maxHeight: '120px' }}
                    />
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || chatLoading}
                    className="p-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors flex-shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                  <button
                    onClick={clearChat}
                    className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
                    title="Clear chat"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Generate Tab */}
          {activeTab === 'generate' && (
            <div className="h-full overflow-y-auto p-6 space-y-6">
              <ContentGeneratorPanel onGenerate={handleGenerate} generating={generating} />
              {generatedContent && <GeneratedContentDisplay content={generatedContent} />}
            </div>
          )}

          {/* Key Dates Tab */}
          {activeTab === 'dates' && (
            <div className="h-full overflow-y-auto p-6">
              <KeyDatesPanel
                dates={keyDates}
                loading={datesLoading}
                onDiscover={handleDiscoverDates}
                onAcknowledge={acknowledgeDt}
                onDelete={removeDt}
              />
            </div>
          )}

          {/* Strategy Tab */}
          {activeTab === 'strategy' && (
            <div className="h-full overflow-y-auto p-6">
              <StrategySetupPanel
                context={strategyContext}
                onChange={setStrategyContext}
              />
            </div>
          )}
        </div>

        {/* Error Banner */}
        {error && !dismissedError && (
          <div className="px-6 pb-2">
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700 flex items-center justify-between">
              <span>{error.message}</span>
              <button
                onClick={() => setDismissedError(true)}
                className="text-red-500 hover:text-red-700 ml-3 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
