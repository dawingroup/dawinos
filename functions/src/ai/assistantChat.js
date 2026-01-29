/**
 * AI Assistant Chat - DawinOS v2.0
 * Cloud Function to power the Intelligence Layer AI assistant
 * Uses Gemini 1.5 Flash for conversational AI responses
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const admin = require('firebase-admin');

const db = admin.firestore();

// Secrets
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

// ============================================
// Input Sanitization & Rate Limiting
// ============================================

const MAX_MESSAGE_LENGTH = 4000;
const MAX_HISTORY_LENGTH = 20;
const MAX_HISTORY_ENTRY_LENGTH = 3000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

function sanitizeMessage(msg) {
  if (typeof msg !== 'string') return '';
  return msg.slice(0, MAX_MESSAGE_LENGTH).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-MAX_HISTORY_LENGTH)
    .filter(
      (m) =>
        m &&
        typeof m.content === 'string' &&
        ['user', 'assistant'].includes(m.role)
    )
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, MAX_HISTORY_ENTRY_LENGTH),
    }));
}

async function checkRateLimit(userId) {
  const rateLimitRef = db.collection('rateLimits').doc(userId);
  const now = Date.now();

  return db.runTransaction(async (transaction) => {
    const doc = await transaction.get(rateLimitRef);

    if (doc.exists) {
      const data = doc.data();
      if (now - data.windowStart < RATE_LIMIT_WINDOW_MS) {
        if (data.count >= MAX_REQUESTS_PER_WINDOW) {
          throw new HttpsError(
            'resource-exhausted',
            'Too many requests. Please wait before trying again.'
          );
        }
        transaction.update(rateLimitRef, {
          count: admin.firestore.FieldValue.increment(1),
        });
      } else {
        transaction.set(rateLimitRef, { windowStart: now, count: 1 });
      }
    } else {
      transaction.set(rateLimitRef, { windowStart: now, count: 1 });
    }
  });
}

// ============================================
// System Prompts by Mode
// ============================================

const SYSTEM_PROMPTS = {
  general: `You are DawinOS Assistant, an AI helper for Dawin Group — a custom millwork and furniture manufacturing company in East Africa.
You help employees navigate the DawinOS platform, answer questions about workflows, and provide general business guidance.
Keep responses concise, professional, and actionable. If you don't know something specific about the company's data, say so honestly.
Focus on being helpful with: task management, design workflow questions, project status, and general business operations.`,

  data_analyst: `You are DawinOS Data Analyst, specialized in analyzing business metrics for Dawin Group.
You help interpret data trends, identify patterns, and provide data-driven recommendations.
When analyzing, consider: production efficiency, project timelines, resource utilization, financial metrics, and quality indicators.
Present insights clearly with specific numbers when possible. Suggest actionable next steps based on the data.`,

  strategic_advisor: `You are DawinOS Strategic Advisor for Dawin Group, a custom millwork and furniture manufacturing company in East Africa.
You provide strategic guidance on: market positioning, operational efficiency, growth opportunities, competitive analysis, and long-term planning.
Consider the East African market context, manufacturing industry trends, and the company's focus on custom millwork.
Give balanced perspectives with clear pros and cons for any strategic recommendation.`,

  document_expert: `You are DawinOS Document Expert, specialized in document review and creation for Dawin Group.
You help with: design documentation, technical specifications, project proposals, reports, and process documentation.
Focus on clarity, completeness, and adherence to industry standards for furniture manufacturing.
Provide specific suggestions for improvement and flag any missing critical information.`,
};

// ============================================
// Cloud Function
// ============================================

const assistantChat = onCall(
  {
    secrets: [GEMINI_API_KEY],
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 30,
  },
  async (request) => {
    // Validate authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Rate limiting
    await checkRateLimit(request.auth.uid);

    // Input sanitization
    const VALID_MODES = Object.keys(SYSTEM_PROMPTS);
    const message = sanitizeMessage(request.data.message);
    const conversationHistory = sanitizeHistory(request.data.conversationHistory);

    if (!message) {
      throw new HttpsError('invalid-argument', 'Message is required and must be a non-empty string');
    }

    const assistantMode = VALID_MODES.includes(request.data.mode)
      ? request.data.mode
      : 'general';
    const systemPrompt = SYSTEM_PROMPTS[assistantMode];

    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
        },
      });

      // Build conversation history for context
      const history = conversationHistory
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

      const chat = model.startChat({
        history,
        systemInstruction: systemPrompt,
      });

      const result = await chat.sendMessage(message);
      const responseText = result.response.text();

      return {
        response: responseText,
        mode: assistantMode,
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new HttpsError(
        'internal',
        'Failed to generate AI response. Please try again.'
      );
    }
  }
);

module.exports = { assistantChat };
