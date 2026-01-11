/**
 * Admin Dashboard Page
 * Main admin interface with logo management and other admin tools
 */

import { useState } from 'react';
import { 
  Building2, 
  Settings, 
  Users, 
  Shield, 
  BarChart3, 
  FileText, 
  Database,
  Bell,
  Palette
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { useAuth } from '@/core/hooks/useAuth';
import { useOrganizationSettings } from '@/core/settings';
import LogoUpload from '@/shared/components/admin/LogoUpload';
import SubsidiaryBranding from '@/shared/components/admin/SubsidiaryBranding';

type AdminTab = 'overview' | 'branding' | 'subsidiaries' | 'users' | 'system';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { settings, isLoading: settingsLoading } = useOrganizationSettings();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please sign in to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  if (settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300"></div>
      </div>
    );
  }

  const handleLogoChange = (logoUrl: string | undefined) => {
    console.log('Logo updated:', logoUrl);
    // The organization settings hook will automatically update the UI
  };

  return (
    <>
      <Helmet>
        <title>Administration | DawinOS Management</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                {settings?.branding?.subsidiaries?.['dawin-group']?.logoUrl ? (
                  <img 
                    src={settings.branding.subsidiaries['dawin-group'].logoUrl} 
                    alt="Logo"
                    className="h-8 w-auto object-contain"
                  />
                ) : (
                  <Building2 className="h-8 w-8 text-gray-600" />
                )}
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
                  <p className="text-sm text-gray-500">DawinOS Management</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Bell className="w-4 h-4" />
                </Button>
                <div className="text-sm text-gray-600">
                  {user.displayName}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AdminTab)} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="branding" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                <span className="hidden sm:inline">Branding</span>
              </TabsTrigger>
              <TabsTrigger value="subsidiaries" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span className="hidden sm:inline">Subsidiaries</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">System</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg">Total Users</CardTitle>
                    <Badge variant="secondary">Active</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">24</div>
                    <p className="text-sm text-muted-foreground">+2 this month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg">Active Projects</CardTitle>
                    <Badge variant="secondary">This Week</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">12</div>
                    <p className="text-sm text-muted-foreground">3 pending review</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg">Quotes Generated</CardTitle>
                    <Badge variant="secondary">This Month</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">47</div>
                    <p className="text-sm text-muted-foreground">15 awaiting response</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg">Storage Used</CardTitle>
                    <Badge variant="secondary">Firebase</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">2.4 GB</div>
                    <p className="text-sm text-muted-foreground">of 10 GB</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Branding Tab */}
            <TabsContent value="branding" className="space-y-6">
              <LogoUpload 
                currentLogoUrl={settings?.branding?.subsidiaries?.['dawin-group']?.logoUrl}
                onLogoChange={handleLogoChange}
              />
            </TabsContent>

            {/* Subsidiaries Tab */}
            <TabsContent value="subsidiaries" className="space-y-6">
              <SubsidiaryBranding />
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Manage user accounts, roles, and permissions
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">User Management</h3>
                        <p className="text-sm text-muted-foreground">Add, edit, and remove user accounts</p>
                      </div>
                      <Button>Manage Users</Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">Role Management</h3>
                        <p className="text-sm text-muted-foreground">Configure user roles and permissions</p>
                      </div>
                      <Button>Manage Roles</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Tab */}
            <TabsContent value="system" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>System Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Organization:</span>
                        <span>{settings?.info?.name || 'Not set'}</span>
                      </div>
                      <div>
                        <span className="font-medium">Default Currency:</span>
                        <span>{settings?.defaultCurrency || 'UGX'}</span>
                      </div>
                      <div>
                        <span className="font-medium">Timezone:</span>
                        <span>{settings?.timezone || 'Africa/Kampala'}</span>
                      </div>
                      <div>
                        <span className="font-medium">Last Updated:</span>
                        <span>{settings?.updatedAt ? new Date(settings.updatedAt).toLocaleDateString() : 'Never'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full justify-start" variant="outline">
                      <Database className="w-4 h-4 mr-2" />
                      Database Backup
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <FileText className="w-4 h-4 mr-2" />
                      Export Reports
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Shield className="w-4 h-4 mr-2" />
                      Security Audit
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
