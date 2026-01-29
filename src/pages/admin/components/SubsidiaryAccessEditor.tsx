/**
 * SubsidiaryAccessEditor
 * Editable matrix of subsidiary and module access for a user
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Label } from '@/core/components/ui/label';
import { DEFAULT_SUBSIDIARIES } from '@/types/subsidiary';
import type { SubsidiaryModule } from '@/types/subsidiary';
import type { SubsidiaryAccess } from '@/core/settings/types';

interface SubsidiaryAccessEditorProps {
  access: SubsidiaryAccess[];
  onChange: (access: SubsidiaryAccess[]) => void;
  disabled?: boolean;
}

const MODULE_LABELS: Record<string, string> = {
  'design-manager': 'Design Manager',
  'clipper': 'Clipper',
  'asset-registry': 'Asset Registry',
  'feature-library': 'Feature Library',
  'launch-pipeline': 'Launch Pipeline',
  'procurement': 'Procurement',
  'production': 'Production',
  'matflow': 'MatFlow',
  'investment_advisory': 'Investment Advisory',
  'infrastructure_delivery': 'Infrastructure Delivery',
  'market_intelligence': 'Market Intelligence',
  'strategy': 'Strategy',
  'hr': 'HR Central',
  'finance': 'Finance',
};

export function SubsidiaryAccessEditor({ access, onChange, disabled }: SubsidiaryAccessEditorProps) {
  const activeSubsidiaries = DEFAULT_SUBSIDIARIES.filter(s => s.status === 'active');

  function getSubAccess(subsidiaryId: string): SubsidiaryAccess | undefined {
    return access.find(a => a.subsidiaryId === subsidiaryId);
  }

  function toggleSubsidiary(subsidiaryId: string) {
    const existing = getSubAccess(subsidiaryId);
    if (existing) {
      onChange(
        access.map(a =>
          a.subsidiaryId === subsidiaryId ? { ...a, hasAccess: !a.hasAccess } : a
        )
      );
    } else {
      const sub = DEFAULT_SUBSIDIARIES.find(s => s.id === subsidiaryId);
      onChange([
        ...access,
        {
          subsidiaryId,
          hasAccess: true,
          modules: (sub?.modules || []).map(m => ({
            moduleId: m,
            hasAccess: false,
          })),
        },
      ]);
    }
  }

  function toggleModule(subsidiaryId: string, moduleId: SubsidiaryModule) {
    onChange(
      access.map(a => {
        if (a.subsidiaryId !== subsidiaryId) return a;
        const moduleExists = a.modules.some(m => m.moduleId === moduleId);
        const updatedModules = moduleExists
          ? a.modules.map(m =>
              m.moduleId === moduleId ? { ...m, hasAccess: !m.hasAccess } : m
            )
          : [...a.modules, { moduleId, hasAccess: true }];
        return { ...a, modules: updatedModules };
      })
    );
  }

  return (
    <div className="space-y-4">
      {activeSubsidiaries.map(sub => {
        const subAccess = getSubAccess(sub.id);
        const hasAccess = subAccess?.hasAccess ?? false;

        return (
          <Card key={sub.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: sub.color }}
                  />
                  <CardTitle className="text-base">{sub.name}</CardTitle>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm text-muted-foreground">
                    {hasAccess ? 'Enabled' : 'Disabled'}
                  </span>
                  <input
                    type="checkbox"
                    checked={hasAccess}
                    onChange={() => toggleSubsidiary(sub.id)}
                    disabled={disabled}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </label>
              </div>
            </CardHeader>
            {hasAccess && (
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  Select which modules this user can access
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {sub.modules.map(moduleId => {
                    const moduleAccess = subAccess?.modules.find(
                      m => m.moduleId === moduleId
                    );
                    return (
                      <label
                        key={moduleId}
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={moduleAccess?.hasAccess ?? false}
                          onChange={() => toggleModule(sub.id, moduleId)}
                          disabled={disabled}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label className="cursor-pointer font-normal text-sm">
                          {MODULE_LABELS[moduleId] || moduleId}
                        </Label>
                      </label>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
