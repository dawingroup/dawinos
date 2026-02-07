/**
 * DawinOS Global Settings Page
 * Tab-based settings for organization, users, and access control
 */

import { useState, useRef, useEffect } from 'react';

// Adobe DC View SDK type declaration
declare global {
  interface Window {
    AdobeDC?: {
      View: new (config: { clientId: string; divId: string }) => {
        previewFile: (
          content: { content: { location: { url: string } }; metaData: { fileName: string } },
          config: Record<string, unknown>
        ) => Promise<void>;
      };
    };
  }
}
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  Shield,
  FileText,
  Palette,
  Globe,
  Clock,
  Mail,
  UserPlus,
  Check,
  X,
  ChevronLeft,
  Loader2,
  Upload,
  AlertCircle,
  Plug,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useAuth } from '@/core/hooks/useAuth';
import {
  useOrganizationSettings,
  useUsers,
  useCurrentDawinUser,
  useUserMutations,
  uploadOrganizationLogo,
  deleteOrganizationLogo,
  GLOBAL_ROLE_DEFINITIONS,
  type DawinUser,
  type GlobalRole,
} from '@/core/settings';
import { useSubsidiary } from '@/contexts/SubsidiaryContext';
import { BrandingSettings } from '@/shared/components/branding';

type Tab = 'general' | 'branding' | 'users' | 'access' | 'integrations' | 'templates';

const tabs = [
  { id: 'general' as Tab, label: 'General', icon: Building2 },
  { id: 'branding' as Tab, label: 'Branding', icon: Palette },
  { id: 'users' as Tab, label: 'Users', icon: Users },
  { id: 'access' as Tab, label: 'Access Control', icon: Shield },
  { id: 'integrations' as Tab, label: 'Integrations', icon: Plug },
  { id: 'templates' as Tab, label: 'Templates', icon: FileText, disabled: true },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const { user } = useAuth();
  const { hasPermission } = useCurrentDawinUser();
  
  const canEditSettings = hasPermission('settings:edit');
  const canManageUsers = hasPermission('users:edit');

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please sign in to access settings.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500">Manage organization settings, users, and access control</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                disabled={tab.disabled}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-[#872E5C] text-[#872E5C]'
                    : 'border-transparent text-gray-500 hover:text-gray-700',
                  tab.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.disabled && (
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200">
        {activeTab === 'general' && <GeneralTab canEdit={canEditSettings} />}
        {activeTab === 'branding' && <BrandingTab canEdit={canEditSettings} />}
        {activeTab === 'users' && <UsersTab canManage={canManageUsers} />}
        {activeTab === 'access' && <AccessControlTab canManage={canManageUsers} />}
        {activeTab === 'integrations' && <IntegrationsTab />}
        {activeTab === 'templates' && <TemplatesTab />}
      </div>
    </div>
  );
}

// ============================================================================
// GENERAL TAB
// ============================================================================

function GeneralTab({ canEdit }: { canEdit: boolean }) {
  const { settings, isLoading, updateSettings } = useOrganizationSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    email: '',
    phone: '',
    website: '',
    defaultCurrency: 'UGX',
    timezone: 'Africa/Kampala',
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const handleSave = async () => {
    try {
      await updateSettings({
        info: {
          name: formData.name,
          shortName: formData.shortName,
          email: formData.email,
          phone: formData.phone,
          website: formData.website,
        },
        defaultCurrency: formData.defaultCurrency,
        timezone: formData.timezone,
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Organization Information</h3>
        {canEdit && !isEditing && (
          <button
            onClick={() => {
              setFormData({
                name: settings?.info?.name || '',
                shortName: settings?.info?.shortName || '',
                email: settings?.info?.email || '',
                phone: settings?.info?.phone || '',
                website: settings?.info?.website || '',
                defaultCurrency: settings?.defaultCurrency || 'UGX',
                timezone: settings?.timezone || 'Africa/Kampala',
              });
              setIsEditing(true);
            }}
            className="text-sm text-[#872E5C] hover:text-[#6a2449]"
          >
            Edit
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Organization Name
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#872E5C] focus:border-transparent"
            />
          ) : (
            <p className="text-gray-900">{settings?.info?.name || 'Not set'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Short Name
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.shortName}
              onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#872E5C] focus:border-transparent"
            />
          ) : (
            <p className="text-gray-900">{settings?.info?.shortName || 'Not set'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Mail className="w-4 h-4 inline mr-1" />
            Email
          </label>
          {isEditing ? (
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#872E5C] focus:border-transparent"
            />
          ) : (
            <p className="text-gray-900">{settings?.info?.email || 'Not set'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          {isEditing ? (
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#872E5C] focus:border-transparent"
            />
          ) : (
            <p className="text-gray-900">{settings?.info?.phone || 'Not set'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Globe className="w-4 h-4 inline mr-1" />
            Website
          </label>
          {isEditing ? (
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#872E5C] focus:border-transparent"
            />
          ) : (
            <p className="text-gray-900">{settings?.info?.website || 'Not set'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Default Currency
          </label>
          {isEditing ? (
            <select
              value={formData.defaultCurrency}
              onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#872E5C] focus:border-transparent"
            >
              <option value="UGX">UGX - Ugandan Shilling</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="KES">KES - Kenyan Shilling</option>
            </select>
          ) : (
            <p className="text-gray-900">{settings?.defaultCurrency || 'UGX'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Clock className="w-4 h-4 inline mr-1" />
            Timezone
          </label>
          {isEditing ? (
            <select
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#872E5C] focus:border-transparent"
            >
              <option value="Africa/Kampala">Africa/Kampala (EAT)</option>
              <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
              <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="America/New_York">America/New_York (EST)</option>
            </select>
          ) : (
            <p className="text-gray-900">{settings?.timezone || 'Africa/Kampala'}</p>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#872E5C] text-white rounded-lg hover:bg-[#6a2449]"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// BRANDING TAB
// ============================================================================

function BrandingTab({ canEdit }: { canEdit: boolean }) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Platform Branding</h3>
        <p className="text-sm text-gray-500 mt-1">
          Manage your platform's logo and favicon. These appear in the header and browser tab.
        </p>
      </div>
      <BrandingSettings />
    </div>
  );
}

// ============================================================================
// USERS TAB
// ============================================================================

function UsersTab({ canManage }: { canManage: boolean }) {
  const { users, isLoading } = useUsers();
  const { updateUserRole, deactivateUser, reactivateUser, isSubmitting } = useUserMutations();

  const FIREBASE_PROJECT_ID = 'dawinos';
  const firebaseAuthUrl = `https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/authentication/users`;

  const getRoleBadgeColor = (role: GlobalRole) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'manager': return 'bg-green-100 text-green-800';
      case 'member': return 'bg-gray-100 text-gray-800';
      case 'viewer': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Firebase Auth Integration Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-amber-900">User Access Control</h4>
            <p className="text-sm text-amber-700 mt-1">
              New users must be pre-approved in Firebase Authentication before they can sign in to DawinOS.
              Once approved, they will appear here after their first sign-in.
            </p>
            <a
              href={firebaseAuthUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium"
            >
              <UserPlus className="w-4 h-4" />
              Manage Users in Firebase
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Team Members Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
          <p className="text-sm text-gray-500">Users who have signed in to DawinOS</p>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No users yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                {u.photoUrl ? (
                  <img src={u.photoUrl} alt="" className="w-10 h-10 rounded-full" />
                ) : (
                  <span className="text-gray-600 font-medium">
                    {u.displayName?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 truncate">{u.displayName}</p>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full', getRoleBadgeColor(u.globalRole))}>
                    {u.globalRole}
                  </span>
                  {!u.isActive && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">{u.email}</p>
              </div>

              {canManage && u.globalRole !== 'owner' && (
                <div className="flex items-center gap-2">
                  <select
                    value={u.globalRole}
                    onChange={(e) => updateUserRole(u.id, e.target.value as GlobalRole)}
                    disabled={isSubmitting}
                    className="text-sm border border-gray-300 rounded-lg px-2 py-1"
                  >
                    {GLOBAL_ROLE_DEFINITIONS.filter(r => r.role !== 'owner').map((role) => (
                      <option key={role.role} value={role.role}>
                        {role.name}
                      </option>
                    ))}
                  </select>

                  {u.isActive ? (
                    <button
                      onClick={() => deactivateUser(u.id)}
                      disabled={isSubmitting}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Deactivate"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => reactivateUser(u.id)}
                      disabled={isSubmitting}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Reactivate"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ACCESS CONTROL TAB
// ============================================================================

function AccessControlTab({ canManage }: { canManage: boolean }) {
  const { users, isLoading } = useUsers();
  const { subsidiaries } = useSubsidiary();
  const { updateUserAccess, isSubmitting } = useUserMutations();
  const [selectedUser, setSelectedUser] = useState<DawinUser | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Module Access Control</h3>
        <p className="text-sm text-gray-500 mt-1">
          Configure which subsidiaries and modules each user can access
        </p>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No users to configure</p>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((u) => (
            <div key={u.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div
                className="flex items-center gap-4 p-4 bg-gray-50 cursor-pointer"
                onClick={() => setSelectedUser(selectedUser?.id === u.id ? null : u)}
              >
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-medium text-sm">
                    {u.displayName?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{u.displayName}</p>
                  <p className="text-sm text-gray-500">{u.email}</p>
                </div>
                <div className="text-sm text-gray-500">
                  {u.subsidiaryAccess?.filter(s => s.hasAccess).length || 0} subsidiaries
                </div>
              </div>

              {selectedUser?.id === u.id && (
                <div className="p-4 border-t border-gray-200">
                  <div className="space-y-4">
                    {subsidiaries.map((sub) => {
                      const access = u.subsidiaryAccess?.find(s => s.subsidiaryId === sub.id);
                      const hasAccess = access?.hasAccess ?? false;

                      return (
                        <div key={sub.id} className="flex items-start gap-4">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                            style={{ backgroundColor: sub.color }}
                          >
                            {sub.shortName.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">{sub.name}</p>
                              {canManage && (
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={hasAccess}
                                    onChange={(e) => {
                                      const newAccess = u.subsidiaryAccess?.filter(
                                        s => s.subsidiaryId !== sub.id
                                      ) || [];
                                      if (e.target.checked) {
                                        newAccess.push({
                                          subsidiaryId: sub.id,
                                          hasAccess: true,
                                          modules: sub.modules.map(m => ({
                                            moduleId: m,
                                            hasAccess: true,
                                          })),
                                        });
                                      }
                                      updateUserAccess(u.id, newAccess);
                                    }}
                                    disabled={isSubmitting}
                                    className="sr-only peer"
                                  />
                                  <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-[#872E5C] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#872E5C]"></div>
                                </label>
                              )}
                            </div>
                            
                            {hasAccess && sub.modules.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {sub.modules.map((mod) => {
                                  const modAccess = access?.modules?.find(m => m.moduleId === mod);
                                  const hasModAccess = modAccess?.hasAccess ?? true;

                                  return (
                                    <span
                                      key={mod}
                                      className={cn(
                                        'text-xs px-2 py-1 rounded-full',
                                        hasModAccess
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-gray-100 text-gray-500'
                                      )}
                                    >
                                      {mod}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// INTEGRATIONS TAB
// ============================================================================

function IntegrationsTab() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">External Integrations</h3>
        <p className="text-sm text-gray-500 mt-1">
          Test and manage connections to external services
        </p>
      </div>

      {/* Adobe PDF Services */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Ai</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Adobe PDF Services</h4>
              <p className="text-sm text-gray-500">PDF creation, extraction, compression & more</p>
            </div>
          </div>
        </div>
        <div className="p-4">
          <AdobePdfTestPanel />
        </div>
      </div>

      {/* Adobe PDF Embed API */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PDF</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Adobe PDF Embed API</h4>
              <p className="text-sm text-gray-500">In-browser PDF viewing with annotations</p>
            </div>
          </div>
        </div>
        <div className="p-4">
          <AdobePdfEmbedTestPanel />
        </div>
      </div>

      {/* Placeholder for other integrations */}
      <div className="border border-gray-200 rounded-lg p-4 opacity-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
            <Plug className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <h4 className="font-medium text-gray-500">More Integrations Coming Soon</h4>
            <p className="text-sm text-gray-400">Adobe Sign, Photoshop, Firefly & more</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Adobe PDF Test Panel (inline for settings page)
// Uses Firebase callable functions (httpsCallable) which handle auth automatically
function AdobePdfTestPanel() {
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('Click a button to test Adobe PDF Services');
  const [resultData, setResultData] = useState<unknown>(null);

  // Helper to call Firebase callable functions
  const callAdobeFunction = async (functionName: string, data: object) => {
    if (!user) {
      throw new Error('You must be logged in to test Adobe services.');
    }

    const { httpsCallable } = await import('firebase/functions');
    const { functions } = await import('@/shared/services/firebase');

    const callable = httpsCallable(functions, functionName);
    const result = await callable(data);
    return result.data;
  };

  const testConnectivity = async () => {
    setStatus('loading');
    setMessage('Testing Adobe API connectivity...');
    setResultData(null);

    try {
      // Call with empty data - should get "Input file reference required" error
      // which proves the function is working
      await callAdobeFunction('adobeCreatePdf', {});
      setStatus('success');
      setMessage('Adobe API connectivity verified! Functions are working.');
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string };
      const errorMessage = err.message || '';

      if (errorMessage.includes('Input file reference required') || errorMessage.includes('input')) {
        setStatus('success');
        setMessage('Adobe API connectivity verified! Functions are working.');
        return;
      }
      if (errorMessage.includes('Adobe OAuth token request failed') || errorMessage.includes('OAuth')) {
        setStatus('error');
        setMessage('Adobe authentication failed. Check your credentials in Firebase secrets.');
        return;
      }
      if (errorMessage.includes('not configured')) {
        setStatus('error');
        setMessage('Adobe PDF Services not configured. Check Firebase secrets.');
        return;
      }
      if (err.code === 'unauthenticated' || errorMessage.includes('unauthenticated')) {
        setStatus('error');
        setMessage('You must be logged in to test Adobe services.');
        return;
      }
      setStatus('error');
      setMessage(`Unexpected error: ${errorMessage}`);
    }
  };

  const testExtractPdf = async () => {
    setStatus('loading');
    setMessage('Extracting text from sample PDF...');
    setResultData(null);

    try {
      const response = await callAdobeFunction('adobeExtractPdf', {
        input: {
          type: 'url',
          value: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea%20Brochure.pdf',
        },
        elementsToExtract: ['text'],
      });

      setStatus('success');
      setMessage('PDF extraction successful!');
      setResultData(response);
    } catch (error: unknown) {
      const err = error as { message?: string };
      setStatus('error');
      setMessage(`Extraction failed: ${err.message}`);
    }
  };

  const testCompressPdf = async () => {
    setStatus('loading');
    setMessage('Compressing sample PDF...');
    setResultData(null);

    try {
      const response = await callAdobeFunction('adobeCompressPdf', {
        input: {
          type: 'url',
          value: 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea%20Brochure.pdf',
        },
        compressionLevel: 'MEDIUM',
      });

      const data = response as {
        originalSize?: number;
        compressedSize?: number;
        compressionRatio?: number;
      };

      setStatus('success');
      setMessage(`Compression successful! ${data.originalSize?.toLocaleString()} → ${data.compressedSize?.toLocaleString()} bytes (${Math.round((data.compressionRatio || 0) * 100)}% reduction)`);
      setResultData(response);
    } catch (error: unknown) {
      const err = error as { message?: string };
      setStatus('error');
      setMessage(`Compression failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={testConnectivity}
          disabled={status === 'loading'}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          Test Connectivity
        </button>
        <button
          onClick={testExtractPdf}
          disabled={status === 'loading'}
          className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          Test Extract PDF
        </button>
        <button
          onClick={testCompressPdf}
          disabled={status === 'loading'}
          className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          Test Compress PDF
        </button>
      </div>

      <div className={cn(
        'p-4 rounded-lg',
        status === 'loading' && 'bg-blue-50',
        status === 'success' && 'bg-green-50',
        status === 'error' && 'bg-red-50',
        status === 'idle' && 'bg-gray-50'
      )}>
        <p className={cn(
          'font-medium text-sm',
          status === 'loading' && 'text-blue-600',
          status === 'success' && 'text-green-600',
          status === 'error' && 'text-red-600',
          status === 'idle' && 'text-gray-600'
        )}>
          {status === 'loading' && <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />}
          {status === 'success' && <Check className="w-4 h-4 inline mr-2" />}
          {status === 'error' && <X className="w-4 h-4 inline mr-2" />}
          {message}
        </p>

        {resultData && (
          <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-32 border">
            {JSON.stringify(resultData, null, 2).slice(0, 500)}
            {JSON.stringify(resultData, null, 2).length > 500 && '...'}
          </pre>
        )}
      </div>
    </div>
  );
}

// Adobe PDF Embed Test Panel - uses a portal-like pattern to avoid React DOM conflicts
function AdobePdfEmbedTestPanel() {
  const [viewerState, setViewerState] = useState<'hidden' | 'loading' | 'ready'>('hidden');
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const testPdfUrl = 'https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea%20Brochure.pdf';
  const clientId = import.meta.env.VITE_ADOBE_CLIENT_ID;
  const viewDivId = 'adobe-pdf-embed-viewer';

  // Cleanup function to safely remove Adobe SDK content
  const cleanupViewer = () => {
    const viewerDiv = document.getElementById(viewDivId);
    if (viewerDiv) {
      // Remove all children added by Adobe SDK
      while (viewerDiv.firstChild) {
        viewerDiv.removeChild(viewerDiv.firstChild);
      }
    }
  };

  const hideViewer = () => {
    cleanupViewer();
    setViewerState('hidden');
  };

  const loadPdfViewer = async () => {
    if (!clientId) {
      setError('VITE_ADOBE_CLIENT_ID not configured. Add it to your .env file.');
      return;
    }

    // Clean up any existing viewer content first
    cleanupViewer();

    setViewerState('loading');
    setError(null);

    try {
      // Dynamically load the Adobe DC View SDK
      if (!window.AdobeDC) {
        await new Promise<void>((resolve, reject) => {
          // Check if script is already loading
          const existingScript = document.querySelector('script[src*="acrobatservices.adobe.com/view-sdk"]');
          if (existingScript) {
            const checkReady = () => {
              if (window.AdobeDC) resolve();
              else setTimeout(checkReady, 100);
            };
            checkReady();
            return;
          }

          const script = document.createElement('script');
          script.src = 'https://acrobatservices.adobe.com/view-sdk/viewer.js';
          script.async = true;
          script.onload = () => {
            const checkReady = () => {
              if (window.AdobeDC) resolve();
              else setTimeout(checkReady, 100);
            };
            checkReady();
          };
          script.onerror = () => reject(new Error('Failed to load Adobe PDF Embed SDK'));
          document.head.appendChild(script);
        });
      }

      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 50));

      const adobeDCView = new window.AdobeDC!.View({
        clientId: clientId,
        divId: viewDivId,
      });

      await adobeDCView.previewFile(
        {
          content: { location: { url: testPdfUrl } },
          metaData: { fileName: 'Bodea Brochure.pdf' },
        },
        {
          embedMode: 'SIZED_CONTAINER',
          defaultViewMode: 'FIT_WIDTH',
          showDownloadPDF: true,
          showPrintPDF: true,
          showFullScreen: true,
          showAnnotationTools: false,
        }
      );

      setViewerState('ready');
    } catch (err) {
      setViewerState('hidden');
      setError(err instanceof Error ? err.message : 'Failed to load PDF viewer');
    }
  };

  return (
    <div className="space-y-4" ref={containerRef}>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={loadPdfViewer}
          disabled={viewerState === 'loading'}
          className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {viewerState === 'loading' ? 'Loading...' : viewerState === 'ready' ? 'Reload PDF Viewer' : 'Test PDF Embed'}
        </button>
        {viewerState !== 'hidden' && (
          <button
            onClick={hideViewer}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
          >
            Hide Viewer
          </button>
        )}
      </div>

      {!clientId && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
          <AlertCircle className="w-4 h-4 inline mr-2" />
          VITE_ADOBE_CLIENT_ID not configured. Add your Adobe Client ID to the .env file.
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <X className="w-4 h-4 inline mr-2" />
          {error}
        </div>
      )}

      {/* Loading indicator - shown separately from the viewer div */}
      {viewerState === 'loading' && (
        <div className="flex items-center justify-center h-[500px] bg-gray-50 border border-gray-200 rounded-lg">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      )}

      {/*
        Adobe PDF Viewer container - ALWAYS rendered but hidden when not in use.
        This div must NOT have any React children as Adobe SDK manages it directly.
        We hide/show with CSS to avoid React DOM reconciliation issues.
      */}
      <div
        id={viewDivId}
        className="border border-gray-200 rounded-lg overflow-hidden"
        style={{
          height: viewerState === 'ready' ? '500px' : '0px',
          display: viewerState === 'ready' ? 'block' : 'none'
        }}
      />

      {viewerState === 'hidden' && !error && clientId && (
        <p className="text-sm text-gray-500">
          Click &quot;Test PDF Embed&quot; to load the Adobe PDF viewer with a sample document.
        </p>
      )}
    </div>
  );
}

// ============================================================================
// TEMPLATES TAB (Future)
// ============================================================================

function TemplatesTab() {
  return (
    <div className="p-6">
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">Document Templates</h3>
        <p className="text-gray-500 mb-4">
          Configure document templates for invoices, reports, and exports across modules.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          Coming Soon
        </div>
      </div>
    </div>
  );
}
