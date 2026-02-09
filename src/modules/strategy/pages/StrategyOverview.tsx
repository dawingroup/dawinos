// ============================================================================
// StrategyOverview PAGE
// DawinOS v2.0 - CEO Strategy Command Module
// Strategic plans overview and entry point for strategy review
// ============================================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Sparkles,
  ArrowRight,
  LayoutGrid,
  Target,
  Upload,
  Shield,
} from 'lucide-react';

export const StrategyOverview: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Upload,
      title: 'Upload & Analyze',
      description: 'Upload your current business strategy document and let AI analyze it comprehensively.',
      color: 'bg-blue-500',
    },
    {
      icon: LayoutGrid,
      title: 'Business Model Canvas',
      description: 'Review and update all 9 blocks of the Business Model Canvas with AI suggestions.',
      color: 'bg-emerald-500',
    },
    {
      icon: Shield,
      title: 'SWOT & Risk Analysis',
      description: 'Conduct thorough SWOT analysis and strategic risk assessment with AI guidance.',
      color: 'bg-amber-500',
    },
    {
      icon: Target,
      title: 'OKR & KPI Generation',
      description: 'Auto-generate strategic OKRs and KPIs aligned with your business objectives.',
      color: 'bg-purple-500',
    },
  ];

  const reviewSections = [
    { label: 'Executive Summary', status: 'Review company overview and strategic direction' },
    { label: 'Vision & Mission', status: 'Evaluate and refine organizational purpose' },
    { label: 'Business Model Canvas', status: '9-block canvas analysis and optimization' },
    { label: 'Market Analysis', status: 'Market size, trends, segments, and positioning' },
    { label: 'Competitive Analysis', status: 'Competitor landscape and differentiation' },
    { label: 'SWOT Analysis', status: 'Strengths, Weaknesses, Opportunities, Threats' },
    { label: 'Financial Projections', status: 'Revenue, cost, and profitability targets' },
    { label: 'Risk Assessment', status: 'Strategic risk register with mitigation plans' },
    { label: 'Implementation Roadmap', status: 'Phased execution plan with milestones' },
    { label: 'OKRs & KPIs', status: 'Generate and link strategic metrics' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Strategic Plans
            </h1>
            <p className="text-gray-600">
              Review, analyze, and update your organization's business strategy with AI-powered insights.
            </p>
          </div>
          <button
            onClick={() => navigate('/strategy/plans/review/new')}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Strategy Review
          </button>
        </div>

        {/* Hero CTA Card */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 rounded-2xl p-8 mb-8 text-white shadow-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-blue-200" />
                <span className="text-sm font-medium text-blue-200">AI-Powered Strategy Review</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">
                Business Strategy Review Tool
              </h2>
              <p className="text-blue-100 max-w-xl">
                Upload your current business strategy and plan, then use our comprehensive guided review
                to analyze every aspect — from Business Model Canvas to financial projections. Claude AI
                assists with analysis, recommendations, and generates OKRs & KPIs to drive execution.
              </p>
            </div>
            <button
              onClick={() => navigate('/strategy/plans/review/new')}
              className="flex items-center gap-2 px-6 py-3 text-base font-semibold text-blue-700 bg-white rounded-xl hover:bg-blue-50 shadow-md transition-colors whitespace-nowrap"
            >
              Start Strategy Review
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className={`${feature.color} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Review Sections Overview */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Review Sections Guide</h3>
            <span className="text-sm text-gray-500">10 sections • Comprehensive assessment</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reviewSections.map((section, i) => (
              <div
                key={section.label}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-blue-700">{i + 1}</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{section.label}</h4>
                  <p className="text-xs text-gray-500">{section.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Info Banner */}
        <div className="mt-6 bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-purple-900">
                Claude AI Strategy Assistant
              </h3>
              <p className="mt-1 text-sm text-purple-700">
                Every section includes an AI assistant powered by Claude that can analyze your current strategy,
                identify gaps, suggest improvements, and generate strategic outputs like OKRs and KPIs.
                Simply click "AI Assist" on any section or open the chat panel for deeper analysis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyOverview;
