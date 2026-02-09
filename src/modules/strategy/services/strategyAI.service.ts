// ============================================================================
// STRATEGY AI SERVICE - DawinOS CEO Strategy Command
// Frontend service for Claude-powered strategy analysis
// ============================================================================

import { auth } from '../../../shared/services/firebase/auth';
import type {
  AIStrategyAnalysisRequest,
  AIStrategyAnalysisResponse,
  AIMessage,
  StrategyReviewData,
} from '../types/strategy.types';

const API_ENDPOINT = 'https://api-okekivpl2a-uc.a.run.app/api';

// ----------------------------------------------------------------------------
// Auth Headers
// ----------------------------------------------------------------------------
async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      console.warn('Failed to get auth token:', error);
    }
  }

  return headers;
}

// ----------------------------------------------------------------------------
// Strategy AI Analysis
// ----------------------------------------------------------------------------
export async function analyzeStrategySection(
  request: AIStrategyAnalysisRequest
): Promise<AIStrategyAnalysisResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_ENDPOINT}/ai/strategy-review`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Strategy analysis failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Strategy AI analysis error:', error);
    return {
      success: false,
      message: '',
      suggestions: [],
      conversationMessage: {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `I encountered an error analyzing this section. ${error instanceof Error ? error.message : 'Please try again.'}`,
        timestamp: new Date().toISOString(),
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ----------------------------------------------------------------------------
// Strategy Document Parsing (upload + extract content)
// ----------------------------------------------------------------------------
export async function parseStrategyDocument(
  file: File,
  companyId: string
): Promise<{ success: boolean; content: string; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    // Remove Content-Type to let browser set multipart boundary
    delete (headers as Record<string, string>)['Content-Type'];

    const formData = new FormData();
    formData.append('file', file);
    formData.append('companyId', companyId);

    const response = await fetch(`${API_ENDPOINT}/ai/strategy-parse-document`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Document parsing failed');
    }

    const data = await response.json();
    return {
      success: true,
      content: data.content || '',
    };
  } catch (error) {
    console.error('Strategy document parsing error:', error);
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ----------------------------------------------------------------------------
// Generate OKRs from Strategy Review
// ----------------------------------------------------------------------------
export async function generateOKRsFromStrategy(
  reviewData: Partial<StrategyReviewData>,
  companyId: string
): Promise<AIStrategyAnalysisResponse> {
  return analyzeStrategySection({
    companyId,
    reviewId: reviewData.id || '',
    section: 'okrKpiOutput',
    currentData: {
      businessModelCanvas: reviewData.businessModelCanvas,
      swotAnalysis: reviewData.swotAnalysis,
      financialProjections: reviewData.financialProjections,
      implementationRoadmap: reviewData.implementationRoadmap,
      sectionReviews: reviewData.sectionReviews,
    },
    question: 'Generate comprehensive OKRs based on the strategy review. Include 3-5 strategic objectives with measurable key results aligned to the business model and strategic pillars.',
    conversationHistory: reviewData.aiConversationHistory,
  });
}

// ----------------------------------------------------------------------------
// Generate KPIs from Strategy Review
// ----------------------------------------------------------------------------
export async function generateKPIsFromStrategy(
  reviewData: Partial<StrategyReviewData>,
  companyId: string
): Promise<AIStrategyAnalysisResponse> {
  return analyzeStrategySection({
    companyId,
    reviewId: reviewData.id || '',
    section: 'okrKpiOutput',
    currentData: {
      businessModelCanvas: reviewData.businessModelCanvas,
      financialProjections: reviewData.financialProjections,
      marketAnalysis: reviewData.marketAnalysis,
    },
    question: 'Generate 8-12 strategic KPIs across financial, operational, customer, employee, and growth categories. Include target values, measurement frequency, and suggested owners.',
    conversationHistory: reviewData.aiConversationHistory,
  });
}

// ----------------------------------------------------------------------------
// AI Chat for Strategy Assistant
// ----------------------------------------------------------------------------
export async function sendStrategyChatMessage(
  message: string,
  section: string,
  reviewData: Partial<StrategyReviewData>,
  companyId: string,
  conversationHistory: AIMessage[]
): Promise<AIStrategyAnalysisResponse> {
  return analyzeStrategySection({
    companyId,
    reviewId: reviewData.id || '',
    section,
    currentData: reviewData as Record<string, unknown>,
    question: message,
    conversationHistory,
  });
}

// ----------------------------------------------------------------------------
// Analyze Full Strategy Document
// ----------------------------------------------------------------------------
export async function analyzeFullStrategy(
  documentContent: string,
  companyId: string,
  reviewId: string
): Promise<AIStrategyAnalysisResponse> {
  return analyzeStrategySection({
    companyId,
    reviewId,
    section: 'full_analysis',
    currentData: {},
    uploadedDocumentContent: documentContent,
    question: 'Analyze this complete business strategy document. Provide a comprehensive assessment covering: executive summary quality, vision/mission clarity, business model completeness, market positioning, competitive advantages, financial projections viability, risk landscape, and implementation feasibility. For each section, provide a score (1-5) and specific recommendations. Also pre-populate the Business Model Canvas, SWOT analysis, and suggest initial OKRs and KPIs.',
  });
}

// ----------------------------------------------------------------------------
// Helper: Generate unique ID for messages
// ----------------------------------------------------------------------------
export function createUserMessage(content: string, section?: string): AIMessage {
  return {
    id: crypto.randomUUID(),
    role: 'user',
    content,
    timestamp: new Date().toISOString(),
    section,
  };
}
