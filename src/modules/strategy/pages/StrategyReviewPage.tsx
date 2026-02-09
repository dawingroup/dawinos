// ============================================================================
// STRATEGY REVIEW PAGE
// DawinOS v2.0 - CEO Strategy Command
// Main page for comprehensive business strategy review with AI assistant
// ============================================================================

import React, { useState, useCallback } from 'react';
import {
  ArrowLeft,
  Save,
  Sparkles,
  Loader2,
  FileText,
  Eye,
  LayoutGrid,
  TrendingUp,
  Users,
  Grid,
  DollarSign,
  ShieldAlert,
  Map,
  Target,
  ChevronRight,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useStrategyReview } from '../hooks/useStrategyReview';

import {
  StrategyDocumentUpload,
  BusinessModelCanvas,
  SWOTAnalysisSection,
  SectionReviewCard,
  OKRKPIOutputSection,
  AIStrategyAssistant,
} from '../components/review';

import type {
  UploadedStrategyDocument,
  SectionReview,
  AIMessage,
  AISuggestion,
  BusinessModelCanvas as BMCType,
  SWOTAnalysis,
} from '../types/strategy.types';

import {
  REVIEW_SECTIONS,
  REVIEW_SECTION_ORDER,
  REVIEW_SECTION_LABELS,
  type ReviewSectionKey,
} from '../constants/strategyReview.constants';

import {
  analyzeStrategySection,
  analyzeFullStrategy,
  createUserMessage,
} from '../services/strategyAI.service';

const SECTION_ICONS: Record<string, React.FC<{ className?: string }>> = {
  executiveSummary: FileText,
  visionMission: Eye,
  businessModelCanvas: LayoutGrid,
  marketAnalysis: TrendingUp,
  competitiveAnalysis: Users,
  swotAnalysis: Grid,
  financialProjections: DollarSign,
  riskAssessment: ShieldAlert,
  implementationRoadmap: Map,
  okrKpiOutput: Target,
};

export const StrategyReviewPage: React.FC = () => {
  const navigate = useNavigate();
  useAuth();
  const { reviewId } = useParams<{ reviewId?: string }>();
  const companyId = 'dawin_group';

  // Firestore-backed review state with auto-save
  const {
    reviewData,
    setReviewData,
    isSaving,
    lastSavedAt,
    save,
    isLoading,
  } = useStrategyReview({ companyId, reviewId });

  const [activeSection, setActiveSection] = useState<ReviewSectionKey>(REVIEW_SECTIONS.EXECUTIVE_SUMMARY);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [isAnalyzingDocument, setIsAnalyzingDocument] = useState(false);

  // Document upload handler
  const handleDocumentUploaded = useCallback((doc: UploadedStrategyDocument, parsedContent?: string) => {
    setReviewData(prev => ({
      ...prev,
      uploadedDocument: doc,
      status: 'in_progress',
    }));

    // If we have content, trigger full AI analysis
    if (parsedContent && parsedContent.length > 50) {
      handleAnalyzeFullDocument(parsedContent);
    }
  }, [companyId]);

  const handleAnalyzeFullDocument = async (content: string) => {
    setIsAnalyzingDocument(true);
    try {
      const response = await analyzeFullStrategy(content, companyId, reviewData.id);
      if (response.success && response.conversationMessage) {
        setReviewData(prev => ({
          ...prev,
          aiConversationHistory: [
            ...prev.aiConversationHistory,
            createUserMessage('Analyze the uploaded strategy document and provide comprehensive assessment.'),
            response.conversationMessage,
          ],
        }));

        // Apply suggestions to populate sections
        if (response.suggestions.length > 0) {
          applySuggestionsToReview(response.suggestions);
        }
      }
    } catch (error) {
      console.error('Full analysis failed:', error);
    } finally {
      setIsAnalyzingDocument(false);
    }
  };

  const applySuggestionsToReview = (suggestions: AISuggestion[]) => {
    setReviewData(prev => {
      const updated = { ...prev };

      suggestions.forEach(s => {
        if (s.type === 'bmc') {
          // Try to parse BMC suggestions
          try {
            const bmcData = JSON.parse(s.content);
            if (bmcData && typeof bmcData === 'object') {
              Object.keys(bmcData).forEach(key => {
                const bmcKey = key as keyof BMCType;
                if (updated.businessModelCanvas[bmcKey] && Array.isArray(bmcData[key])) {
                  const newItems = bmcData[key].map((text: string) => ({
                    id: crypto.randomUUID().slice(0, 8),
                    text: typeof text === 'string' ? text : String(text),
                    aiSuggested: true,
                  }));
                  updated.businessModelCanvas[bmcKey] = [
                    ...updated.businessModelCanvas[bmcKey],
                    ...newItems,
                  ];
                }
              });
            }
          } catch { /* not JSON, skip */ }
        }

        if (s.type === 'swot') {
          try {
            const swotData = JSON.parse(s.content);
            if (swotData && typeof swotData === 'object') {
              (['strengths', 'weaknesses', 'opportunities', 'threats'] as const).forEach(q => {
                if (Array.isArray(swotData[q])) {
                  const newItems = swotData[q].map((text: string) => ({
                    id: crypto.randomUUID().slice(0, 8),
                    text: typeof text === 'string' ? text : String(text),
                    impact: 'medium' as const,
                    aiSuggested: true,
                  }));
                  updated.swotAnalysis[q] = [...updated.swotAnalysis[q], ...newItems];
                }
              });
            }
          } catch { /* not JSON, skip */ }
        }
      });

      return updated;
    });
  };

  // Section review handlers
  const handleSectionReviewChange = useCallback((sectionKey: ReviewSectionKey, review: SectionReview) => {
    setReviewData(prev => ({
      ...prev,
      sectionReviews: {
        ...prev.sectionReviews,
        [sectionKey]: review,
      },
    }));
  }, []);

  // BMC change handler
  const handleBMCChange = useCallback((bmc: BMCType) => {
    setReviewData(prev => ({ ...prev, businessModelCanvas: bmc }));
  }, []);

  // SWOT change handler
  const handleSWOTChange = useCallback((swot: SWOTAnalysis) => {
    setReviewData(prev => ({ ...prev, swotAnalysis: swot }));
  }, []);

  // AI section analysis
  const handleRequestAI = useCallback(async (section?: string) => {
    const targetSection = section || activeSection;
    setIsAILoading(true);
    try {
      const sectionData: Record<string, unknown> = {};
      if (targetSection === 'businessModelCanvas') {
        sectionData.businessModelCanvas = reviewData.businessModelCanvas;
      } else if (targetSection === 'swotAnalysis') {
        sectionData.swotAnalysis = reviewData.swotAnalysis;
      } else if (targetSection === 'financialProjections') {
        sectionData.financialProjections = reviewData.financialProjections;
      } else {
        sectionData.sectionReview = reviewData.sectionReviews[targetSection as keyof typeof reviewData.sectionReviews];
      }

      const response = await analyzeStrategySection({
        companyId,
        reviewId: reviewData.id,
        section: targetSection,
        currentData: sectionData,
        uploadedDocumentContent: reviewData.uploadedDocument?.parsedContent,
        conversationHistory: reviewData.aiConversationHistory,
      });

      if (response.conversationMessage) {
        setReviewData(prev => ({
          ...prev,
          aiConversationHistory: [
            ...prev.aiConversationHistory,
            createUserMessage(`Analyze the ${REVIEW_SECTION_LABELS[targetSection as ReviewSectionKey] || targetSection} section.`, targetSection),
            response.conversationMessage,
          ],
        }));
      }

      if (response.suggestions.length > 0) {
        applySuggestionsToReview(response.suggestions);
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
    } finally {
      setIsAILoading(false);
    }
  }, [activeSection, companyId, reviewData]);

  // Apply AI suggestion
  const handleApplySuggestion = useCallback((suggestion: AISuggestion) => {
    applySuggestionsToReview([suggestion]);
    // Mark as applied in conversation
    setReviewData(prev => ({
      ...prev,
      aiConversationHistory: prev.aiConversationHistory.map(msg => ({
        ...msg,
        suggestions: msg.suggestions?.map(s =>
          s.id === suggestion.id ? { ...s, applied: true } : s
        ),
      })),
    }));
  }, []);

  // Conversation update
  const handleConversationUpdate = useCallback((messages: AIMessage[]) => {
    setReviewData(prev => ({ ...prev, aiConversationHistory: messages }));
  }, []);

  // Calculate progress
  const completedSections = Object.values(reviewData.sectionReviews).filter(
    r => r.status === 'approved' || r.status === 'in_review'
  ).length;
  const totalSections = Object.keys(reviewData.sectionReviews).length;
  const progressPercent = Math.round((completedSections / totalSections) * 100);

  // Calculate overall score
  const scores = Object.values(reviewData.sectionReviews).filter(r => r.score > 0);
  const avgScore = scores.length > 0 ? (scores.reduce((sum, r) => sum + r.score, 0) / scores.length).toFixed(1) : '—';

  // Render active section content
  const renderSectionContent = () => {
    const currentReview = reviewData.sectionReviews[activeSection as keyof typeof reviewData.sectionReviews];
    if (!currentReview) return null;

    switch (activeSection) {
      case REVIEW_SECTIONS.BUSINESS_MODEL_CANVAS:
        return (
          <SectionReviewCard
            sectionKey={activeSection}
            review={currentReview}
            onChange={(r) => handleSectionReviewChange(activeSection, r)}
            onRequestAI={() => handleRequestAI('businessModelCanvas')}
            isAILoading={isAILoading}
          >
            <BusinessModelCanvas
              data={reviewData.businessModelCanvas}
              onChange={handleBMCChange}
              onRequestAI={(blockKey) => handleRequestAI(blockKey)}
              isAILoading={isAILoading}
            />
          </SectionReviewCard>
        );

      case REVIEW_SECTIONS.SWOT_ANALYSIS:
        return (
          <SectionReviewCard
            sectionKey={activeSection}
            review={currentReview}
            onChange={(r) => handleSectionReviewChange(activeSection, r)}
            onRequestAI={() => handleRequestAI('swotAnalysis')}
            isAILoading={isAILoading}
          >
            <SWOTAnalysisSection
              data={reviewData.swotAnalysis}
              onChange={handleSWOTChange}
              onRequestAI={() => handleRequestAI('swotAnalysis')}
              isAILoading={isAILoading}
            />
          </SectionReviewCard>
        );

      case REVIEW_SECTIONS.OKR_KPI_OUTPUT:
        return (
          <SectionReviewCard
            sectionKey={activeSection}
            review={currentReview}
            onChange={(r) => handleSectionReviewChange(activeSection, r)}
            onRequestAI={() => handleRequestAI('okrKpiOutput')}
            isAILoading={isAILoading}
          >
            <OKRKPIOutputSection
              okrs={reviewData.generatedOKRs}
              kpis={reviewData.generatedKPIs}
              reviewData={reviewData}
              companyId={companyId}
              onOKRsChange={(okrs) => setReviewData(prev => ({ ...prev, generatedOKRs: okrs }))}
              onKPIsChange={(kpis) => setReviewData(prev => ({ ...prev, generatedKPIs: kpis }))}
            />
          </SectionReviewCard>
        );

      default:
        return (
          <SectionReviewCard
            sectionKey={activeSection}
            review={currentReview}
            onChange={(r) => handleSectionReviewChange(activeSection, r)}
            onRequestAI={() => handleRequestAI(activeSection)}
            isAILoading={isAILoading}
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-600">Loading strategy review...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/strategy/plans')}
              className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Business Strategy Review</h1>
              <p className="text-xs text-gray-500">
                {reviewData.status === 'draft' ? 'Draft' : reviewData.status === 'in_progress' ? 'In Progress' : 'Completed'}
                {' — '}{completedSections}/{totalSections} sections • Score: {avgScore}/5
                {lastSavedAt && (
                  <span className="ml-2 text-green-600">• Saved {new Date(lastSavedAt).toLocaleTimeString()}</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Progress */}
            <div className="hidden md:flex items-center gap-2">
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-600">{progressPercent}%</span>
            </div>

            <button
              onClick={() => setIsAIPanelOpen(!isAIPanelOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                isAIPanelOpen
                  ? 'text-purple-700 bg-purple-100'
                  : 'text-purple-600 hover:bg-purple-50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              AI Assistant
            </button>

            <button
              onClick={() => save()}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-20 space-y-1">
              {/* Upload Section */}
              <div className="mb-4 p-3 bg-white border border-gray-200 rounded-xl">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Strategy Document
                </h4>
                <StrategyDocumentUpload
                  existingDocument={reviewData.uploadedDocument}
                  onDocumentUploaded={handleDocumentUploaded}
                  onAnalyzeDocument={(content) => handleAnalyzeFullDocument(content)}
                  isAnalyzing={isAnalyzingDocument}
                />
              </div>

              {/* Section Navigation */}
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
                Review Sections
              </h4>
              {REVIEW_SECTION_ORDER.map((sectionKey) => {
                const Icon = SECTION_ICONS[sectionKey] || FileText;
                const sectionReview = reviewData.sectionReviews[sectionKey as keyof typeof reviewData.sectionReviews];
                const isActive = activeSection === sectionKey;
                return (
                  <button
                    key={sectionKey}
                    onClick={() => setActiveSection(sectionKey)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all text-left ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="flex-1 truncate">{REVIEW_SECTION_LABELS[sectionKey]}</span>
                    {sectionReview?.score > 0 && (
                      <span className="text-xs text-gray-400">{sectionReview.score}/5</span>
                    )}
                    {sectionReview?.status && sectionReview.status !== 'not_started' && (
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        sectionReview.status === 'approved' ? 'bg-green-500' :
                        sectionReview.status === 'in_review' ? 'bg-blue-500' :
                        sectionReview.status === 'needs_update' ? 'bg-amber-500' :
                        'bg-gray-300'
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Mobile Section Selector */}
            <div className="lg:hidden mb-4">
              <select
                value={activeSection}
                onChange={(e) => setActiveSection(e.target.value as ReviewSectionKey)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                {REVIEW_SECTION_ORDER.map(key => (
                  <option key={key} value={key}>{REVIEW_SECTION_LABELS[key]}</option>
                ))}
              </select>
            </div>

            {/* Document Upload for mobile / when no sidebar */}
            <div className="lg:hidden mb-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <StrategyDocumentUpload
                  existingDocument={reviewData.uploadedDocument}
                  onDocumentUploaded={handleDocumentUploaded}
                  onAnalyzeDocument={(content) => handleAnalyzeFullDocument(content)}
                  isAnalyzing={isAnalyzingDocument}
                />
              </div>
            </div>

            {/* Analyzing Banner */}
            {isAnalyzingDocument && (
              <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-purple-600 animate-spin flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-purple-900">AI is analyzing your strategy document...</p>
                  <p className="text-xs text-purple-700">Claude is reviewing the document and will pre-populate sections with suggestions.</p>
                </div>
              </div>
            )}

            {/* Active Section Content */}
            {renderSectionContent()}

            {/* Section Navigation Footer */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  const currentIndex = REVIEW_SECTION_ORDER.indexOf(activeSection);
                  if (currentIndex > 0) {
                    setActiveSection(REVIEW_SECTION_ORDER[currentIndex - 1]);
                  }
                }}
                disabled={REVIEW_SECTION_ORDER.indexOf(activeSection) === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous Section
              </button>
              <button
                onClick={() => {
                  const currentIndex = REVIEW_SECTION_ORDER.indexOf(activeSection);
                  if (currentIndex < REVIEW_SECTION_ORDER.length - 1) {
                    setActiveSection(REVIEW_SECTION_ORDER[currentIndex + 1]);
                  }
                }}
                disabled={REVIEW_SECTION_ORDER.indexOf(activeSection) === REVIEW_SECTION_ORDER.length - 1}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next Section
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Strategy Assistant Panel */}
      <AIStrategyAssistant
        reviewData={reviewData}
        companyId={companyId}
        activeSection={activeSection}
        conversationHistory={reviewData.aiConversationHistory}
        onConversationUpdate={handleConversationUpdate}
        onApplySuggestion={handleApplySuggestion}
        isOpen={isAIPanelOpen}
        onToggle={() => setIsAIPanelOpen(!isAIPanelOpen)}
      />
    </div>
  );
};

export default StrategyReviewPage;
