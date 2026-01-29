/**
 * RoleGuard Component
 * Protects routes based on user roles from the DawinUser profile
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks';
import { useCurrentDawinUser } from '@/core/settings';
import { FullPageLoader } from '@/shared/components/feedback';

type UserRole = string;

interface RoleGuardProps {
  children: React.ReactNode;
  roles: UserRole[];
  fallback?: React.ReactNode;
}

// Super user email with unrestricted access to all functions
const SUPER_USER_EMAILS = ['onzimai@dawin.group'];

export function RoleGuard({ children, roles, fallback }: RoleGuardProps) {
  const { user, loading } = useAuth();
  const { dawinUser, isLoading: userLoading } = useCurrentDawinUser();

  // Wait for auth to load before making decisions
  if (loading || userLoading) {
    return <FullPageLoader text="Checking permissions..." />;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Super user bypasses all role checks
  if (user.email && SUPER_USER_EMAILS.includes(user.email)) {
    return <>{children}</>;
  }

  if (!dawinUser) {
    if (fallback) return <>{fallback}</>;
    return <Navigate to="/unauthorized" replace />;
  }

  // Check if user has required role in their DawinUser profile
  const roleMapping: Record<string, string> = {
    'admin': 'admin',
    'super_admin': 'owner',
    'owner': 'owner',
    'manager': 'manager',
    'member': 'member',
    'viewer': 'viewer',
  };

  const hasRequiredRole = roles.some(
    (role) => dawinUser.globalRole === roleMapping[role]
  );

  if (!hasRequiredRole) {
    if (fallback) return <>{fallback}</>;
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
