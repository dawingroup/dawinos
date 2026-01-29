/**
 * ModuleGuard Component
 * Protects routes based on module access from the user's DawinUser profile
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks';
import { useCurrentDawinUser } from '@/core/settings';
import { FullPageLoader } from '@/shared/components/feedback';

type ModuleType =
  | 'infrastructure_delivery'
  | 'infrastructure_investment'
  | 'investment_advisory'
  | 'matflow'
  | 'market_intelligence'
  | 'strategy';

interface ModuleGuardProps {
  children: React.ReactNode;
  module: ModuleType;
}

// Super user email with unrestricted access to all modules
const SUPER_USER_EMAILS = ['onzimai@dawin.group'];

export function ModuleGuard({ children, module }: ModuleGuardProps) {
  const { user, loading } = useAuth();
  const { dawinUser, isLoading: userLoading } = useCurrentDawinUser();

  if (loading || userLoading) {
    return <FullPageLoader text="Checking module access..." />;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Super user bypasses all module checks
  if (user.email && SUPER_USER_EMAILS.includes(user.email)) {
    return <>{children}</>;
  }

  // No DawinUser profile — user needs to be invited first
  if (!dawinUser) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Admins and owners have access to all modules
  if (['admin', 'owner'].includes(dawinUser.globalRole)) {
    return <>{children}</>;
  }

  // Check subsidiaryAccess for module permission
  const hasModuleAccess = dawinUser.subsidiaryAccess?.some(
    (sa) => sa.hasAccess && sa.modules?.some((m) => m.moduleId === module && m.hasAccess)
  );

  if (!hasModuleAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
