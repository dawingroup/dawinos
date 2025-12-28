/**
 * Enhanced Design Chat Cloud Function
 * 
 * Provides conversational AI assistance for furniture/millwork design.
 * Builds on existing handleDesignChat implementation with:
 * - Structured request/response interfaces
 * - Enhanced image analysis
 * - Feature Library integration
 * - Conversation persistence
 * 
 * This module can be used alongside the existing /ai/design-chat endpoint
 * or as a replacement via onCall for Firebase SDK clients.
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const admin = require('firebase-admin');

// Initialize if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Secrets
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

// Import utilities
const { getCacheManager } = require('../utils/cacheManager');
const { checkRateLimit } = require('../utils/rateLimiter');

// ============================================
// Type Definitions (for documentation)
// ============================================

/**
 * @typedef {Object} DesignChatRequest
 * @property {string} deliverableId - ID of the deliverable/design item
 * @property {string} [projectId] - Optional project ID for context
 * @property {string} message - User's message
 * @property {string} [imageBase64] - Base64 encoded image (without data URI prefix)
 * @property {'image/jpeg'|'image/png'|'image/webp'} [imageMimeType] - Image MIME type
 * @property {Array<{role: string, content: string}>} [conversationHistory] - Previous messages
 */

/**
 * @typedef {Object} DesignChatResponse
 * @property {string} message - AI response text
 * @property {Array<FeatureSuggestion>} [suggestedFeatures] - Matched features from library
 * @property {ImageAnalysisResult} [imageAnalysis] - Structured image analysis
 * @property {number} confidence - Response confidence (0-1)
 * @property {Object} usageMetadata - Token usage info
 */

/**
 * @typedef {Object} FeatureSuggestion
 * @property {string} featureId - ID from Feature Library
 * @property {string} featureName - Feature name
 * @property {'high'|'medium'|'low'} relevance - Relevance to query
 * @property {string} reason - Why this feature is suggested
 */

/**
 * @typedef {Object} ImageAnalysisResult
 * @property {string} style - Style classification
 * @property {Array<string>} materials - Detected materials
 * @property {Array<string>} features - Manufacturing features required
 * @property {number} complexity - Complexity score (1-10)
 * @property {Array<string>} colorPalette - Detected colors
 */

// ============================================
// Prompts
// ============================================

const DESIGN_CHAT_SYSTEM_PROMPT = `You are an expert furniture and millwork design consultant for Dawin Group, a custom manufacturing company in Uganda specializing in luxury hospitality, residential, and commercial projects.

CONTEXT:
- You assist designers in developing detailed specifications for custom furniture and millwork
- You have access to the Feature Library documenting all manufacturing capabilities
- Your recommendations should be practical given the shop's equipment and skills

RESPONSE FORMAT:
Always structure your responses to be helpful and actionable. When recommending features:
- Reference specific feature IDs and names from the Feature Library
- Explain why each feature is relevant
- Note any material or equipment constraints

When the user provides an image, analyze it thoroughly for style, materials, and manufacturing requirements.`;

const IMAGE_ANALYSIS_PROMPT = `Analyze this furniture/millwork image and extract the following in a structured format:

**STYLE CLASSIFICATION:**
Identify the primary style (modern, traditional, transitional, industrial, contemporary, rustic, etc.)

**MATERIALS DETECTED:**
List visible materials with specificity:
- Wood species (oak, walnut, maple, etc.) or type (plywood, MDF, solid wood)
- Finish type (lacquer, oil, stain, paint, natural)
- Hardware materials (brass, steel, bronze, etc.)
- Other materials (glass, stone, fabric, leather)

**MANUFACTURING FEATURES REQUIRED:**
List the manufacturing operations needed:
- Joinery types (mortise & tenon, dovetail, pocket holes, etc.)
- Edge treatments (banding, profiling, waterfall edges)
- Assembly methods (face frame, frameless, modular)
- Special techniques (veneering, inlay, carving)

**COMPLEXITY SCORE:** (1-10)
Rate the manufacturing complexity considering:
- Number of operations required
- Skill level needed
- Equipment requirements
- Tolerance requirements

**COLOR PALETTE:**
Extract dominant colors as hex codes if possible.

Match all findings to our Feature Library capabilities and suggest the most relevant features.`;

// ============================================
// Helper Functions
// ============================================

/**
 * Get Gemini model instance
 */
function getGeminiModel(apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      maxOutputTokens: 4096,
      temperature: 0.7,
    },
  });
}

/**
 * Parse image analysis from AI response
 * @param {string} text - AI response text
 * @returns {ImageAnalysisResult|null}
 */
function parseImageAnalysis(text) {
  const analysis = {
    style: 'unknown',
    materials: [],
    features: [],
    complexity: 5,
    colorPalette: [],
  };

  // Extract style
  const styleMatch = text.match(/STYLE\s*(?:CLASSIFICATION)?[:\s]+([^\n]+)/i);
  if (styleMatch) {
    analysis.style = styleMatch[1].trim().toLowerCase();
  }

  // Extract materials
  const materialsSection = text.match(/MATERIALS?\s*(?:DETECTED)?[:\s]+([^]*?)(?=MANUFACTURING|COMPLEXITY|COLOR|$)/i);
  if (materialsSection) {
    const materials = materialsSection[1].match(/[-•]\s*([^\n]+)/g);
    if (materials) {
      analysis.materials = materials.map(m => m.replace(/^[-•]\s*/, '').trim()).filter(Boolean);
    }
  }

  // Extract features
  const featuresSection = text.match(/MANUFACTURING\s*(?:FEATURES)?[:\s]+([^]*?)(?=COMPLEXITY|COLOR|STYLE|$)/i);
  if (featuresSection) {
    const features = featuresSection[1].match(/[-•]\s*([^\n]+)/g);
    if (features) {
      analysis.features = features.map(f => f.replace(/^[-•]\s*/, '').trim()).filter(Boolean);
    }
  }

  // Extract complexity
  const complexityMatch = text.match(/COMPLEXITY\s*(?:SCORE)?[:\s]+(\d+)/i);
  if (complexityMatch) {
    analysis.complexity = Math.min(10, Math.max(1, parseInt(complexityMatch[1], 10)));
  }

  // Extract colors
  const colors = text.match(/#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}/g);
  if (colors) {
    analysis.colorPalette = [...new Set(colors)];
  }

  return analysis;
}

/**
 * Extract feature suggestions from AI response
 * @param {string} text - AI response text
 * @param {Object} featureLibrary - Parsed feature library context
 * @returns {Array<FeatureSuggestion>}
 */
function extractFeatureSuggestions(text, featureLibrary = null) {
  const suggestions = [];
  
  // Pattern to find feature recommendations with IDs
  const featureIdPattern = /(?:feature|capability)[:\s]*([A-Z0-9-]+)[:\s]*([^.]+)/gi;
  let match;
  
  while ((match = featureIdPattern.exec(text)) !== null) {
    const featureId = match[1];
    const context = match[2].trim();
    
    suggestions.push({
      featureId,
      featureName: context.split(/[,\-]/)[0].trim(),
      relevance: 'high',
      reason: context,
    });
  }

  // Also look for recommendation patterns
  const recommendPatterns = [
    /recommend(?:ed|s)?[:\s]+["']?([^"'\n.]+)["']?\s*(?:for|because|to)?([^.]*)/gi,
    /suggest(?:ed|s)?[:\s]+["']?([^"'\n.]+)["']?\s*(?:for|because|to)?([^.]*)/gi,
  ];

  for (const pattern of recommendPatterns) {
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1].trim();
      const reason = match[2]?.trim() || '';
      
      if (name.length > 3 && name.length < 100) {
        // Check for duplicates
        if (!suggestions.find(s => s.featureName.toLowerCase() === name.toLowerCase())) {
          suggestions.push({
            featureId: '', // Will be matched later if feature library available
            featureName: name,
            relevance: 'medium',
            reason: reason || 'AI recommended',
          });
        }
      }
    }
  }

  return suggestions.slice(0, 8);
}

/**
 * Calculate response confidence based on various factors
 * @param {string} responseText - AI response
 * @param {boolean} hasFeatureContext - Whether feature library was available
 * @param {boolean} hasImageAnalysis - Whether image was analyzed
 * @returns {number} Confidence score 0-1
 */
function calculateConfidence(responseText, hasFeatureContext, hasImageAnalysis) {
  let confidence = 0.5;
  
  // Boost for specific details
  if (responseText.length > 200) confidence += 0.1;
  if (responseText.includes('Feature Library') || responseText.includes('feature')) confidence += 0.1;
  if (hasFeatureContext) confidence += 0.15;
  if (hasImageAnalysis) confidence += 0.1;
  
  // Reduce for uncertainty markers
  if (responseText.includes('might') || responseText.includes('could be')) confidence -= 0.05;
  if (responseText.includes("I'm not sure") || responseText.includes('uncertain')) confidence -= 0.1;
  
  return Math.min(1, Math.max(0, confidence));
}

/**
 * Save conversation to Firestore
 * @param {string} deliverableId - Deliverable/design item ID
 * @param {string} userId - User ID
 * @param {string} userMessage - User's message
 * @param {Object} aiResponse - AI response object
 */
async function saveConversation(deliverableId, userId, userMessage, aiResponse) {
  if (!deliverableId) return;

  try {
    const conversationRef = db.collection('deliverables').doc(deliverableId)
      .collection('aiConversation');
    
    await conversationRef.add({
      userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      userMessage,
      aiResponse: {
        message: aiResponse.message,
        suggestedFeatures: aiResponse.suggestedFeatures || [],
        imageAnalysis: aiResponse.imageAnalysis || null,
        confidence: aiResponse.confidence,
      },
    });

    // Also update the deliverable's last AI interaction
    await db.collection('deliverables').doc(deliverableId).update({
      lastAIInteraction: admin.firestore.FieldValue.serverTimestamp(),
    }).catch(() => {
      // Ignore if deliverable doesn't exist or no permission
    });
  } catch (error) {
    console.error('Error saving conversation:', error);
    // Don't throw - conversation persistence shouldn't break the response
  }
}

// ============================================
// Main Cloud Function
// ============================================

/**
 * Design Chat Cloud Function (onCall)
 * Enhanced version with structured responses and feature matching
 */
const designChat = onCall({
  memory: '2GiB',
  timeoutSeconds: 120,
  secrets: [GEMINI_API_KEY],
}, async (request) => {
  // 1. Validate authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  const userId = request.auth.uid;
  const { 
    deliverableId, 
    projectId,
    message, 
    imageBase64, 
    imageMimeType = 'image/jpeg',
    conversationHistory = [],
  } = request.data;

  // 2. Validate input
  if (!message && !imageBase64) {
    throw new HttpsError('invalid-argument', 'Message or image is required');
  }

  if (!deliverableId) {
    throw new HttpsError('invalid-argument', 'Deliverable ID is required');
  }

  // 3. Rate limiting
  try {
    const rateResult = await checkRateLimit(userId, 'ai', db);
    if (!rateResult.allowed) {
      throw new HttpsError('resource-exhausted', 
        `Rate limit exceeded. Resets at ${rateResult.resetAt.toISOString()}`);
    }
  } catch (error) {
    if (error.code === 'resource-exhausted') throw error;
    console.warn('Rate limit check failed, proceeding:', error.message);
  }

  console.log('Design Chat request:', { 
    deliverableId, 
    projectId, 
    hasImage: !!imageBase64,
    messageLength: message?.length || 0,
  });

  try {
    // 4. Get Gemini model
    const model = getGeminiModel(GEMINI_API_KEY.value());

    // 5. Get cached Feature Library context
    const cacheManager = getCacheManager(db);
    const featureContext = await cacheManager.getOrCreateCache();

    // 6. Build prompt parts
    const parts = [];
    
    // System instruction
    parts.push({ text: DESIGN_CHAT_SYSTEM_PROMPT });
    
    // Feature Library context
    if (featureContext) {
      parts.push({ text: `\n\nDAWIN FEATURE LIBRARY:\n${featureContext}` });
    }

    // Conversation history (last 10 messages)
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      parts.push({ 
        text: `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}` 
      });
    }

    // Image if provided
    let hasImageAnalysis = false;
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: imageMimeType,
          data: imageBase64,
        },
      });
      parts.push({ text: IMAGE_ANALYSIS_PROMPT });
      hasImageAnalysis = true;
    }

    // User message
    if (message) {
      parts.push({ text: `User: ${message}` });
    } else if (imageBase64) {
      parts.push({ text: 'User: Please analyze this image for furniture/millwork design.' });
    }

    // 7. Generate response
    const startTime = Date.now();
    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
    });

    const responseTime = Date.now() - startTime;
    const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const usageMetadata = result.response.usageMetadata || {};

    console.log(`Design Chat response in ${responseTime}ms, tokens: ${usageMetadata.totalTokenCount || 'unknown'}`);

    // 8. Parse structured data from response
    const imageAnalysis = hasImageAnalysis ? parseImageAnalysis(responseText) : null;
    const suggestedFeatures = extractFeatureSuggestions(responseText);
    const confidence = calculateConfidence(responseText, !!featureContext, hasImageAnalysis);

    // 9. Build response
    const response = {
      message: responseText,
      suggestedFeatures,
      imageAnalysis,
      confidence,
      usageMetadata: {
        inputTokens: usageMetadata.promptTokenCount || 0,
        outputTokens: usageMetadata.candidatesTokenCount || 0,
        totalTokens: usageMetadata.totalTokenCount || 0,
        responseTimeMs: responseTime,
        modelUsed: 'gemini-2.0-flash',
      },
    };

    // 10. Save conversation
    await saveConversation(deliverableId, userId, message || '[Image uploaded]', response);

    return response;

  } catch (error) {
    console.error('Design Chat error:', error);
    throw new HttpsError('internal', `AI processing failed: ${error.message}`);
  }
});

// ============================================
// Exports
// ============================================

module.exports = {
  designChat,
  // Export helpers for use in existing handlers
  parseImageAnalysis,
  extractFeatureSuggestions,
  calculateConfidence,
  saveConversation,
  DESIGN_CHAT_SYSTEM_PROMPT,
  IMAGE_ANALYSIS_PROMPT,
};
