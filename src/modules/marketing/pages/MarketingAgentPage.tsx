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
  Megaphone,
  ArrowRight,
  CalendarDays,
  Users,
  Lightbulb,
  Hash,
  ChevronRight,
  Upload,
  FileText,
  Brain,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMarketingAgent } from '../hooks';
import type { StrategyAnalysisResult } from '../services/marketingAgentService';
import type {
  AgentMessage,
  ContentGenerationRequest,
  ContentTone,
  GeneratedContent,
  MarketingKeyDate,
  MarketingDateCategory,
  CampaignProposal,
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
// Campaign Proposals Panel
// ============================================

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-green-100 text-green-700',
};

const CAMPAIGN_TYPE_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  social_media: 'Social Media',
  product_promotion: 'Product Promotion',
  hybrid: 'Hybrid',
};

function CampaignProposalsPanel({
  proposals,
  loading,
  onPropose,
  keyDatesCount,
  hasStrategy,
}: {
  proposals: CampaignProposal[];
  loading: boolean;
  onPropose: () => void;
  keyDatesCount: number;
  hasStrategy: boolean;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-orange-500" />
              AI Campaign Proposals
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Generate draft campaign ideas based on your strategy and upcoming key dates.
            </p>
          </div>
          <button
            onClick={onPropose}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Propose Campaigns
              </>
            )}
          </button>
        </div>

        {/* Context indicators */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
          <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
            hasStrategy ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            <Target className="h-3 w-3" />
            {hasStrategy ? 'Strategy set' : 'No strategy'}
          </span>
          <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
            keyDatesCount > 0 ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'
          }`}>
            <Calendar className="h-3 w-3" />
            {keyDatesCount} key date{keyDatesCount !== 1 ? 's' : ''}
          </span>
          {!hasStrategy && (
            <span className="text-xs text-gray-400">
              Set up your strategy for better proposals
            </span>
          )}
        </div>
      </div>

      {/* Proposals */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <RefreshCw className="h-8 w-8 text-orange-400 animate-spin mb-3" />
          <p className="text-sm text-gray-600">Analyzing strategy & key dates...</p>
          <p className="text-xs text-gray-400 mt-1">Generating campaign proposals with AI</p>
        </div>
      ) : proposals.length === 0 ? (
        <div className="text-center py-16">
          <Megaphone className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No campaign proposals yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Click "Propose Campaigns" to get AI-generated campaign ideas
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => {
            const isExpanded = expandedId === proposal.id;
            return (
              <div
                key={proposal.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-shadow hover:shadow-sm"
              >
                {/* Proposal header */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : proposal.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-gray-900">{proposal.name}</h4>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[proposal.priority]}`}>
                          {proposal.priority}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {CAMPAIGN_TYPE_LABELS[proposal.campaignType] || proposal.campaignType}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{proposal.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {proposal.suggestedStartDate} → {proposal.suggestedEndDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {proposal.durationDays}d
                        </span>
                        {proposal.linkedKeyDateName && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <Calendar className="h-3 w-3" />
                            {proposal.linkedKeyDateName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-3">
                      {/* Strategy alignment */}
                      <div className="text-center">
                        <div className={`text-lg font-bold ${
                          proposal.strategyAlignmentScore >= 80 ? 'text-green-600' :
                          proposal.strategyAlignmentScore >= 60 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {proposal.strategyAlignmentScore}
                        </div>
                        <div className="text-[9px] text-gray-400 uppercase tracking-wide">Alignment</div>
                      </div>
                      <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50/50">
                    {/* Objective & Audience */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1">
                          <Target className="h-3 w-3" /> Objective
                        </div>
                        <p className="text-xs text-gray-600">{proposal.objective}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1">
                          <Users className="h-3 w-3" /> Target Audience
                        </div>
                        <p className="text-xs text-gray-600">{proposal.targetAudience}</p>
                      </div>
                    </div>

                    {/* Channels */}
                    <div>
                      <div className="text-xs font-medium text-gray-700 mb-1.5">Channels</div>
                      <div className="flex gap-1.5 flex-wrap">
                        {proposal.channels.map((ch) => (
                          <span key={ch} className="px-2 py-0.5 text-[10px] rounded-full bg-blue-50 text-blue-700 capitalize">
                            {ch}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Content Ideas */}
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1.5">
                        <Lightbulb className="h-3 w-3" /> Content Ideas ({proposal.suggestedPosts} posts)
                      </div>
                      <ul className="space-y-1">
                        {proposal.contentIdeas.map((idea, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                            <span className="text-gray-400 mt-0.5">•</span>
                            {idea}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Key Messages */}
                    <div>
                      <div className="text-xs font-medium text-gray-700 mb-1.5">Key Messages</div>
                      <div className="space-y-1">
                        {proposal.keyMessages.map((msg, i) => (
                          <div key={i} className="text-xs text-gray-600 bg-white rounded px-2.5 py-1.5 border border-gray-100">
                            "{msg}"
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CTA & Hashtags */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs font-medium text-gray-700 mb-1">Call to Action</div>
                        <p className="text-xs text-gray-600 italic">"{proposal.callToAction}"</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-xs font-medium text-gray-700 mb-1">
                          <Hash className="h-3 w-3" /> Hashtags
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {proposal.hashtags.map((tag) => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Goals */}
                    <div>
                      <div className="text-xs font-medium text-gray-700 mb-1.5">Goals</div>
                      <ul className="space-y-1">
                        {proposal.goals.map((goal, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                            <Check className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                            {goal}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* AI Reasoning */}
                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-purple-800 mb-1">
                        <Bot className="h-3 w-3" /> AI Reasoning
                      </div>
                      <p className="text-xs text-purple-700">{proposal.reasoning}</p>
                    </div>

                    {/* Action: Create Campaign */}
                    <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
                      {proposal.estimatedBudget && (
                        <span className="text-xs text-gray-500">
                          Est. budget: {proposal.estimatedBudget}
                        </span>
                      )}
                      <Link
                        to={`/marketing/campaigns/new?name=${encodeURIComponent(proposal.name)}&type=${proposal.campaignType}&description=${encodeURIComponent(proposal.description)}${proposal.linkedKeyDateId ? `&keyDateId=${proposal.linkedKeyDateId}` : ''}`}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity ml-auto"
                      >
                        <Megaphone className="h-4 w-4" />
                        Create Campaign
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Page
// ============================================

type ActiveTab = 'chat' | 'generate' | 'dates' | 'campaigns' | 'strategy';

// ============================================
// Strategy Setup Panel (with Document Upload)
// ============================================

const ACCEPTED_FILE_TYPES = '.pdf,.txt,.md,.csv,.doc,.docx,.png,.jpg,.jpeg,.webp';

function StrategySetupPanel({
  context,
  onChange,
  onAnalyzeFile,
  analysis,
  analyzing,
}: {
  context: Record<string, any>;
  onChange: (ctx: Record<string, any>) => void;
  onAnalyzeFile: (file: File) => Promise<StrategyAnalysisResult | null>;
  analysis: StrategyAnalysisResult | null;
  analyzing: boolean;
}) {
  const [brandVoice, setBrandVoice] = useState(context.brandVoice || '');
  const [targetMarket, setTargetMarket] = useState(context.targetMarket || '');
  const [businessGoals, setBusinessGoals] = useState((context.businessGoals || []).join(', '));
  const [contentPillars, setContentPillars] = useState((context.contentPillars || []).join(', '));
  const [productFocus, setProductFocus] = useState((context.productFocus || []).join(', '));
  const [uniqueSellingPoints, setUniqueSellingPoints] = useState((context.uniqueSellingPoints || []).join(', '));
  const [saved, setSaved] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [showInsights, setShowInsights] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync fields when context changes (e.g. after AI analysis populates them)
  useEffect(() => {
    setBrandVoice(context.brandVoice || '');
    setTargetMarket(context.targetMarket || '');
    setBusinessGoals((context.businessGoals || []).join(', '));
    setContentPillars((context.contentPillars || []).join(', '));
    setProductFocus((context.productFocus || []).join(', '));
    setUniqueSellingPoints((context.uniqueSellingPoints || []).join(', '));
  }, [context]);

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

  const handleFileUpload = async (file: File) => {
    setUploadedFileName(file.name);
    await onAnalyzeFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Brain className="h-4 w-4 text-purple-500" />
          Upload Marketing Strategy
        </h3>
        <p className="text-xs text-gray-500">
          Upload your marketing strategy document and Gemini Deep Think will analyze it to extract your full strategy context automatically.
        </p>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-purple-400 bg-purple-50'
              : analyzing
              ? 'border-purple-300 bg-purple-50/50'
              : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FILE_TYPES}
            onChange={handleFileChange}
            className="hidden"
          />

          {analyzing ? (
            <div className="space-y-3">
              <div className="flex justify-center">
                <div className="relative">
                  <Brain className="h-10 w-10 text-purple-400" />
                  <RefreshCw className="h-5 w-5 text-purple-600 animate-spin absolute -bottom-1 -right-1" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-purple-700">Deep Think Analysis in Progress</p>
                <p className="text-xs text-purple-500 mt-1">
                  Gemini is carefully analyzing your strategy document...
                </p>
              </div>
              <div className="flex justify-center gap-1">
                <div className="h-1.5 w-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="h-1.5 w-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="h-1.5 w-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          ) : uploadedFileName ? (
            <div className="space-y-2">
              <FileText className="h-8 w-8 text-green-500 mx-auto" />
              <p className="text-sm font-medium text-gray-700">{uploadedFileName}</p>
              <p className="text-xs text-gray-400">Click or drop to upload a different file</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 text-gray-300 mx-auto" />
              <p className="text-sm font-medium text-gray-600">Drop your strategy document here</p>
              <p className="text-xs text-gray-400">
                Supports PDF, TXT, DOC, DOCX, images, Markdown, CSV
              </p>
            </div>
          )}
        </div>

        {/* File type badges */}
        <div className="flex gap-1.5 flex-wrap">
          {['PDF', 'DOCX', 'TXT', 'PNG/JPG', 'MD'].map((ext) => (
            <span key={ext} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">{ext}</span>
          ))}
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="bg-white rounded-xl border border-purple-200 overflow-hidden">
          {/* Analysis header */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600" />
                <h3 className="text-sm font-semibold text-purple-900">Deep Think Analysis</h3>
                <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                  {analysis.documentType}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`text-sm font-bold ${
                  analysis.confidence >= 80 ? 'text-green-600' :
                  analysis.confidence >= 60 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {analysis.confidence}% confidence
                </div>
                <button
                  onClick={() => setShowInsights(!showInsights)}
                  className="p-1 text-purple-500 hover:bg-purple-100 rounded"
                >
                  {showInsights ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {showInsights && (
            <div className="p-4 space-y-4">
              {/* Summary */}
              <div>
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Executive Summary</h4>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{analysis.summary}</p>
              </div>

              {/* Key Insights */}
              <div>
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Key Insights</h4>
                <div className="space-y-1.5">
                  {analysis.keyInsights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{insight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Thinking process (if available) */}
              {analysis.thinkingProcess && (
                <details className="group">
                  <summary className="cursor-pointer text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1">
                    <Brain className="h-3 w-3" />
                    View AI Thinking Process
                  </summary>
                  <div className="mt-2 p-3 bg-purple-50 rounded-lg text-xs text-purple-800 whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {analysis.thinkingProcess}
                  </div>
                </details>
              )}

              {/* Auto-fill confirmation */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-green-700">
                  <span className="font-medium">Strategy fields auto-populated below.</span> Review and edit the extracted values, then save to apply.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual / Auto-filled Fields */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-gray-500" />
          Strategy Context
          {analysis && (
            <span className="text-[10px] px-2 py-0.5 bg-green-50 text-green-700 rounded-full ml-auto">
              AI-populated
            </span>
          )}
        </h3>
        {!analysis && (
          <p className="text-xs text-gray-500">
            Define your business strategy manually, or upload a document above for automatic extraction.
          </p>
        )}

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

        {/* Extra fields from AI analysis */}
        {context.salesObjectives?.length > 0 && (
          <div>
            <label className="text-xs font-medium text-gray-600">Sales Objectives (from analysis)</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {context.salesObjectives.map((obj: string, i: number) => (
                <span key={i} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-lg">{obj}</span>
              ))}
            </div>
          </div>
        )}

        {context.marketingObjectives?.length > 0 && (
          <div>
            <label className="text-xs font-medium text-gray-600">Marketing Objectives (from analysis)</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {context.marketingObjectives.map((obj: string, i: number) => (
                <span key={i} className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-lg">{obj}</span>
              ))}
            </div>
          </div>
        )}

        {context.targetAudience?.length > 0 && (
          <div>
            <label className="text-xs font-medium text-gray-600">Target Audience Segments (from analysis)</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {context.targetAudience.map((seg: string, i: number) => (
                <span key={i} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-lg">{seg}</span>
              ))}
            </div>
          </div>
        )}

        {context.competitorInsights?.length > 0 && (
          <div>
            <label className="text-xs font-medium text-gray-600">Competitor Insights (from analysis)</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {context.competitorInsights.map((ins: string, i: number) => (
                <span key={i} className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded-lg">{ins}</span>
              ))}
            </div>
          </div>
        )}

        {context.industryTrends?.length > 0 && (
          <div>
            <label className="text-xs font-medium text-gray-600">Industry Trends (from analysis)</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {context.industryTrends.map((trend: string, i: number) => (
                <span key={i} className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg">{trend}</span>
              ))}
            </div>
          </div>
        )}

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
    campaignProposals,
    proposeDraftCampaigns,
    proposingCampaigns,
    strategyContext,
    setStrategyContext,
    analyzeStrategy,
    strategyAnalysis,
    analyzingStrategy,
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

  // Handle propose campaigns
  const handleProposeCampaigns = useCallback(async () => {
    await proposeDraftCampaigns();
  }, [proposeDraftCampaigns]);

  const tabs: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'generate', label: 'Generate', icon: Sparkles },
    { id: 'dates', label: 'Key Dates', icon: Calendar },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
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
                  {tab.id === 'campaigns' && campaignProposals.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-orange-100 text-orange-700 rounded-full font-semibold">
                      {campaignProposals.length}
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

          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <div className="h-full overflow-y-auto p-6">
              <CampaignProposalsPanel
                proposals={campaignProposals}
                loading={proposingCampaigns}
                onPropose={handleProposeCampaigns}
                keyDatesCount={keyDates.length}
                hasStrategy={!!(strategyContext.brandVoice || strategyContext.businessGoals?.length)}
              />
            </div>
          )}

          {/* Strategy Tab */}
          {activeTab === 'strategy' && (
            <div className="h-full overflow-y-auto p-6">
              <StrategySetupPanel
                context={strategyContext}
                onChange={setStrategyContext}
                onAnalyzeFile={analyzeStrategy}
                analysis={strategyAnalysis}
                analyzing={analyzingStrategy}
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
