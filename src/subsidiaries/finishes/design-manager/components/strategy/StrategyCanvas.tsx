/**
 * Strategy Canvas Component
 * Main canvas for project strategy research with AI report generation
 */

import { useState, lazy, Suspense } from 'react';
import { Target, Ruler, DollarSign, Search, Lightbulb, X, FileText, Download, Sparkles, Package } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { functions } from '@/shared/services/firebase';
import { useStrategyResearch } from './useStrategyResearch';
import { ChallengesSection } from './ChallengesSection';
import { SpaceParametersSection } from './SpaceParametersSection';
import { BudgetFrameworkSection } from './BudgetFrameworkSection';
import { ResearchAssistant } from './ResearchAssistant';
import { TrendInsightsPanel } from './TrendInsightsPanel';
import { StrategyPDF } from '@/modules/strategy/components/StrategyPDF';
import type { StrategyReport, GenerateStrategyInput } from '@/modules/strategy/types';

// Lazy load AI components
const ProjectScopingAI = lazy(() => 
  import('../ai/ProjectScopingAI').then(m => ({ default: m.ProjectScopingAI }))
);
const CustomerIntelligenceAI = lazy(() => 
  import('../ai/CustomerIntelligenceAI').then(m => ({ default: m.CustomerIntelligenceAI }))
);

interface StrategyCanvasProps {
  projectId: string;
  projectName?: string;
  projectCode?: string;
  clientBrief?: string;
  userId?: string;
  onClose?: () => void;
}

export function StrategyCanvas({ projectId, projectName, projectCode, clientBrief, userId, onClose }: StrategyCanvasProps) {
  const {
    strategy,
    messages,
    isLoading,
    isSending,
    error,
    updateStrategy,
    sendQuery,
    saveFinding,
    deleteFinding,
    clearError,
  } = useStrategyResearch(projectId, userId);

  // Reserved for future panel switching
  const [_activePanel] = useState<'research' | 'findings'>('research');

  // AI Report generation state
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<StrategyReport | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [showReportPanel, setShowReportPanel] = useState(false);

  // Project Scoping AI state - used to feed into Strategy Report
  const [scopingResult, setScopingResult] = useState<any>(null);

  
  // Generate AI Strategy Report
  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    setReportError(null);

    try {
      // Extract research excerpts from assistant messages
      const researchExcerpts = messages
        .filter(m => m.role === 'assistant' && m.content.length > 100)
        .slice(-5) // Last 5 significant responses
        .map(m => m.content.substring(0, 500)); // Truncate to avoid token limits

      // Build space details string
      const spaceDetails = strategy?.spaceParameters 
        ? `${strategy.spaceParameters.totalArea} ${strategy.spaceParameters.areaUnit} ${strategy.spaceParameters.spaceType} with ${strategy.spaceParameters.circulationPercent}% circulation`
        : undefined;

      // Format research findings
      const researchFindings = strategy?.researchFindings?.map(f => ({
        title: f.title,
        content: f.content,
        category: f.category,
      })) || [];

      const generateStrategy = httpsCallable<GenerateStrategyInput, StrategyReport>(
        functions,
        'generateStrategyReport'
      );

      // Build scoping context if available
      const scopingContext = scopingResult ? {
        deliverables: scopingResult.deliverables?.slice(0, 20)?.map((d: any) => ({
          name: d.name,
          category: d.category,
          quantity: d.quantity,
          roomType: d.roomTypeName,
        })),
        summary: scopingResult.summary,
        entities: scopingResult.entities,
        trendInsights: scopingResult.aiEnhancement?.trendInsights,
      } : null;

      const result = await generateStrategy({
        projectName: projectName || 'Untitled Project',
        projectType: scopingResult?.entities?.projectType || strategy?.spaceParameters?.spaceType || 'Custom Millwork',
        clientBrief: clientBrief || 'Custom millwork project',
        location: scopingResult?.entities?.location || 'East Africa',
        year: new Date().getFullYear(),
        // Enhanced inputs
        constraints: strategy?.challenges?.constraints || [],
        painPoints: strategy?.challenges?.painPoints || [],
        goals: strategy?.challenges?.goals || [],
        budgetTier: strategy?.budgetFramework?.tier,
        spaceDetails,
        researchFindings,
        researchExcerpts,
        // Include scoping output
        scopingContext: scopingContext || undefined,
      });

      setGeneratedReport(result.data);
      setShowReportPanel(true);
    } catch (err) {
      console.error('Report generation error:', err);
      setReportError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 z-40 sticky top-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">Project Strategy</h1>
              {projectName && (
                <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-1.5 font-medium truncate">{projectName}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Generate AI Report Button */}
              <button
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 text-xs sm:text-sm"
              >
                {isGeneratingReport ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent" />
                    <span className="hidden sm:inline">Generating...</span>
                    <span className="sm:hidden">Gen...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Generate AI Report</span>
                    <span className="sm:hidden">AI Report</span>
                  </>
                )}
              </button>

              {/* View Report Button (if generated) */}
              {generatedReport && !showReportPanel && (
                <button
                  onClick={() => setShowReportPanel(true)}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 border border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 text-xs sm:text-sm"
                >
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">View Report</span>
                  <span className="sm:hidden">View</span>
                </button>
              )}

              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Banners */}
      {(error || reportError) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-sm text-red-600">{error || reportError}</p>
            <button onClick={() => { clearError(); setReportError(null); }} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content - Scrollable */}
      <div className="bg-gray-50 pb-8 sm:pb-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-10">
          {/* Left Column - Strategy Inputs */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-10">
            {/* Project Scoping AI - FIRST */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border-2 border-purple-400 p-4 sm:p-6 lg:p-10 bg-gradient-to-br from-purple-50 via-white to-purple-50 hover:shadow-2xl transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Project Scoping AI</h2>
                  <span className="inline-block mt-2 px-4 py-1.5 text-xs font-bold bg-purple-500 text-white rounded-full shadow-md">
                    ⚡ START HERE
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-8 leading-relaxed">
                Enter your design brief to automatically extract deliverables. The output will be used to generate your strategy report.
              </p>
              <Suspense fallback={
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent"></div>
                </div>
              }>
                <ProjectScopingAI
                  projectId={projectId}
                  projectName={projectName}
                  onScopingComplete={(result) => {
                    console.log('Scoping complete:', result);
                    setScopingResult(result);
                  }}
                />
              </Suspense>
            </div>

            {/* Challenges Section */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-gray-200 p-4 sm:p-6 lg:p-9 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Challenges & Goals</h2>
              </div>
              <ChallengesSection
                challenges={strategy?.challenges || { painPoints: [], goals: [], constraints: [] }}
                onUpdate={(challenges) => updateStrategy({ challenges })}
              />
            </div>

            {/* Space Parameters */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-gray-200 p-4 sm:p-6 lg:p-9 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                  <Ruler className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Space Parameters</h2>
              </div>
              <SpaceParametersSection
                params={strategy?.spaceParameters || {
                  totalArea: 0,
                  areaUnit: 'sqm',
                  spaceType: 'restaurant',
                  circulationPercent: 30,
                }}
                onUpdate={(spaceParameters) => updateStrategy({ spaceParameters })}
              />
            </div>

            {/* Budget Framework */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-gray-200 p-4 sm:p-6 lg:p-9 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Budget Framework</h2>
              </div>
              <BudgetFrameworkSection
                budget={strategy?.budgetFramework || { tier: 'standard', priorities: [] }}
                onUpdate={(budgetFramework) => updateStrategy({ budgetFramework })}
              />
            </div>

            {/* Research Findings */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-gray-200 p-4 sm:p-6 lg:p-9 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md">
                    <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
                  </div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Research Findings</h2>
                </div>
                <span className="px-4 py-1.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 text-sm font-bold rounded-full shadow-sm">
                  {strategy?.researchFindings?.length || 0} saved
                </span>
              </div>
              <TrendInsightsPanel
                findings={strategy?.researchFindings || []}
                onDelete={deleteFinding}
              />
            </div>

          </div>

          {/* Right Column - Research Assistant & Customer Intelligence */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6 lg:space-y-10">
            <div className="lg:sticky lg:top-28 space-y-4 sm:space-y-6 lg:space-y-10">
              {/* Customer Intelligence */}
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-gray-200 p-4 sm:p-6 lg:p-8 hover:shadow-xl transition-shadow">
                <Suspense fallback={
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-3 border-teal-600 border-t-transparent mx-auto mb-4"></div>
                      <p className="text-sm text-gray-600 font-medium">Loading Customer Intelligence...</p>
                    </div>
                  </div>
                }>
                  <CustomerIntelligenceAI
                    customerId={undefined}
                    customerName="Customer"
                    onContextReady={(context) => console.log('Customer context:', context)}
                  />
                </Suspense>
              </div>

              {/* Research Assistant */}
              <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-4 p-6 border-b-2 border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-600">
                  <div className="w-10 h-10 rounded-xl bg-white bg-opacity-20 flex items-center justify-center shadow-md">
                    <Search className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Research Assistant</h2>
                </div>
                <ResearchAssistant
                  messages={messages}
                  isSending={isSending}
                  onSendQuery={sendQuery}
                  onSaveFinding={saveFinding}
                />
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Generated Report Slide-out Panel */}
      {showReportPanel && generatedReport && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowReportPanel(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl overflow-y-auto">
            {/* Report Header */}
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">{generatedReport.reportTitle}</h2>
                  <p className="text-indigo-200 text-sm mt-1">
                    {generatedReport.trends.length} trends • {generatedReport.recommendations.length} recommendations
                  </p>
                </div>
                <button
                  onClick={() => setShowReportPanel(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Report Content */}
            <div className="p-6 space-y-6">
              {/* Executive Summary */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Executive Summary</h3>
                <p className="text-gray-600 text-sm">{generatedReport.executiveSummary}</p>
              </div>

              {/* Key Trends */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Key Trends</h3>
                <div className="space-y-3">
                  {generatedReport.trends.map((trend, i) => (
                    <div key={i} className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-blue-900">{trend.name}</p>
                        <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">
                          {trend.relevanceScore}% match
                        </span>
                      </div>
                      <p className="text-sm text-blue-700">{trend.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Recommendations</h3>
                <div className="space-y-3">
                  {generatedReport.recommendations.map((rec, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900">{rec.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                          rec.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {rec.priority} priority
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>~{rec.estimatedDays} days</span>
                        <span>{rec.complexity} complexity</span>
                        <span>{rec.matchedFeatures.length} features</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Production Feasibility */}
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-teal-900">Production Feasibility</h3>
                    <p className="text-sm text-teal-700 mt-1">{generatedReport.productionFeasibility.notes}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-teal-600">
                      {generatedReport.productionFeasibility.overallScore}%
                    </p>
                    <p className="text-xs text-teal-600">Score</p>
                  </div>
                </div>
              </div>

              {/* Color Scheme */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Suggested Color Scheme</h3>
                <div className="flex gap-3">
                  <div
                    className="w-16 h-16 rounded-lg shadow-inner flex items-center justify-center"
                    style={{ backgroundColor: generatedReport.colorScheme.primary }}
                  >
                    <span className="text-white text-xs font-medium drop-shadow">Primary</span>
                  </div>
                  <div
                    className="w-16 h-16 rounded-lg shadow-inner flex items-center justify-center"
                    style={{ backgroundColor: generatedReport.colorScheme.secondary }}
                  >
                    <span className="text-white text-xs font-medium drop-shadow">Secondary</span>
                  </div>
                  <div
                    className="w-16 h-16 rounded-lg shadow-inner flex items-center justify-center"
                    style={{ backgroundColor: generatedReport.colorScheme.accent }}
                  >
                    <span className="text-white text-xs font-medium drop-shadow">Accent</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">{generatedReport.colorScheme.description}</p>
              </div>

              {/* Next Steps */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Next Steps</h3>
                <ul className="space-y-1">
                  {generatedReport.nextSteps.map((step, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-indigo-500 mt-1">•</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Report Footer with Download */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-between items-center">
              <button
                onClick={() => setShowReportPanel(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Close
              </button>
              <PDFDownloadLink
                document={<StrategyPDF report={generatedReport} />}
                fileName={`${projectCode || projectId}-strategy-${new Date().toISOString().split('T')[0]}.pdf`}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                {({ loading }) => (
                  loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Preparing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download PDF
                    </>
                  )
                )}
              </PDFDownloadLink>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
