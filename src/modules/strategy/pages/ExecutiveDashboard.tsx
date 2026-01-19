// ============================================================================
// ExecutiveDashboard PAGE
// DawinOS v2.0 - CEO Strategy Command Module
// Main executive dashboard combining all performance views
// ============================================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  TrendingUp,
  BarChart3,
  Activity,
  ArrowRight,
  Zap
} from 'lucide-react';

export const ExecutiveDashboard: React.FC = () => {
  const navigate = useNavigate();

  const quickLinks = [
    {
      title: 'Strategy Plans',
      description: 'View and manage strategic plans',
      icon: Target,
      href: '/strategy/plans',
      color: 'bg-blue-500',
    },
    {
      title: 'OKRs',
      description: 'Objectives and Key Results tracking',
      icon: Zap,
      href: '/strategy/okrs',
      color: 'bg-purple-500',
    },
    {
      title: 'KPIs',
      description: 'Key Performance Indicators dashboard',
      icon: BarChart3,
      href: '/strategy/kpis',
      color: 'bg-green-500',
    },
    {
      title: 'Analytics',
      description: 'Performance analytics and insights',
      icon: Activity,
      href: '/strategy/analytics',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Executive Dashboard
          </h1>
          <p className="text-gray-600">
            Strategic performance overview for Dawin Group
          </p>
        </div>

        {/* Coming Soon Banner */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-center justify-center flex-col text-center">
            <div className="bg-blue-100 rounded-full p-4 mb-4">
              <TrendingUp className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Executive Dashboard Coming Soon
            </h2>
            <p className="text-gray-600 max-w-2xl mb-6">
              The full executive dashboard with performance metrics, OKR tracking, KPI monitoring,
              and strategic insights is under development. Access the individual modules below.
            </p>
          </div>
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.href}
                onClick={() => navigate(link.href)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`${link.color} rounded-lg p-3`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {link.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {link.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Info Alert */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Activity className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Strategy Module Features
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  This module will include: Performance aggregation, OKR cascading, KPI tracking,
                  strategic plan management, organizational hierarchy views, and executive reporting.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
