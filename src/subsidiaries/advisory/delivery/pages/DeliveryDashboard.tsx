/**
 * Delivery Dashboard - Portfolio overview for program managers
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { MetricCard } from '../components/common/MetricCard';

export function DeliveryDashboard() {
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [loading] = useState(false);

  // Mock data for demonstration
  const stats = {
    totalPrograms: 3,
    totalProjects: 12,
    activeProjects: 8,
    completedProjects: 3,
    delayedProjects: 2,
    totalBudget: 5200000000,
    totalSpent: 2340000000,
    avgProgress: 45,
  };

  const programs = [
    { id: 'prg-1', name: 'ARISE Health Centers', code: 'ARISE-2024' },
    { id: 'prg-2', name: 'UREP Schools', code: 'UREP-2024' },
    { id: 'prg-3', name: 'Rural Water Supply', code: 'RWS-2024' },
  ];

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000000) return `UGX ${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `UGX ${(amount / 1000000).toFixed(1)}M`;
    return `UGX ${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Infrastructure Delivery</h1>
          <p className="text-gray-600">
            {stats.totalPrograms} active programs • {stats.totalProjects} projects
          </p>
        </div>
        
        <select 
          className="px-3 py-2 border rounded-lg bg-white"
          value={selectedProgramId || 'all'}
          onChange={(e) => setSelectedProgramId(e.target.value === 'all' ? null : e.target.value)}
        >
          <option value="all">All Programs</option>
          {programs.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          icon={Building2}
          label="Total Projects"
          value={stats.totalProjects}
          iconColor="text-blue-500"
        />
        
        <MetricCard
          icon={Clock}
          label="Active"
          value={stats.activeProjects}
          iconColor="text-amber-500"
        />
        
        <MetricCard
          icon={CheckCircle}
          label="Completed"
          value={stats.completedProjects}
          iconColor="text-green-500"
        />
        
        <MetricCard
          icon={DollarSign}
          label="Total Budget"
          value={formatCurrency(stats.totalBudget)}
          iconColor="text-primary"
        />
        
        <MetricCard
          icon={TrendingUp}
          label="Avg. Progress"
          value={`${stats.avgProgress}%`}
          iconColor="text-indigo-500"
        />
        
        <MetricCard
          icon={AlertTriangle}
          label="Delayed"
          value={stats.delayedProjects}
          iconColor="text-red-500"
          highlight={stats.delayedProjects > 0 ? 'warning' : undefined}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects Overview */}
        <div className="lg:col-span-2 bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Projects Overview</h2>
            <Link 
              to="/advisory/delivery/projects" 
              className="text-primary text-sm hover:underline flex items-center"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {/* Placeholder project items */}
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Project {i}</div>
                  <div className="text-sm text-gray-500">Location • District</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{40 + i * 10}%</div>
                  <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                    <div 
                      className="h-full bg-green-500 rounded-full" 
                      style={{ width: `${40 + i * 10}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Chart */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-medium mb-4">Budget Overview</h2>
          
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(stats.totalBudget)}
              </div>
              <div className="text-sm text-gray-500">Total Budget</div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Utilized</span>
                <span className="font-medium">
                  {((stats.totalSpent / stats.totalBudget) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(stats.totalSpent / stats.totalBudget) * 100}%` }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">
                  {formatCurrency(stats.totalSpent)}
                </div>
                <div className="text-xs text-gray-500">Spent</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {formatCurrency(stats.totalBudget - stats.totalSpent)}
                </div>
                <div className="text-xs text-gray-500">Remaining</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link 
          to="/advisory/delivery/projects"
          className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
        >
          <Building2 className="w-8 h-8 text-blue-500 mb-2" />
          <div className="font-medium">All Projects</div>
          <div className="text-sm text-gray-500">View and manage projects</div>
        </Link>
        
        <Link 
          to="/advisory/delivery/approvals"
          className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
        >
          <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
          <div className="font-medium">Approvals</div>
          <div className="text-sm text-gray-500">3 pending approvals</div>
        </Link>
        
        <Link 
          to="/advisory/delivery/programs"
          className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
        >
          <TrendingUp className="w-8 h-8 text-indigo-500 mb-2" />
          <div className="font-medium">Programs</div>
          <div className="text-sm text-gray-500">Program management</div>
        </Link>
        
        <Link 
          to="/advisory/delivery/reports"
          className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
        >
          <DollarSign className="w-8 h-8 text-primary mb-2" />
          <div className="font-medium">Reports</div>
          <div className="text-sm text-gray-500">Generate reports</div>
        </Link>
      </div>
    </div>
  );
}
