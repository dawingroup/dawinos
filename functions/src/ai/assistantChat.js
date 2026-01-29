/**
 * AI Assistant Chat - DawinOS v2.0
 * Cloud Function to power the Intelligence Layer AI assistant
 * Uses Gemini 1.5 Flash for conversational AI responses
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Secrets
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

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

    const { message, mode, conversationHistory } = request.data;

    if (!message || typeof message !== 'string') {
      throw new HttpsError('invalid-argument', 'Message is required and must be a string');
    }

    const assistantMode = mode || 'general';
    const systemPrompt = SYSTEM_PROMPTS[assistantMode] || SYSTEM_PROMPTS.general;

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
      const history = (conversationHistory || [])
        .filter((m) => m.content && m.role)
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
