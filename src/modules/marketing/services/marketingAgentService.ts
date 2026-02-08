/**
 * Marketing AI Agent Service
 * AI-powered marketing assistant using Gemini SDK directly
 * Supports: key date identification, strategy-aligned post drafting, campaign planning
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/shared/services/firebase/firestore';
import type {
  MarketingKeyDate,
  StrategyContext,
  ContentGenerationRequest,
  GeneratedContent,
  AgentMessage,
  MarketingAgentConfig,
  MarketingDateCategory,
  ContentTone,
  PlatformContentVariant,
  StrategyAlignmentScore,
} from '../types';
import {
  KEY_DATES_COLLECTION,
  AGENT_CONFIG_COLLECTION,
  PLATFORM_CHARACTER_LIMITS,
} from '../types/marketing-agent.types';

// ============================================
// Gemini AI Setup
// ============================================

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

function getModel() {
  if (!genAI) throw new Error('Gemini API key not configured');
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
}

/**
 * Safely parse JSON from Gemini response, stripping markdown fences
 */
function parseJSONResponse<T>(text: string): T {
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  return JSON.parse(cleaned) as T;
}

// ============================================
// Content Generation
// ============================================

/**
 * Generate marketing content using Gemini AI
 */
export async function generateContent(
  request: ContentGenerationRequest,
  _companyId: string
): Promise<GeneratedContent> {
  try {
    const model = getModel();

    const strategyInfo = request.strategyContext
      ? `\nStrategy context:\n- Brand voice: ${request.strategyContext.brandVoice || 'not set'}\n- Target market: ${request.strategyContext.targetMarket || 'not set'}\n- Business goals: ${(request.strategyContext.businessGoals || []).join(', ') || 'not set'}\n- Content pillars: ${(request.strategyContext.contentPillars || []).join(', ') || 'not set'}\n- Product focus: ${(request.strategyContext.productFocus || []).join(', ') || 'not set'}\n- USPs: ${(request.strategyContext.uniqueSellingPoints || []).join(', ') || 'not set'}`
      : '';

    const prompt = `You are a marketing content creator for Dawin Group, an interior design and building finishes company in East Africa.

Generate a social media post with the following requirements:
- Topic: ${request.topic}
- Tone: ${request.tone}
- Platforms: ${request.platforms.join(', ')}
- Length: ${request.length}
- Include hashtags: ${request.includeHashtags}
- Include call to action: ${request.includeCallToAction}
${strategyInfo}

Respond in JSON format (no markdown fences):
{
  "content": "main post content",
  "headline": "optional attention-grabbing headline",
  "callToAction": "optional CTA text",
  "hashtags": ["hashtag1", "hashtag2"],
  "platformVariants": [
    {"platform": "instagram", "content": "platform-optimized version"}
  ],
  "strategyAlignment": {
    "overall": 85,
    "brandVoice": 80,
    "targetAudience": 90,
    "businessGoals": 85,
    "contentPillars": 80,
    "notes": ["alignment note"]
  }
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const data = parseJSONResponse<{
      content: string;
      headline?: string;
      callToAction?: string;
      hashtags: string[];
      platformVariants?: Array<{ platform: string; content: string; hashtags?: string[] }>;
      strategyAlignment?: StrategyAlignmentScore;
    }>(text);

    // Build platform variants
    const platformVariants: PlatformContentVariant[] = (data.platformVariants || []).map((v) => ({
      platform: v.platform as any,
      content: v.content,
      hashtags: v.hashtags || data.hashtags,
      characterCount: v.content.length,
      withinLimit: v.content.length <= (PLATFORM_CHARACTER_LIMITS[v.platform as keyof typeof PLATFORM_CHARACTER_LIMITS] || 5000),
    }));

    // If no platform variants from AI, create from main content
    if (platformVariants.length === 0 && request.platforms.length > 0) {
      for (const platform of request.platforms) {
        const charLimit = PLATFORM_CHARACTER_LIMITS[platform];
        const truncated = data.content.length > charLimit
          ? data.content.slice(0, charLimit - 3) + '...'
          : data.content;
        platformVariants.push({
          platform,
          content: truncated,
          hashtags: data.hashtags,
          characterCount: truncated.length,
          withinLimit: truncated.length <= charLimit,
        });
      }
    }

    const strategyAlignment: StrategyAlignmentScore = data.strategyAlignment || {
      overall: 75,
      brandVoice: 75,
      targetAudience: 75,
      businessGoals: 75,
      contentPillars: 75,
      notes: [],
    };

    return {
      id: crypto.randomUUID(),
      requestId: crypto.randomUUID(),
      content: data.content,
      headline: data.headline,
      callToAction: data.callToAction,
      hashtags: data.hashtags || [],
      suggestedMediaDescription: undefined,
      platformVariants,
      tone: request.tone,
      strategyAlignment,
      generatedAt: Timestamp.now(),
      model: 'gemini-1.5-flash',
      confidence: 0.85,
    };
  } catch (error) {
    console.warn('Gemini content generation failed, using local fallback:', error);
    return generateContentLocal(request);
  }
}

/**
 * Local fallback content generation (template-based)
 */
function generateContentLocal(request: ContentGenerationRequest): GeneratedContent {
  const { topic, tone, platforms, includeHashtags, includeCallToAction } = request;

  const toneMap: Record<ContentTone, string> = {
    professional: `We're excited to share our latest update on ${topic}. Our commitment to excellence drives everything we do.`,
    casual: `Hey everyone! 👋 Let's talk about ${topic}. We've got some exciting things to share!`,
    inspirational: `Transform your space with ${topic}. Every great project starts with a single step.`,
    educational: `Did you know? Here's what you need to know about ${topic}. Let's break it down.`,
    promotional: `🔥 Special offer on ${topic}! Don't miss out on this incredible opportunity.`,
    storytelling: `Every great design tells a story. Today, we're sharing our journey with ${topic}.`,
  };

  let content = toneMap[tone] || toneMap.professional;

  const hashtags = includeHashtags
    ? [`#${topic.replace(/\s+/g, '')}`, '#DawinFinishes', '#InteriorDesign', '#QualityCraftsmanship']
    : [];

  if (includeCallToAction) {
    content += '\n\nGet in touch today to learn more! 📞';
  }

  if (includeHashtags && hashtags.length > 0) {
    content += '\n\n' + hashtags.join(' ');
  }

  const platformVariants: PlatformContentVariant[] = platforms.map((platform) => {
    const charLimit = PLATFORM_CHARACTER_LIMITS[platform];
    const truncated = content.length > charLimit
      ? content.slice(0, charLimit - 3) + '...'
      : content;
    return {
      platform,
      content: truncated,
      hashtags,
      characterCount: truncated.length,
      withinLimit: truncated.length <= charLimit,
    };
  });

  return {
    id: crypto.randomUUID(),
    requestId: crypto.randomUUID(),
    content,
    hashtags,
    callToAction: includeCallToAction ? 'Get in touch today to learn more!' : undefined,
    platformVariants,
    tone,
    strategyAlignment: {
      overall: 70,
      brandVoice: 70,
      targetAudience: 65,
      businessGoals: 60,
      contentPillars: 75,
      notes: ['Generated using local template - connect AI for better results'],
    },
    generatedAt: Timestamp.now(),
    model: 'local-template',
    confidence: 0.6,
  };
}

// ============================================
// Key Marketing Dates
// ============================================

/**
 * Discover key marketing dates using Gemini AI with Google Search grounding.
 * Searches the internet for real conventions, expos, trade shows, and events
 * especially in Uganda and East Africa relevant to the building/design industry.
 */
export async function discoverKeyDates(
  companyId: string,
  options: {
    region?: string;
    country?: string;
    industry?: string;
    dateRange?: { from: Date; to: Date };
    strategyContext?: Partial<StrategyContext>;
  }
): Promise<MarketingKeyDate[]> {
  try {
    if (!genAI) throw new Error('Gemini API key not configured');

    // Use a model instance with Google Search grounding enabled
    const searchModel = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      tools: [{ googleSearchRetrieval: {} }],
    });

    const now = new Date();
    const year = now.getFullYear();
    const country = options.country || 'Uganda';
    const region = options.region || 'East Africa';
    const industry = options.industry || 'interior design, building finishes, construction, and architecture';

    const prompt = `Search the internet for upcoming events, conventions, trade shows, expos, conferences, and important dates in ${country} and ${region} that are relevant to a company in the ${industry} industry.

Specifically search for:
1. **Construction & building expos** in ${country} (e.g. Buildexpo Africa, Uganda Construction Expo)
2. **Interior design & architecture events** in ${region}
3. **Trade shows & conventions** for tiles, marble, granite, building materials in Africa
4. **Property & real estate expos** in ${country}
5. **National holidays & cultural events** in ${country} that create marketing opportunities
6. **International design events** relevant to East African markets (e.g. Dubai Design Week, 100% Design South Africa)
7. **Business & entrepreneurship events** in ${country} (e.g. Kampala Business Expo)
8. **Seasonal marketing opportunities** (e.g. festive season, back-to-school renovations, rainy season prep)

Today's date is ${now.toISOString().slice(0, 10)}. Find events for the next 12 months (${year}-${year + 1}).
Use ACTUAL dates from the internet. If exact dates are not yet announced, provide the typical month and estimated dates.

Respond ONLY with JSON (no markdown fences, no extra text):
{
  "dates": [
    {
      "name": "Event Name",
      "description": "What this event is about and why it matters for an interior design & building finishes company",
      "date": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD or null",
      "category": "holiday|industry_event|seasonal|company_milestone|product_launch|cultural|sales_event|custom",
      "relevanceScore": 85,
      "suggestedActions": ["action 1", "action 2"],
      "suggestedContentThemes": ["theme 1", "theme 2"],
      "leadTimeDays": 21,
      "region": "${region}",
      "source_url": "URL where this event info was found, or null"
    }
  ]
}

Include 12-20 dates, prioritizing real events found online. Sort by date ascending.`;

    const result = await searchModel.generateContent(prompt);
    const text = result.response.text();
    const data = parseJSONResponse<{
      dates: Array<{
        name: string;
        description: string;
        date: string;
        endDate?: string | null;
        category: MarketingDateCategory;
        relevanceScore: number;
        suggestedActions: string[];
        suggestedContentThemes: string[];
        leadTimeDays: number;
        region?: string;
        source_url?: string | null;
      }>;
    }>(text);

    const dates: MarketingKeyDate[] = (data.dates || []).map((d) => ({
      id: crypto.randomUUID(),
      companyId,
      name: d.name,
      description: d.description + (d.source_url ? `\n\nSource: ${d.source_url}` : ''),
      date: Timestamp.fromDate(new Date(d.date)),
      endDate: d.endDate ? Timestamp.fromDate(new Date(d.endDate)) : undefined,
      isRecurring: true,
      category: d.category,
      relevanceScore: d.relevanceScore,
      region: d.region || options.region,
      suggestedActions: d.suggestedActions || [],
      suggestedContentThemes: d.suggestedContentThemes || [],
      leadTimeDays: d.leadTimeDays || 14,
      acknowledged: false,
      contentPlanned: false,
      linkedCampaignIds: [],
      linkedPostIds: [],
      source: 'ai_generated' as const,
      aiConfidence: 0.9,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }));

    return dates;
  } catch (error) {
    console.warn('Gemini search-grounded key date discovery failed, using built-in dates:', error);
    return getBuiltInKeyDates(companyId, options.region || 'global');
  }
}

/**
 * Built-in key marketing dates fallback
 */
function getBuiltInKeyDates(companyId: string, region: string): MarketingKeyDate[] {
  const year = new Date().getFullYear();

  const builtInDates = [
    { name: 'New Year', date: `${year}-01-01`, category: 'holiday' as const, description: 'New Year celebrations - fresh starts and resolutions', themes: ['new beginnings', 'fresh look', 'home refresh'], actions: ['Plan NY sale campaign', 'Create themed social content'], lead: 14 },
    { name: "Valentine's Day", date: `${year}-02-14`, category: 'holiday' as const, description: 'Romantic season - gift-giving and home beautification', themes: ['love', 'couples', 'gift ideas', 'romance'], actions: ['Launch gift guide', 'Partner promotions'], lead: 21 },
    { name: "Mother's Day", date: `${year}-05-11`, category: 'holiday' as const, description: 'Celebrate mothers - home improvement gifts', themes: ['mothers', 'gifts', 'home makeover'], actions: ['Gift campaign', 'Special offers'], lead: 21 },
    { name: 'Mid-Year Sale Season', date: `${year}-06-15`, endDate: `${year}-06-30`, category: 'sales_event' as const, description: 'Mid-year clearance and promotions', themes: ['savings', 'clearance', 'deals'], actions: ['Plan clearance campaign', 'Inventory review'], lead: 30 },
    { name: 'Back to School/Work Season', date: `${year}-09-01`, category: 'seasonal' as const, description: 'New season of productivity and projects', themes: ['productivity', 'new projects', 'workspace'], actions: ['Office/workspace campaigns'], lead: 21 },
    { name: 'Black Friday', date: `${year}-11-28`, category: 'sales_event' as const, description: 'Major retail sales event', themes: ['deals', 'discounts', 'shopping'], actions: ['Plan biggest sale of year', 'Email campaign'], lead: 45 },
    { name: 'End of Year Campaign', date: `${year}-12-15`, endDate: `${year}-12-31`, category: 'sales_event' as const, description: 'Year-end wrap-up and holiday season', themes: ['holidays', 'year in review', 'celebrations'], actions: ['Year-end sale', 'Thank you campaign'], lead: 30 },
    { name: 'World Design Day', date: `${year}-04-27`, category: 'industry_event' as const, description: 'Celebrate design excellence and innovation', themes: ['design', 'creativity', 'innovation'], actions: ['Showcase portfolio', 'Design tips series'], lead: 14 },
    { name: 'World Architecture Day', date: `${year}-10-07`, category: 'industry_event' as const, description: 'Architecture and built environment celebration', themes: ['architecture', 'building', 'space'], actions: ['Feature architectural projects', 'Partner content'], lead: 14 },
  ];

  return builtInDates.map((d) => ({
    id: crypto.randomUUID(),
    companyId,
    name: d.name,
    description: d.description,
    date: Timestamp.fromDate(new Date(d.date)),
    endDate: d.endDate ? Timestamp.fromDate(new Date(d.endDate)) : undefined,
    isRecurring: true,
    category: d.category,
    relevanceScore: 75,
    region,
    suggestedActions: d.actions,
    suggestedContentThemes: d.themes,
    leadTimeDays: d.lead,
    acknowledged: false,
    contentPlanned: false,
    linkedCampaignIds: [],
    linkedPostIds: [],
    source: 'system' as const,
    aiConfidence: 0.8,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }));
}

/**
 * Save key dates to Firestore
 */
export async function saveKeyDates(dates: MarketingKeyDate[]): Promise<void> {
  for (const date of dates) {
    const { id, ...data } = date;
    // Strip undefined values — Firestore rejects them
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    );
    await addDoc(collection(db, KEY_DATES_COLLECTION), {
      ...cleaned,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

/**
 * Get saved key dates
 */
export async function getKeyDates(
  companyId: string,
  options?: { from?: Date; to?: Date; category?: MarketingDateCategory }
): Promise<MarketingKeyDate[]> {
  const constraints: any[] = [where('companyId', '==', companyId)];

  if (options?.category) {
    constraints.push(where('category', '==', options.category));
  }

  constraints.push(orderBy('date', 'asc'));
  constraints.push(limit(100));

  const q = query(collection(db, KEY_DATES_COLLECTION), ...constraints);
  const snap = await getDocs(q);

  let dates = snap.docs.map((d) => ({ id: d.id, ...d.data() } as MarketingKeyDate));

  // Client-side date range filter
  if (options?.from || options?.to) {
    dates = dates.filter((d) => {
      const dateMs = d.date.toMillis();
      if (options.from && dateMs < options.from.getTime()) return false;
      if (options.to && dateMs > options.to.getTime()) return false;
      return true;
    });
  }

  return dates;
}

/**
 * Acknowledge a key date
 */
export async function acknowledgeKeyDate(dateId: string): Promise<void> {
  await updateDoc(doc(db, KEY_DATES_COLLECTION, dateId), {
    acknowledged: true,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a key date
 */
export async function deleteKeyDate(dateId: string): Promise<void> {
  await deleteDoc(doc(db, KEY_DATES_COLLECTION, dateId));
}

// ============================================
// Agent Chat
// ============================================

/**
 * Send a message to the marketing AI agent via Gemini
 */
export async function chatWithAgent(
  message: string,
  _companyId: string,
  strategyContext?: Partial<StrategyContext>,
  conversationHistory: AgentMessage[] = []
): Promise<AgentMessage> {
  try {
    const model = getModel();

    const history = conversationHistory
      .filter((m) => m.role !== 'system')
      .slice(-10)
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

    const strategyInfo = strategyContext && Object.keys(strategyContext).length > 0
      ? `\nBusiness context:\n- Brand voice: ${strategyContext.brandVoice || 'professional'}\n- Target market: ${strategyContext.targetMarket || 'homeowners and designers in East Africa'}\n- Goals: ${(strategyContext.businessGoals || []).join(', ') || 'grow brand awareness'}\n- Content pillars: ${(strategyContext.contentPillars || []).join(', ') || 'design inspiration, product quality'}\n- Products: ${(strategyContext.productFocus || []).join(', ') || 'tiles, marble, finishes'}`
      : '';

    const prompt = `You are a marketing AI assistant for Dawin Group, an interior design and building finishes company in East Africa (Uganda).
You help with: content creation, campaign planning, key marketing dates, hashtag strategy, and marketing analytics.
${strategyInfo}

${history ? `Previous conversation:\n${history}\n\n` : ''}User: ${message}

Respond naturally and helpfully. Use **bold** for emphasis. Use bullet points with - for lists. Be specific and actionable. Keep responses concise but valuable.`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: reply,
      timestamp: new Date(),
    };
  } catch (error) {
    console.warn('Gemini chat failed, using local response:', error);
    return generateLocalAgentResponse(message);
  }
}

/**
 * Local fallback for agent chat — rich, context-aware responses
 */
function generateLocalAgentResponse(message: string): AgentMessage {
  const lowerMessage = message.toLowerCase();

  let reply: string;
  let action: AgentMessage['action'];

  // Key dates & calendar
  if (lowerMessage.includes('date') || lowerMessage.includes('calendar') || lowerMessage.includes('upcoming') || lowerMessage.includes('holiday')) {
    const now = new Date();
    const month = now.getMonth();
    const nextDates = getNextKeyDatesForMonth(month);

    reply = "Here are the key marketing dates coming up:\n\n" +
      nextDates.map((d) => `📅 **${d.name}** — ${d.tip}`).join('\n') +
      "\n\nSwitch to the **Key Dates** tab and click **Discover Dates** to get a full calendar with suggested actions and lead times for each date.";
    action = 'suggest_dates';

  // Content creation
  } else if (lowerMessage.includes('post') || lowerMessage.includes('content') || lowerMessage.includes('write') || lowerMessage.includes('draft') || lowerMessage.includes('caption')) {
    // Try to extract topic from the message
    const topicMatch = lowerMessage.match(/(?:about|on|for|regarding)\s+(.+?)(?:\?|$|\.)/);
    const topic = topicMatch ? topicMatch[1].trim() : null;

    if (topic) {
      reply = `Great topic! Here's a quick draft for **${topic}**:\n\n` +
        `✨ "${getQuickDraft(topic)}"\n\n` +
        "For a full post with hashtags, platform variants, and strategy alignment scores, head to the **Generate** tab and enter your topic there.";
    } else {
      reply = "I'd love to help you create content! Here are some hot topics for the interior design & finishes industry:\n\n" +
        "- **Before & After** transformations — always high engagement\n" +
        "- **Material spotlight** — showcase a specific marble or tile\n" +
        "- **Design tips** — practical advice your audience will save & share\n" +
        "- **Behind the scenes** — your showroom, sourcing trips, installations\n" +
        "- **Customer stories** — real projects with testimonials\n\n" +
        "Tell me what you'd like to write about, or use the **Generate** tab for AI-powered content!";
    }
    action = 'generate_post';

  // Campaign planning
  } else if (lowerMessage.includes('campaign') || lowerMessage.includes('plan') || lowerMessage.includes('strategy') || lowerMessage.includes('launch')) {
    reply = "Here's a quick campaign planning framework:\n\n" +
      "1. **Goal** — What outcome do you want? (awareness, leads, sales)\n" +
      "2. **Audience** — Who specifically? (homeowners, architects, contractors)\n" +
      "3. **Channel mix** — WhatsApp for direct reach, Instagram for discovery, LinkedIn for B2B\n" +
      "4. **Timeline** — Align with an upcoming key date for natural relevance\n" +
      "5. **Content** — I can draft messages for each channel\n" +
      "6. **Budget** — Even a small boost on social can amplify reach 5-10x\n\n" +
      "What's your next campaign about? I can help you flesh out the details.";
    action = 'plan_campaign';

  // Hashtags
  } else if (lowerMessage.includes('hashtag') || lowerMessage.includes('#')) {
    reply = "Here's a recommended hashtag strategy organized by tier:\n\n" +
      "**Brand (always use):**\n#DawinFinishes #DawinGroup #QualityFinishes\n\n" +
      "**Industry (rotate 3-5 per post):**\n#InteriorDesign #HomeDecor #BuildingMaterials #LuxuryInteriors #TileDesign #MarbleFinish #NaturalStone\n\n" +
      "**Engagement (pick 2-3):**\n#DesignInspiration #HomeGoals #DreamHome #BeforeAndAfter #SpaceTransformation\n\n" +
      "**Location:**\n#KampalaDesign #UgandaInteriors #EastAfricaDesign\n\n" +
      "**Pro tip:** Use 8-15 hashtags on Instagram, 3-5 on LinkedIn, and 2-3 on Twitter. Put them at the end of your post, not in the middle.";
    action = 'generate_hashtags';

  // Performance & analytics
  } else if (lowerMessage.includes('performance') || lowerMessage.includes('analytics') || lowerMessage.includes('metric') || lowerMessage.includes('result') || lowerMessage.includes('roi')) {
    reply = "To review campaign performance, check the **Analytics** page. Here's what to focus on:\n\n" +
      "**WhatsApp campaigns:**\n" +
      "- Delivery rate (target: >95%)\n" +
      "- Read rate (target: >70%)\n" +
      "- Reply rate (good if >5%)\n\n" +
      "**Social media:**\n" +
      "- Engagement rate (good: >3% on Instagram, >1% on Facebook)\n" +
      "- Reach growth week-over-week\n" +
      "- Saves & shares (high-value engagement signals)\n\n" +
      "Want me to help you set specific goals for your next campaign?";
    action = 'analyze_performance';

  // Greeting
  } else if (lowerMessage.match(/^(hi|hello|hey|good\s*(morning|afternoon|evening))/)) {
    reply = "Hello! 👋 I'm ready to help with your marketing. What would you like to work on?\n\n" +
      "- **Write a post** — Tell me the topic\n" +
      "- **Plan a campaign** — Let's outline it together\n" +
      "- **Find key dates** — Discover upcoming opportunities\n" +
      "- **Get hashtags** — For any topic or platform\n\n" +
      "Or just ask me anything about marketing!";

  // Help / what can you do
  } else if (lowerMessage.includes('help') || lowerMessage.includes('what can you') || lowerMessage.includes('how do')) {
    reply = "Here's everything I can help with:\n\n" +
      "🗓️ **Key Dates** — Discover marketing dates, holidays, and industry events. I'll suggest lead times and content ideas.\n\n" +
      "✍️ **Content Creation** — Draft social posts, WhatsApp messages, and campaign briefs. I match your brand voice and strategy.\n\n" +
      "📊 **Campaign Planning** — Plan multi-channel campaigns with goals, timelines, and audience targeting.\n\n" +
      "#️⃣ **Hashtag Strategy** — Get optimized hashtag sets for each platform.\n\n" +
      "⚙️ **Strategy Setup** — Use the Strategy tab to set your brand voice, goals, and content pillars so I can align everything.\n\n" +
      "Just type naturally — I'll figure out how to help!";

  // Default / catch-all with a helpful nudge
  } else {
    reply = `Interesting question about "${message.slice(0, 60)}${message.length > 60 ? '...' : ''}". ` +
      "While I work best with specific marketing tasks, let me suggest some next steps:\n\n" +
      "- **Need content?** Tell me a topic and I'll draft a post\n" +
      "- **Planning ahead?** Ask about upcoming key marketing dates\n" +
      "- **Launching something?** Let's plan a campaign together\n\n" +
      "What would be most useful for you right now?";
  }

  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: reply,
    timestamp: new Date(),
    action,
  };
}

/**
 * Helper: get relevant upcoming dates for the current month
 */
function getNextKeyDatesForMonth(month: number): Array<{ name: string; tip: string }> {
  const allDates: Record<number, Array<{ name: string; tip: string }>> = {
    0: [{ name: 'New Year (Jan 1)', tip: 'New beginnings, fresh home looks, resolution-themed posts' }],
    1: [{ name: "Valentine's Day (Feb 14)", tip: 'Gift guides, couples spaces, romantic room makeovers' }],
    2: [{ name: "Int'l Women's Day (Mar 8)", tip: 'Feature women designers, celebrate women in construction' }],
    3: [{ name: 'World Design Day (Apr 27)', tip: 'Showcase portfolio, design tips series, industry thought leadership' }],
    4: [{ name: "Mother's Day (May 11)", tip: 'Home gift ideas, kitchen/bathroom makeovers for mom' }],
    5: [{ name: 'Mid-Year Sale (Jun 15-30)', tip: 'Clearance campaigns, project-start incentives' }],
    6: [{ name: 'Home Improvement Month', tip: 'DIY tips, transformation challenges, product spotlights' }],
    7: [{ name: 'Back to Work Season', tip: 'Office space design, commercial projects, workspace inspiration' }],
    8: [{ name: 'World Architecture Day (Oct 7)', tip: 'Collaborate with architects, showcase building projects' }],
    9: [{ name: 'Pre-Holiday Planning', tip: 'Early bird promotions, year-end project deadlines' }],
    10: [{ name: 'Black Friday (Nov 28)', tip: 'Biggest sale campaign, email + WhatsApp + social blitz' }],
    11: [{ name: 'Year-End Campaign (Dec 15-31)', tip: 'Thank customers, year in review, holiday promotions' }],
  };
  const current = allDates[month] || [];
  const next = allDates[(month + 1) % 12] || [];
  return [...current, ...next].slice(0, 3);
}

/**
 * Helper: generate a quick draft snippet for a topic
 */
function getQuickDraft(topic: string): string {
  const templates = [
    `Elevate your space with ${topic}. At Dawin Finishes, we believe every surface tells a story — let us help you write yours.`,
    `Looking for ${topic}? Our curated collection brings world-class quality to East Africa. Visit our showroom to see and feel the difference.`,
    `Transform your project with premium ${topic}. From selection to installation, our team ensures perfection at every step.`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

// ============================================
// Agent Configuration
// ============================================

/**
 * Get or create the agent configuration for a company
 */
export async function getAgentConfig(companyId: string): Promise<MarketingAgentConfig | null> {
  const q = query(
    collection(db, AGENT_CONFIG_COLLECTION),
    where('companyId', '==', companyId),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { ...snap.docs[0].data() } as MarketingAgentConfig;
}

/**
 * Save or update agent configuration
 */
export async function saveAgentConfig(config: MarketingAgentConfig): Promise<void> {
  const q = query(
    collection(db, AGENT_CONFIG_COLLECTION),
    where('companyId', '==', config.companyId),
    limit(1)
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    await addDoc(collection(db, AGENT_CONFIG_COLLECTION), {
      ...config,
      updatedAt: serverTimestamp(),
    });
  } else {
    await updateDoc(doc(db, AGENT_CONFIG_COLLECTION, snap.docs[0].id), {
      ...config,
      updatedAt: serverTimestamp(),
    });
  }
}
