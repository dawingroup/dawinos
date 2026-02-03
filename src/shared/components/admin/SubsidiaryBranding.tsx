/**
 * Subsidiary Branding Component
 * Manages branding for all Dawin subsidiaries
 */

import { useState, useRef } from 'react';
import { Building2, Upload, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Alert, AlertDescription } from '@/core/components/ui/alert';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import { uploadSubsidiaryLogo, deleteSubsidiaryLogo } from '@/core/settings';
import { useOrganizationSettings } from '@/core/settings';
import { cn } from '@/shared/lib/utils';

const SUBSIDIARIES = [
  { id: 'dawin-group', name: 'Dawin Group', description: 'Parent company' },
  { id: 'dawin-finishes', name: 'Dawin Finishes', description: 'Interior design & finishes' },
  { id: 'dawin-advisory', name: 'Dawin Advisory', description: 'Consulting & strategy' },
  { id: 'dawin-capital', name: 'Dawin Capital', description: 'Investment & finance' },
  { id: 'dawin-technology', name: 'Dawin Technology', description: 'Software & innovation' },
] as const;

type SubsidiaryId = typeof SUBSIDIARIES[number]['id'];

interface SubsidiaryBrandingTabProps {
  subsidiaryId: SubsidiaryId;
  subsidiary: typeof SUBSIDIARIES[number];
  branding: any;
  onBrandingUpdate: (subsidiaryId: SubsidiaryId, updates: any) => void;
}

function SubsidiaryBrandingTab({ 
  subsidiaryId, 
  subsidiary, 
  branding, 
  onBrandingUpdate 
}: SubsidiaryBrandingTabProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    setUploadError(null);
    
    try {
      const logoUrl = await uploadSubsidiaryLogo(file, subsidiaryId, 'primary');
      onBrandingUpdate(subsidiaryId, { logoUrl });
    } catch (error) {
      console.error('Failed to upload logo:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload logo');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteLogo = async () => {
    if (!confirm('Are you sure you want to delete the logo?')) return;

    setUploading(true);
    try {
      await deleteSubsidiaryLogo(subsidiaryId, 'primary');
      onBrandingUpdate(subsidiaryId, { logoUrl: undefined });
    } catch (error) {
      console.error('Failed to delete logo:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to delete logo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {subsidiary.name}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{subsidiary.description}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {uploadError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}

        {/* Logo Upload */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Logo</Label>
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden">
              {uploading ? (
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              ) : branding?.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={`${subsidiary.name} Logo`}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <Upload className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={handleLogoUpload}
                disabled={uploading}
                className="hidden"
              />
              <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? 'Uploading...' : branding?.logoUrl ? 'Change Logo' : 'Upload Logo'}
              </Button>
              {branding?.logoUrl && (
                <Button variant="destructive" onClick={handleDeleteLogo} disabled={uploading}>
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Brand Colors */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`${subsidiaryId}-primary`}>Primary Color</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id={`${subsidiaryId}-primary`}
                type="color"
                value={branding?.primaryColor || '#872E5C'}
                onChange={(e) => onBrandingUpdate(subsidiaryId, { primaryColor: e.target.value })}
                className="w-12 h-8 p-0 border-0"
              />
              <Input
                value={branding?.primaryColor || '#872E5C'}
                onChange={(e) => onBrandingUpdate(subsidiaryId, { primaryColor: e.target.value })}
                placeholder="#872E5C"
              />
            </div>
          </div>
          <div>
            <Label htmlFor={`${subsidiaryId}-secondary`}>Secondary Color</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id={`${subsidiaryId}-secondary`}
                type="color"
                value={branding?.secondaryColor || '#E18425'}
                onChange={(e) => onBrandingUpdate(subsidiaryId, { secondaryColor: e.target.value })}
                className="w-12 h-8 p-0 border-0"
              />
              <Input
                value={branding?.secondaryColor || '#E18425'}
                onChange={(e) => onBrandingUpdate(subsidiaryId, { secondaryColor: e.target.value })}
                placeholder="#E18425"
              />
            </div>
          </div>
        </div>

        {/* Additional Branding */}
        <div className="space-y-4">
          <div>
            <Label htmlFor={`${subsidiaryId}-tagline`}>Tagline</Label>
            <Input
              id={`${subsidiaryId}-tagline`}
              value={branding?.tagline || ''}
              onChange={(e) => onBrandingUpdate(subsidiaryId, { tagline: e.target.value })}
              placeholder="Enter tagline..."
            />
          </div>
          <div>
            <Label htmlFor={`${subsidiaryId}-description`}>Description</Label>
            <Textarea
              id={`${subsidiaryId}-description`}
              value={branding?.description || ''}
              onChange={(e) => onBrandingUpdate(subsidiaryId, { description: e.target.value })}
              placeholder="Enter description..."
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor={`${subsidiaryId}-website`}>Website</Label>
            <Input
              id={`${subsidiaryId}-website`}
              value={branding?.website || ''}
              onChange={(e) => onBrandingUpdate(subsidiaryId, { website: e.target.value })}
              placeholder="https://example.com"
            />
          </div>
        </div>

        {/* Preview */}
        <div>
          <Label>Preview</Label>
          <div 
            className="h-16 rounded-lg flex items-center justify-center text-white font-semibold mt-2"
            style={{
              background: `linear-gradient(to right, ${branding?.primaryColor || '#872E5C'}, ${branding?.secondaryColor || '#E18425'})`,
            }}
          >
            {branding?.logoUrl ? (
              <img src={branding.logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
            ) : (
              <span>{subsidiary.name}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SubsidiaryBranding() {
  const { settings, isLoading, updateSettings } = useOrganizationSettings();
  const [activeTab, setActiveTab] = useState<string>('dawin-group');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const branding = settings?.branding || {
    groupPrimaryColor: '#872E5C',
    groupSecondaryColor: '#E18425',
    subsidiaries: {
      'dawin-group': { primaryColor: '#872E5C', secondaryColor: '#E18425' },
      'dawin-finishes': { primaryColor: '#872E5C', secondaryColor: '#E18425' },
      'dawin-advisory': { primaryColor: '#1a365d', secondaryColor: '#3182ce' },
      'dawin-capital': { primaryColor: '#1a202c', secondaryColor: '#2d3748' },
      'dawin-technology': { primaryColor: '#553c9a', secondaryColor: '#805ad5' },
    }
  };

  const handleBrandingUpdate = async (subsidiaryId: SubsidiaryId, updates: any) => {
    const updatedBranding = {
      ...branding,
      subsidiaries: {
        ...branding.subsidiaries,
        [subsidiaryId]: {
          ...branding.subsidiaries[subsidiaryId],
          ...updates,
        },
      },
    };

    await updateSettings({
      branding: updatedBranding,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Subsidiary Branding</h2>
        <p className="text-muted-foreground">
          Manage logos, colors, and branding for each Dawin subsidiary
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          {SUBSIDIARIES.map((subsidiary) => (
            <TabsTrigger key={subsidiary.id} value={subsidiary.id}>
              {subsidiary.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {SUBSIDIARIES.map((subsidiary) => (
          <TabsContent key={subsidiary.id} value={subsidiary.id}>
            <SubsidiaryBrandingTab
              subsidiaryId={subsidiary.id}
              subsidiary={subsidiary}
              branding={branding.subsidiaries[subsidiary.id]}
              onBrandingUpdate={handleBrandingUpdate}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
