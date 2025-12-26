/**
 * Strategy Canvas Component
 * Main canvas for project strategy research
 */

import { useState } from 'react';
import { Target, Ruler, DollarSign, Search, Lightbulb, X } from 'lucide-react';
import { useStrategyResearch } from './useStrategyResearch';
import { ChallengesSection } from './ChallengesSection';
import { SpaceParametersSection } from './SpaceParametersSection';
import { BudgetFrameworkSection } from './BudgetFrameworkSection';
import { ResearchAssistant } from './ResearchAssistant';
import { TrendInsightsPanel } from './TrendInsightsPanel';

interface StrategyCanvasProps {
  projectId: string;
  projectName?: string;
  userId?: string;
  onClose?: () => void;
}

export function StrategyCanvas({ projectId, projectName, userId, onClose }: StrategyCanvasProps) {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Project Strategy</h1>
              {projectName && (
                <p className="text-sm text-gray-500 mt-1">{projectName}</p>
              )}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={clearError} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Strategy Inputs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Challenges Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-semibold text-gray-900">Challenges & Goals</h2>
              </div>
              <ChallengesSection
                challenges={strategy?.challenges || { painPoints: [], goals: [], constraints: [] }}
                onUpdate={(challenges) => updateStrategy({ challenges })}
              />
            </div>

            {/* Space Parameters */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Ruler className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900">Space Parameters</h2>
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
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-green-500" />
                <h2 className="text-lg font-semibold text-gray-900">Budget Framework</h2>
              </div>
              <BudgetFrameworkSection
                budget={strategy?.budgetFramework || { tier: 'standard', priorities: [] }}
                onUpdate={(budgetFramework) => updateStrategy({ budgetFramework })}
              />
            </div>

            {/* Research Findings */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-gray-900">Research Findings</h2>
                <span className="ml-auto text-sm text-gray-500">
                  {strategy?.researchFindings?.length || 0} saved
                </span>
              </div>
              <TrendInsightsPanel
                findings={strategy?.researchFindings || []}
                onDelete={deleteFinding}
              />
            </div>
          </div>

          {/* Right Column - Research Assistant */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center gap-2 p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
                  <Search className="w-5 h-5 text-white" />
                  <h2 className="font-semibold text-white">Research Assistant</h2>
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
  );
}
