/**
 * ModuleGuard Component
 * Protects routes based on module access
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks';

type ModuleType = 
  | 'infrastructure_delivery' 
  | 'infrastructure_investment' 
  | 'investment_advisory' 
  | 'matflow';

interface ModuleGuardProps {
  children: React.ReactNode;
  module: ModuleType;
}

export function ModuleGuard({ children, module }: ModuleGuardProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Get modules and roles from user's custom claims
  const extUser = user as any;
  const userModules: string[] = extUser.modules || [];
  const userRoles: string[] = extUser.roles || [];
  const hasModuleAccess = userModules.includes(module) || userRoles.includes('admin') || userRoles.includes('super_admin');

  if (!hasModuleAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
