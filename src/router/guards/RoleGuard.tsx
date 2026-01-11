/**
 * RoleGuard Component
 * Protects routes based on user roles
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

// Admin emails that have full access (temporary until proper role management)
const ADMIN_EMAILS = [
  'onzimai@dawin.group',
];

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

  // Check if user email is in admin list (fallback for users without DawinUser profile)
  const isAdminEmail = user.email && ADMIN_EMAILS.includes(user.email);
  
  // Check if user has required role in their DawinUser profile
  let hasRequiredRole = false;
  if (dawinUser) {
    hasRequiredRole = roles.some((role) => {
      // Map role names to actual globalRole values
      const roleMapping: Record<string, string> = {
        'admin': 'admin',
        'super_admin': 'owner', // Map super_admin to owner
        'owner': 'owner',
        'manager': 'manager',
        'member': 'member',
        'viewer': 'viewer'
      };
      return dawinUser.globalRole === roleMapping[role];
    });
  }

  // Allow access if user has required role OR is an admin email
  if (!hasRequiredRole && !isAdminEmail) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
