/**
 * DawinOS Global Settings Types
 * Types for organization settings, user management, and access control
 */

import type { SubsidiaryModule } from '@/types/subsidiary';

// ============================================================================
// ORGANIZATION SETTINGS
// ============================================================================

export interface OrganizationBranding {
  logoUrl?: string;
  logoLightUrl?: string;  // For dark backgrounds
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
}

export interface OrganizationInfo {
  name: string;
  shortName: string;
  legalName?: string;
  taxId?: string;
  registrationNumber?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    country: string;
    postalCode?: string;
  };
}

export interface OrganizationSettings {
  id: string;
  info: OrganizationInfo;
  branding: OrganizationBranding;
  defaultCurrency: string;
  defaultLanguage: string;
  timezone: string;
  fiscalYearStart: number; // Month (1-12)
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// USER & ACCESS CONTROL
// ============================================================================

export type GlobalRole = 'owner' | 'admin' | 'manager' | 'member' | 'viewer';

export interface ModuleAccess {
  moduleId: SubsidiaryModule;
  hasAccess: boolean;
  role?: string; // Module-specific role (e.g., 'quantity_surveyor' for matflow)
  customPermissions?: string[];
}

export interface SubsidiaryAccess {
  subsidiaryId: string;
  hasAccess: boolean;
  modules: ModuleAccess[];
}

export interface DawinUser {
  id: string;
  uid: string; // Firebase Auth UID
  email: string;
  displayName: string;
  photoUrl?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  
  // Global access
  globalRole: GlobalRole;
  isActive: boolean;
  
  // Subsidiary & module access
  subsidiaryAccess: SubsidiaryAccess[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  invitedBy?: string;
  invitedAt?: string;
}

export interface UserInvite {
  id: string;
  email: string;
  globalRole: GlobalRole;
  subsidiaryAccess: SubsidiaryAccess[];
  invitedBy: string;
  invitedByName: string;
  createdAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  acceptedAt?: string;
}

// ============================================================================
// GLOBAL ROLE DEFINITIONS
// ============================================================================

export interface GlobalRoleDefinition {
  role: GlobalRole;
  name: string;
  description: string;
  permissions: GlobalPermission[];
}

export type GlobalPermission =
  | 'settings:view'
  | 'settings:edit'
  | 'users:view'
  | 'users:invite'
  | 'users:edit'
  | 'users:delete'
  | 'users:manage_roles'
  | 'subsidiaries:view'
  | 'subsidiaries:manage'
  | 'billing:view'
  | 'billing:manage'
  | 'audit:view';

export const GLOBAL_ROLE_DEFINITIONS: GlobalRoleDefinition[] = [
  {
    role: 'owner',
    name: 'Owner',
    description: 'Full access to all settings and features',
    permissions: [
      'settings:view', 'settings:edit',
      'users:view', 'users:invite', 'users:edit', 'users:delete', 'users:manage_roles',
      'subsidiaries:view', 'subsidiaries:manage',
      'billing:view', 'billing:manage',
      'audit:view',
    ],
  },
  {
    role: 'admin',
    name: 'Administrator',
    description: 'Manage users, settings, and subsidiaries',
    permissions: [
      'settings:view', 'settings:edit',
      'users:view', 'users:invite', 'users:edit', 'users:manage_roles',
      'subsidiaries:view', 'subsidiaries:manage',
      'billing:view',
      'audit:view',
    ],
  },
  {
    role: 'manager',
    name: 'Manager',
    description: 'Manage team members and view settings',
    permissions: [
      'settings:view',
      'users:view', 'users:invite',
      'subsidiaries:view',
      'audit:view',
    ],
  },
  {
    role: 'member',
    name: 'Member',
    description: 'Standard access to assigned modules',
    permissions: [
      'settings:view',
      'users:view',
      'subsidiaries:view',
    ],
  },
  {
    role: 'viewer',
    name: 'Viewer',
    description: 'Read-only access',
    permissions: [
      'settings:view',
      'subsidiaries:view',
    ],
  },
];

export function getGlobalRoleDefinition(role: GlobalRole): GlobalRoleDefinition | undefined {
  return GLOBAL_ROLE_DEFINITIONS.find(r => r.role === role);
}

export function hasGlobalPermission(role: GlobalRole, permission: GlobalPermission): boolean {
  const definition = getGlobalRoleDefinition(role);
  return definition?.permissions.includes(permission) ?? false;
}

// ============================================================================
// DOCUMENT TEMPLATES (Future)
// ============================================================================

export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  moduleId: SubsidiaryModule;
  templateType: 'invoice' | 'quote' | 'report' | 'boq' | 'delivery_note' | 'custom';
  format: 'pdf' | 'xlsx' | 'docx';
  templateUrl: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// ============================================================================
// AUDIT LOG
// ============================================================================

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}
