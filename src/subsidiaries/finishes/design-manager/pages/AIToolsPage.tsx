/**
 * AI Tools Page
 *
 * Central hub for all AI-powered design tools:
 * - Project Scoping AI (brief analysis + strategy)
 * - Image Analysis AI
 * - Design Item Enhancement AI
 * - Testing & Verification
 */

import { useState } from 'react';
import {
  Sparkles,
  FileText,
  Image as ImageIcon,
  Wrench,
  ChevronRight,
  TestTube,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { ProjectScopingAI } from '../components/ai/ProjectScopingAI';
import { ImageAnalysisAI } from '../components/ai/ImageAnalysisAI';
import { BriefAnalyzer } from '../components/ai/BriefAnalyzer';
import { testAllAITools, type AIToolsTestResult } from '../services/aiService';

type AITool = 'scoping' | 'image' | 'brief' | 'testing' | null;

const AI_TOOLS = [
  {
    id: 'scoping' as AITool,
    name: 'Project Scoping AI',
    description: 'Extract deliverables from design briefs with multiplier detection',
    icon: Sparkles,
    color: 'from-purple-500 to-blue-600',
    badge: 'NEW',
  },
  {
    id: 'image' as AITool,
    name: 'Image Analysis',
    description: 'Analyze reference images for design elements and materials',
    icon: ImageIcon,
    color: 'from-pink-500 to-orange-500',
    badge: 'NEW',
  },
  {
    id: 'brief' as AITool,
    name: 'Brief Analyzer',
    description: 'Parse design briefs to extract items and specifications',
    icon: FileText,
    color: 'from-green-500 to-teal-500',
    badge: null,
  },
  {
    id: 'testing' as AITool,
    name: 'AI Testing & Verification',
    description: 'Test all AI tools to verify they are working correctly',
    icon: TestTube,
    color: 'from-blue-500 to-cyan-500',
    badge: 'TEST',
  },
];

export function AIToolsPage() {
  const [activeTool, setActiveTool] = useState<AITool>(null);
  const [testResults, setTestResults] = useState<AIToolsTestResult | null>(null);
  const [testing, setTesting] = useState(false);

  const handleScopingComplete = (result: unknown) => {
    console.log('Scoping complete:', result);
  };

  const handleImageAnalysisComplete = (result: unknown) => {
    console.log('Image analysis complete:', result);
  };

  const handleBriefAnalysisComplete = (result: unknown) => {
    console.log('Brief analysis complete:', result);
  };

  const runTests = async () => {
    setTesting(true);
    setTestResults(null);

    try {
      const results = await testAllAITools({
        briefText: `We need 32 guest rooms for a boutique hotel. Each room should have:
- 1 nightstand with 2 drawers
- 1 desk with chair
- 1 wardrobe with sliding doors

Plus 2 executive suites with king-sized beds and sitting areas.`,
        imageUrl: 'https://example.com/test-image.jpg', // Replace with actual test image
        designItem: {
          name: 'Kitchen Cabinet',
          category: 'casework',
        },
      });

      setTestResults(results);
    } catch (error) {
      console.error('Testing failed:', error);
      alert('Testing failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Design Tools</h1>
              <p className="text-sm text-gray-500">
                Powered by Gemini 2.0 Flash • Feature Library integrated
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Tool Selector */}
          <div className="col-span-4">
            <div className="bg-white rounded-xl shadow-sm border p-4 sticky top-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Select Tool
              </h2>
              <div className="space-y-2">
                {AI_TOOLS.map((tool) => {
                  const Icon = tool.icon;
                  const isActive = activeTool === tool.id;
                  
                  return (
                    <button
                      key={tool.id}
                      onClick={() => setActiveTool(tool.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-lg text-left transition-all ${
                        isActive 
                          ? 'bg-gradient-to-r ' + tool.color + ' text-white shadow-lg' 
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{tool.name}</span>
                          {tool.badge && (
                            <span className={`px-1.5 py-0.5 text-xs font-bold rounded ${
                              isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {tool.badge}
                            </span>
                          )}
                        </div>
                        <p className={`text-sm truncate ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                          {tool.description}
                        </p>
                      </div>
                      <ChevronRight className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                    </button>
                  );
                })}
              </div>

              {/* Quick Stats */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Rate Limits
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">AI Requests</span>
                    <span className="font-medium">100/hour</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Image Analysis</span>
                    <span className="font-medium">30/hour</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Grounded Search</span>
                    <span className="font-medium">20/hour</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tool Panel */}
          <div className="col-span-8">
            <div className="bg-white rounded-xl shadow-sm border p-6 min-h-[600px]">
              {!activeTool && (
                <div className="flex flex-col items-center justify-center h-96 text-center">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <Wrench className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select an AI Tool
                  </h3>
                  <p className="text-gray-500 max-w-md">
                    Choose a tool from the left panel to start analyzing your design 
                    briefs, reference images, or generate project scopes.
                  </p>
                </div>
              )}

              {activeTool === 'scoping' && (
                <ProjectScopingAI
                  projectName="Test Project"
                  onScopingComplete={handleScopingComplete}
                />
              )}

              {activeTool === 'image' && (
                <ImageAnalysisAI
                  onAnalysisComplete={handleImageAnalysisComplete}
                />
              )}

              {activeTool === 'brief' && (
                <BriefAnalyzer
                  projectId="test-project"
                  onAnalysisComplete={handleBriefAnalysisComplete}
                />
              )}

              {activeTool === 'testing' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      AI Tools Testing & Verification
                    </h2>
                    <p className="text-gray-600">
                      Run comprehensive tests to verify all three AI tools are functioning correctly.
                      This will test Project Scoping AI, Image Analysis AI, and Design Item Enhancement AI.
                    </p>
                  </div>

                  {/* Run Tests Button */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={runTests}
                      disabled={testing}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {testing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Running Tests...
                        </>
                      ) : (
                        <>
                          <TestTube className="w-5 h-5" />
                          Run All Tests
                        </>
                      )}
                    </button>
                    {testResults && (
                      <span className="text-sm text-gray-500">
                        Last tested: {new Date().toLocaleTimeString()}
                      </span>
                    )}
                  </div>

                  {/* Test Results */}
                  {testResults && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Test Results</h3>

                      {/* Project Scoping AI */}
                      <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-500" />
                            <h4 className="font-medium text-gray-900">Project Scoping AI</h4>
                          </div>
                          {testResults.projectScoping.success ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                        {testResults.projectScoping.success ? (
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between text-gray-600">
                              <span>Status:</span>
                              <span className="font-medium text-green-600">Passing ✓</span>
                            </div>
                            {testResults.projectScoping.itemCount !== undefined && (
                              <div className="flex items-center justify-between text-gray-600">
                                <span>Items Extracted:</span>
                                <span className="font-medium">{testResults.projectScoping.itemCount}</span>
                              </div>
                            )}
                            {testResults.projectScoping.multiplierDetected !== undefined && (
                              <div className="flex items-center justify-between text-gray-600">
                                <span>Multiplier Detection:</span>
                                <span className="font-medium">
                                  {testResults.projectScoping.multiplierDetected ? 'Working ✓' : 'Not Detected'}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-red-600">
                            Error: {testResults.projectScoping.error || 'Unknown error'}
                          </div>
                        )}
                      </div>

                      {/* Image Analysis AI */}
                      <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-pink-500" />
                            <h4 className="font-medium text-gray-900">Image Analysis AI</h4>
                          </div>
                          {testResults.imageAnalysis.success ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                        {testResults.imageAnalysis.success ? (
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between text-gray-600">
                              <span>Status:</span>
                              <span className="font-medium text-green-600">Passing ✓</span>
                            </div>
                            {testResults.imageAnalysis.itemCount !== undefined && (
                              <div className="flex items-center justify-between text-gray-600">
                                <span>Items Identified:</span>
                                <span className="font-medium">{testResults.imageAnalysis.itemCount}</span>
                              </div>
                            )}
                            {testResults.imageAnalysis.confidence !== undefined && (
                              <div className="flex items-center justify-between text-gray-600">
                                <span>Confidence Score:</span>
                                <span className="font-medium">
                                  {Math.round(testResults.imageAnalysis.confidence * 100)}%
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-red-600">
                            Error: {testResults.imageAnalysis.error || 'Unknown error'}
                          </div>
                        )}
                      </div>

                      {/* Design Item Enhancement AI */}
                      <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Wrench className="w-5 h-5 text-green-500" />
                            <h4 className="font-medium text-gray-900">Design Item Enhancement AI</h4>
                          </div>
                          {testResults.designEnhancement.success ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                        {testResults.designEnhancement.success ? (
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between text-gray-600">
                              <span>Status:</span>
                              <span className="font-medium text-green-600">Passing ✓</span>
                            </div>
                            {testResults.designEnhancement.hasSpecifications !== undefined && (
                              <div className="flex items-center justify-between text-gray-600">
                                <span>Specifications:</span>
                                <span className="font-medium">
                                  {testResults.designEnhancement.hasSpecifications ? 'Generated ✓' : 'Missing'}
                                </span>
                              </div>
                            )}
                            {testResults.designEnhancement.hasDfM !== undefined && (
                              <div className="flex items-center justify-between text-gray-600">
                                <span>DfM Validation:</span>
                                <span className="font-medium">
                                  {testResults.designEnhancement.hasDfM ? 'Working ✓' : 'Missing'}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-red-600">
                            Error: {testResults.designEnhancement.error || 'Unknown error'}
                          </div>
                        )}
                      </div>

                      {/* Overall Status */}
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          {testResults.projectScoping.success &&
                          testResults.imageAnalysis.success &&
                          testResults.designEnhancement.success ? (
                            <>
                              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                              <div>
                                <h4 className="font-semibold text-green-900">All Tests Passing</h4>
                                <p className="text-sm text-green-700">
                                  All three AI tools are functioning correctly and ready to use.
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                              <div>
                                <h4 className="font-semibold text-red-900">Some Tests Failed</h4>
                                <p className="text-sm text-red-700">
                                  One or more AI tools are not functioning correctly. Please check the errors above.
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Test Data Info */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Test Data</h4>
                    <div className="space-y-2 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">Project Scoping Test:</span>
                        <p className="mt-1 font-mono bg-white p-2 rounded border">
                          "We need 32 guest rooms... Each room should have: 1 nightstand, 1 desk, 1 wardrobe..."
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Image Analysis Test:</span>
                        <p className="mt-1">Test reference image (furniture mood board)</p>
                      </div>
                      <div>
                        <span className="font-medium">Design Enhancement Test:</span>
                        <p className="mt-1">Kitchen Cabinet (casework category)</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIToolsPage;
