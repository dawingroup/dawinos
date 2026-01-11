/**
 * Project Detail Page
 * Tab-based detail view for MatFlow projects
 */

import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  Trash2,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useMatFlowProject, useProjectBOQItems, useProjectDeliveries, useProjectMutations } from '../hooks/useMatFlow';
import { formatCurrency, formatDate } from '../utils/formatters';

type Tab = 'overview' | 'boq' | 'deliveries' | 'variance' | 'invoices' | 'reports' | 'settings';

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  
  const { project, isLoading: projectLoading } = useMatFlowProject(projectId || '');
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
          <SettingsTab project={project} projectId={projectId!} />
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
                  <td className="py-3 px-4 text-right text-gray-600">{item.quantityContract || item.quantity || 0}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(item.rate || item.unitPrice || 0, 'UGX')}</td>
                  <td className="py-3 px-4 text-right font-medium">{formatCurrency(item.amount || item.totalPrice || 0, 'UGX')}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={cn(
                      'text-sm',
                      (item.quantityExecuted || 0) >= (item.quantityContract || item.quantity || 0) ? 'text-green-600' : 'text-amber-600'
                    )}>
                      {item.quantityExecuted || item.deliveredQuantity || 0} / {item.quantityContract || item.quantity || 0}
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
function SettingsTab({ project, projectId }: { project: any; projectId: string }) {
  const navigate = useNavigate();
  const { update, remove, isSubmitting } = useProjectMutations();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: project?.name || '',
    customerName: project?.customerName || '',
    district: project?.location?.district || '',
    address: project?.location?.address || '',
    description: project?.description || '',
    status: project?.status || 'draft',
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Sync form data when project changes
  React.useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        customerName: project.customerName || '',
        district: project.location?.district || '',
        address: project.location?.address || '',
        description: project.description || '',
        status: project.status || 'draft',
      });
    }
  }, [project]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      await update(projectId, {
        name: formData.name,
        description: formData.description,
        status: formData.status as any,
        location: {
          district: formData.district,
          address: formData.address,
        },
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to save:', err);
      setSaveStatus('error');
    }
  };

  return (
    <div className="p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Project Settings</h3>
      <div className="max-w-2xl space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
          <input
            type="text"
            value={formData.customerName}
            onChange={(e) => handleChange('customerName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
            <input
              type="text"
              value={formData.district}
              onChange={(e) => handleChange('district', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div className="pt-4 flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
          {saveStatus === 'saved' && (
            <span className="text-green-600 text-sm flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-red-600 text-sm">Failed to save</span>
          )}
        </div>

        {/* Danger Zone - Delete Project */}
        <div className="mt-12 pt-6 border-t border-red-200">
          <h4 className="text-red-600 font-semibold mb-2">Danger Zone</h4>
          <p className="text-sm text-gray-600 mb-4">
            Once you delete a project, there is no going back. Please be certain.
          </p>
          
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Project
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700 mb-3">
                Are you sure you want to delete <strong>{project?.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      await remove(projectId);
                      navigate('/advisory/matflow/projects');
                    } catch (err) {
                      console.error('Failed to delete:', err);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>Deleting...</>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Yes, Delete Project
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectDetail;
