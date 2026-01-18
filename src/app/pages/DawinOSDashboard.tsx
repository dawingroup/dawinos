/**
 * DawinOS Dashboard
 * Home dashboard with subsidiary selector and module overview
 */

import { Link } from 'react-router-dom';
import { 
  Palette, 
  Package, 
  Factory, 
  ArrowRight, 
  Wrench, 
  Layers, 
  Image,
  Rocket,
  ChevronDown,
  Check,
  Building2,
  FolderOpen,
  Clock,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useSubsidiary } from '@/contexts/SubsidiaryContext';
import type { SubsidiaryModule } from '@/types/subsidiary';
import { ROUTES } from '../routes';

const MODULE_CONFIG: Record<SubsidiaryModule, {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
}> = {
  'design-manager': {
    title: 'Design Manager',
    description: 'Manage projects, design items, and production optimization',
    icon: Palette,
    href: '/design',
    color: 'bg-[#872E5C]',
  },
  'clipper': {
    title: 'Design Clipper',
    description: 'Clip inspiration images from the web',
    icon: Image,
    href: '/clipper',
    color: 'bg-indigo-600',
  },
  'asset-registry': {
    title: 'Asset Registry',
    description: 'Manage workshop machines and tools',
    icon: Wrench,
    href: ROUTES.ASSETS,
    color: 'bg-amber-500',
  },
  'feature-library': {
    title: 'Feature Library',
    description: 'Manufacturing capabilities linked to assets',
    icon: Layers,
    href: ROUTES.FEATURES,
    color: 'bg-purple-600',
  },
  'launch-pipeline': {
    title: 'Launch Pipeline',
    description: 'Manage product launches and roadmap',
    icon: Rocket,
    href: '/launch-pipeline',
    color: 'bg-rose-600',
  },
  'procurement': {
    title: 'Procurement',
    description: 'Material procurement and supplier orders',
    icon: Package,
    href: ROUTES.PROCUREMENT,
    color: 'bg-cyan-600',
  },
  'production': {
    title: 'Production',
    description: 'Track production progress and scheduling',
    icon: Factory,
    href: ROUTES.PRODUCTION,
    color: 'bg-slate-600',
  },
  'matflow': {
    title: 'MatFlow',
    description: 'Material flow tracking and project management',
    icon: Package,
    href: '/advisory/matflow',
    color: 'bg-amber-600',
  },
};

function SubsidiarySelector() {
  const { subsidiaries, currentSubsidiary, setCurrentSubsidiary } = useSubsidiary();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentSubsidiary) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors shadow-sm"
      >
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
          style={{ backgroundColor: currentSubsidiary.color }}
        >
          {currentSubsidiary.shortName.charAt(0)}
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold text-gray-900">{currentSubsidiary.name}</p>
          <p className="text-xs text-gray-500">{currentSubsidiary.description}</p>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="p-2">
            <p className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Select Subsidiary
            </p>
            {subsidiaries.map((subsidiary) => (
              <button
                key={subsidiary.id}
                onClick={() => {
                  if (subsidiary.status === 'active') {
                    setCurrentSubsidiary(subsidiary);
                    setIsOpen(false);
                  }
                }}
                disabled={subsidiary.status !== 'active'}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  subsidiary.status === 'active'
                    ? 'hover:bg-gray-50 cursor-pointer'
                    : 'opacity-50 cursor-not-allowed'
                } ${currentSubsidiary.id === subsidiary.id ? 'bg-gray-50' : ''}`}
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: subsidiary.color }}
                >
                  {subsidiary.shortName.charAt(0)}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    {subsidiary.name}
                    {subsidiary.status === 'coming-soon' && (
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                        Coming Soon
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">{subsidiary.description}</p>
                </div>
                {currentSubsidiary.id === subsidiary.id && (
                  <Check className="w-5 h-5 text-green-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatsCard({ 
  icon: Icon, 
  label, 
  value, 
  trend,
  color 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: number; 
  trend?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
          <TrendingUp className="w-3 h-3" />
          {trend}
        </div>
      )}
    </div>
  );
}

function ModuleCard({ 
  module,
  isAvailable 
}: { 
  module: SubsidiaryModule;
  isAvailable: boolean;
}) {
  const config = MODULE_CONFIG[module];
  const Icon = config.icon;

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-5 ${
        isAvailable ? 'hover:shadow-md hover:border-gray-300 transition-all' : 'opacity-50'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${config.color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            {config.title}
            {!isAvailable && (
              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                Coming Soon
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-500 mt-1">{config.description}</p>
          {isAvailable && (
            <Link
              to={config.href}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#872E5C] hover:text-[#6a2449] mt-3 group"
            >
              Open
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DawinOSDashboard() {
  const { currentSubsidiary, stats, isLoading } = useSubsidiary();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#872E5C]"></div>
      </div>
    );
  }

  // Get modules from current subsidiary - only show modules defined for this subsidiary
  const subsidiaryModules = currentSubsidiary?.modules || [];

  return (
    <div className="px-4 py-4 sm:px-6 sm:py-6 space-y-6">
      {/* Header with Subsidiary Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Building2 className="w-4 h-4" />
            <span>DawinOS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Welcome back
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your design-to-production workflow
          </p>
        </div>
        <SubsidiarySelector />
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={FolderOpen}
            label="Active Projects"
            value={stats.activeProjects}
            trend="+3 this week"
            color="bg-blue-500"
          />
          <StatsCard
            icon={Layers}
            label="Design Items"
            value={stats.totalDesignItems}
            color="bg-purple-500"
          />
          <StatsCard
            icon={Clock}
            label="Pending Tasks"
            value={stats.pendingTasks}
            color="bg-amber-500"
          />
          <StatsCard
            icon={CheckCircle}
            label="Completed"
            value={stats.completedThisMonth}
            trend="This month"
            color="bg-green-500"
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-[#872E5C] to-[#E18425] rounded-2xl p-6 text-white">
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/design"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
          >
            <Palette className="w-4 h-4" />
            New Project
          </Link>
          <Link
            to="/clipper"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
          >
            <Image className="w-4 h-4" />
            Clip Inspiration
          </Link>
          <Link
            to="/design/materials"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
          >
            <Package className="w-4 h-4" />
            Materials Library
          </Link>
          <Link
            to="/settings"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </Link>
        </div>
      </div>

      {/* Modules Grid - only shows modules configured for current subsidiary */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {currentSubsidiary?.name} Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subsidiaryModules.map((module) => (
            <ModuleCard
              key={module}
              module={module}
              isAvailable={true}
            />
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center py-4 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          DawinOS v1.0 • Design-to-Production Platform
        </p>
      </div>
    </div>
  );
}
