/**
 * Project Detail Page
 * Tab-based detail view for MatFlow projects
 */

import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  FileText, 
  ClipboardList, 
  Package, 
  TrendingUp, 
  Receipt,
  FileBarChart,
  Settings,
  Calendar,
  MapPin,
  Building2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Upload,
  Download,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useMatFlowProject, useProjectBOQItems, useProjectDeliveries } from '../hooks/useMatFlow';
import { formatCurrency, formatDate } from '../utils/formatters';

type Tab = 'overview' | 'boq' | 'deliveries' | 'variance' | 'invoices' | 'reports' | 'settings';

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  
  const { project, loading: projectLoading } = useMatFlowProject(projectId || '');
  const { items: boqItems, loading: boqLoading } = useProjectBOQItems(projectId || '');
  const { deliveries, loading: deliveriesLoading } = useProjectDeliveries(projectId || '');
  
  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: FileText },
    { id: 'boq' as Tab, label: 'BOQ Items', icon: ClipboardList },
    { id: 'deliveries' as Tab, label: 'Deliveries', icon: Package },
    { id: 'variance' as Tab, label: 'Variance', icon: TrendingUp },
    { id: 'invoices' as Tab, label: 'Invoices', icon: Receipt },
    { id: 'reports' as Tab, label: 'Reports', icon: FileBarChart },
    { id: 'settings' as Tab, label: 'Settings', icon: Settings },
  ];

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-medium text-gray-900">Project not found</h2>
          <Link 
            to="/advisory/matflow/projects" 
            className="text-amber-600 hover:underline mt-2 inline-block"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'on-hold': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          to="/advisory/matflow/projects"
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <span className={cn('text-xs px-2 py-1 rounded-full font-medium', getStatusColor(project.status))}>
              {project.status}
            </span>
          </div>
          
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              {project.customerName || 'No client'}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {project.location?.district || 'No location'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(project.createdAt as unknown as Date)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/advisory/matflow/projects/${projectId}/import`}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            <Upload className="w-4 h-4" />
            Import BOQ
          </Link>
          <button className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium">
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <ClipboardList className="w-4 h-4" />
            <span className="text-sm">BOQ Items</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{boqItems?.length || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Package className="w-4 h-4" />
            <span className="text-sm">Deliveries</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{deliveries?.length || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Budget Used</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(project.totalActualCost || 0, 'UGX')}
          </p>
          <p className="text-xs text-gray-500">
            of {formatCurrency(project.totalPlannedCost || 0, 'UGX')}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Variance</span>
          </div>
          <p className={cn(
            'text-2xl font-bold',
            (project.totalActualCost || 0) > (project.totalPlannedCost || 0) ? 'text-red-600' : 'text-green-600'
          )}>
            {((project.totalActualCost || 0) - (project.totalPlannedCost || 0)) >= 0 ? '+' : ''}
            {formatCurrency((project.totalActualCost || 0) - (project.totalPlannedCost || 0), 'UGX')}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
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
          <OverviewTab project={project} boqItems={boqItems || []} deliveries={deliveries || []} />
        )}
        
        {activeTab === 'boq' && (
          <BOQTab projectId={projectId!} items={boqItems || []} loading={boqLoading} />
        )}
        
        {activeTab === 'deliveries' && (
          <DeliveriesTab projectId={projectId!} deliveries={deliveries || []} loading={deliveriesLoading} />
        )}
        
        {activeTab === 'variance' && (
          <VarianceTab projectId={projectId!} />
        )}
        
        {activeTab === 'invoices' && (
          <InvoicesTab projectId={projectId!} />
        )}
        
        {activeTab === 'reports' && (
          <ReportsTab projectId={projectId!} project={project} />
        )}
        
        {activeTab === 'settings' && (
          <SettingsTab project={project} />
        )}
      </div>
    </div>
  );
};

// Overview Tab
function OverviewTab({ project, deliveries }: { project: any; boqItems?: any[]; deliveries: any[] }) {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Info */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Project Information</h3>
          <dl className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <dt className="text-gray-500">Client</dt>
              <dd className="font-medium">{project.customerName || '-'}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <dt className="text-gray-500">Location</dt>
              <dd className="font-medium">{project.location?.district || '-'}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <dt className="text-gray-500">Created</dt>
              <dd className="font-medium">{formatDate(project.createdAt as unknown as Date)}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <dt className="text-gray-500">Status</dt>
              <dd className="font-medium">{project.status || '-'}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <dt className="text-gray-500">BOQ Status</dt>
              <dd className="font-medium">{project.boqStatus || '-'}</dd>
            </div>
          </dl>
        </div>
        
        {/* Recent Activity */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {deliveries.slice(0, 5).map((delivery: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Package className="w-4 h-4 text-amber-600 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {delivery.description || 'Delivery'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(delivery.deliveryDate)} • {delivery.supplierName}
                  </p>
                </div>
              </div>
            ))}
            {deliveries.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Description */}
      {project.description && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
          <p className="text-gray-600">{project.description}</p>
        </div>
      )}
    </div>
  );
}

// BOQ Tab
function BOQTab({ projectId, items, loading }: { projectId: string; items: any[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Bill of Quantities</h3>
        <div className="flex gap-2">
          <Link
            to={`/advisory/matflow/projects/${projectId}/import`}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Upload className="w-4 h-4" />
            Import
          </Link>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>
      
      {items.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No BOQ items yet</h3>
          <p className="text-gray-500 mb-4">Import a BOQ spreadsheet or add items manually</p>
          <Link
            to={`/advisory/matflow/projects/${projectId}/import`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            <Upload className="w-4 h-4" />
            Import BOQ
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Item</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Unit</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Qty</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Unit Price</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Total</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Delivered</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900">{item.description}</p>
                    <p className="text-xs text-gray-500">{item.itemCode}</p>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{item.unit}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{item.quantity}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(item.unitPrice, 'UGX')}</td>
                  <td className="py-3 px-4 text-right font-medium">{formatCurrency(item.totalPrice, 'UGX')}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={cn(
                      'text-sm',
                      item.deliveredQuantity >= item.quantity ? 'text-green-600' : 'text-amber-600'
                    )}>
                      {item.deliveredQuantity || 0} / {item.quantity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Deliveries Tab
function DeliveriesTab({ deliveries, loading }: { projectId?: string; deliveries: any[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Deliveries</h3>
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700">
          <Plus className="w-4 h-4" />
          Log Delivery
        </button>
      </div>
      
      {deliveries.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No deliveries yet</h3>
          <p className="text-gray-500">Log material deliveries to track procurement</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deliveries.map((delivery: any) => (
            <div key={delivery.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{delivery.description}</p>
                <p className="text-sm text-gray-500">
                  {delivery.supplierName} • {formatDate(delivery.deliveryDate)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatCurrency(delivery.totalAmount, 'UGX')}</p>
                <p className="text-xs text-gray-500">{delivery.invoiceNumber}</p>
              </div>
              <div>
                {delivery.efrisValidated ? (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    EFRIS
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-yellow-600">
                    <Clock className="w-4 h-4" />
                    Pending
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Variance Tab
function VarianceTab(_props: { projectId?: string }) {
  return (
    <div className="p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Variance Analysis</h3>
      <div className="text-center py-12">
        <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">Variance analysis coming soon</h3>
        <p className="text-gray-500">Track budget vs actual costs by category</p>
      </div>
    </div>
  );
}

// Invoices Tab
function InvoicesTab(_props: { projectId?: string }) {
  return (
    <div className="p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Invoices & Tax Compliance</h3>
      <div className="text-center py-12">
        <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">Invoice tracking coming soon</h3>
        <p className="text-gray-500">Track invoices and EFRIS compliance</p>
      </div>
    </div>
  );
}

// Reports Tab
function ReportsTab(_props: { projectId?: string; project?: any }) {
  return (
    <div className="p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Reports</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { name: 'BOQ Summary', description: 'Complete bill of quantities', icon: ClipboardList },
          { name: 'Procurement Log', description: 'All deliveries and suppliers', icon: Package },
          { name: 'Variance Report', description: 'Budget vs actual analysis', icon: TrendingUp },
          { name: 'Tax Compliance', description: 'EFRIS validation report', icon: Receipt },
          { name: 'Project Overview', description: 'Executive summary', icon: FileBarChart },
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
  );
}

// Settings Tab
function SettingsTab({ project }: { project: any }) {
  return (
    <div className="p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Project Settings</h3>
      <div className="max-w-2xl space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
          <input
            type="text"
            defaultValue={project.name}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
          <input
            type="text"
            defaultValue={project.clientName || ''}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            defaultValue={project.location || ''}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            rows={3}
            defaultValue={project.description || ''}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div className="pt-4">
          <button className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProjectDetail;
