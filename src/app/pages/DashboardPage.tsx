/**
 * Dashboard Page
 * Overview of all modules and quick access
 */

import { Link } from 'react-router-dom';
import { FileSpreadsheet, Palette, Package, Factory, ArrowRight } from 'lucide-react';
import { ROUTES } from '../routes';

const modules = [
  {
    title: 'Cutlist Processor',
    description: 'Upload CSV, optimize cutting patterns, generate outputs for PG Bison and Katana.',
    icon: FileSpreadsheet,
    href: ROUTES.CUTLIST,
    color: 'bg-[#872E5C]',
    available: true,
  },
  {
    title: 'Design Manager',
    description: 'Track design workflow with traffic light status, stage gates, and approvals.',
    icon: Palette,
    href: ROUTES.DESIGN,
    color: 'bg-[#0A7C8E]',
    available: true,
  },
  {
    title: 'Procurement',
    description: 'Manage material procurement and supplier orders.',
    icon: Package,
    href: ROUTES.PROCUREMENT,
    color: 'bg-gray-400',
    available: false,
  },
  {
    title: 'Production',
    description: 'Track production progress and workshop scheduling.',
    icon: Factory,
    href: ROUTES.PRODUCTION,
    color: 'bg-gray-400',
    available: false,
  },
];

export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome to Dawin Design-to-Production Platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <div
              key={module.title}
              className={`bg-white rounded-lg border border-gray-200 p-6 ${
                module.available ? 'hover:shadow-md transition-shadow' : 'opacity-60'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${module.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    {module.title}
                    {!module.available && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                        Coming Soon
                      </span>
                    )}
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">{module.description}</p>
                  {module.available && (
                    <Link
                      to={module.href}
                      className="inline-flex items-center gap-1 text-sm font-medium text-[#872E5C] hover:text-[#6a2449] mt-3"
                    >
                      Open Module
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
