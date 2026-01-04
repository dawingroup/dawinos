/**
 * RoleGuard Component
 * Protects routes based on user roles
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks';

type UserRole = string;

interface RoleGuardProps {
  children: React.ReactNode;
  roles: UserRole[];
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, roles, fallback }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Get roles from user's custom claims or default to empty array
  const userRoles: string[] = (user as any).roles || [];
  const hasRequiredRole = roles.some((role) => userRoles.includes(role));

  if (!hasRequiredRole) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
