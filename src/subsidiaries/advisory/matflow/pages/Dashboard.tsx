/**
 * MatFlow Dashboard
 * Tab-based navigation similar to Design Manager
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  HardHat, 
  ClipboardList, 
  Package, 
  TrendingUp,
  Plus,
  BarChart3,
  Settings,
  MapPin,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useMatFlowProjects } from '../hooks/useMatFlow';
import { formatDate } from '../utils/formatters';

type Tab = 'overview' | 'projects' | 'boq' | 'procurement' | 'reports' | 'settings';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const navigate = useNavigate();
  const { projects, isLoading } = useMatFlowProjects();
  
  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: TrendingUp },
    { id: 'projects' as Tab, label: 'Projects', icon: HardHat },
    { id: 'boq' as Tab, label: 'BOQ Management', icon: ClipboardList },
    { id: 'procurement' as Tab, label: 'Procurement', icon: Package },
    { id: 'reports' as Tab, label: 'Reports', icon: BarChart3 },
    { id: 'settings' as Tab, label: 'Settings', icon: Settings },
  ];

  const STATS = [
    { label: 'Active Projects', value: projects.filter(p => p.status === 'active').length.toString(), icon: HardHat, color: 'bg-blue-500' },
    { label: 'BOQ Items', value: '0', icon: ClipboardList, color: 'bg-amber-500' },
    { label: 'Deliveries', value: '0', icon: Package, color: 'bg-green-500' },
    { label: 'Total Value', value: 'UGX 0', icon: TrendingUp, color: 'bg-purple-500' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'on-hold': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">MatFlow</h1>
          <p className="text-gray-500">Material flow & project tracking</p>
        </div>
        <Link
          to="/advisory/matflow/projects/new"
          className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-amber-600 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200">
        {activeTab === 'overview' && (
          <div className="p-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {STATS.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className={`${stat.color} p-2 rounded-lg`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{stat.label}</p>
                        <p className="text-xl font-semibold">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Recent Projects */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Recent Projects</h3>
                <button 
                  onClick={() => setActiveTab('projects')}
                  className="text-sm text-amber-600 hover:text-amber-700"
                >
                  View all
                </button>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <HardHat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No projects yet. Create your first project to get started.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.slice(0, 5).map((project) => (
                    <button
                      key={project.id}
                      onClick={() => navigate(`/advisory/matflow/projects/${project.id}`)}
                      className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 text-left"
                    >
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <HardHat className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 truncate">{project.name}</p>
                          <span className={cn('text-xs px-2 py-0.5 rounded-full', getStatusColor(project.status))}>
                            {project.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {project.location?.district || 'No location'}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">All Projects</h3>
              <Link
                to="/advisory/matflow/projects/new"
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                <Plus className="w-4 h-4" />
                New Project
              </Link>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <HardHat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No projects yet</h3>
                <p className="text-gray-500 mb-4">Create your first project to get started</p>
                <Link
                  to="/advisory/matflow/projects/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                >
                  <Plus className="w-4 h-4" />
                  Create Project
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/advisory/matflow/projects/${project.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-amber-200 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <HardHat className="w-6 h-6 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900 truncate">{project.name}</h4>
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', getStatusColor(project.status))}>
                            {project.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          {project.location?.district && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {project.location.district}
                            </span>
                          )}
                          {project.createdAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(project.createdAt as unknown as Date)}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'boq' && (
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">BOQ Management</h3>
            <div className="text-center py-12">
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Select a project to manage its Bill of Quantities</p>
              <button 
                onClick={() => setActiveTab('projects')}
                className="mt-4 text-amber-600 hover:text-amber-700"
              >
                View Projects
              </button>
            </div>
          </div>
        )}

        {activeTab === 'procurement' && (
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Procurement Log</h3>
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Track material deliveries and procurement across projects</p>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Reports</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'Project Summary', description: 'Overview of all projects', icon: HardHat },
                { name: 'BOQ Report', description: 'Bill of quantities summary', icon: ClipboardList },
                { name: 'Procurement Report', description: 'Delivery and supplier analysis', icon: Package },
                { name: 'Variance Report', description: 'Budget vs actual', icon: TrendingUp },
              ].map((report) => {
                const Icon = report.icon;
                return (
                  <button
                    key={report.name}
                    className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                  >
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{report.name}</p>
                      <p className="text-sm text-gray-500">{report.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Settings</h3>
            <div className="text-center py-12">
              <Settings className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">MatFlow settings and configuration</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
