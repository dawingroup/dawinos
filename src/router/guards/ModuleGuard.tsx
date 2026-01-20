/**
 * ModuleGuard Component
 * Protects routes based on module access
 */

import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks';
import { auth } from '@/shared/services/firebase';

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

// Modules that are open to all authenticated users (during development/setup)
const OPEN_ACCESS_MODULES: ModuleType[] = [
  'investment_advisory',
  'matflow',
  'infrastructure_delivery',
  'infrastructure_investment',
  'market_intelligence',
  'strategy',
];

export function ModuleGuard({ children, module }: ModuleGuardProps) {
  const { user, loading } = useAuth();
  const [claims, setClaims] = useState<Record<string, any> | null>(null);
  const [claimsLoading, setClaimsLoading] = useState(true);

  useEffect(() => {
    async function fetchClaims() {
      if (user && auth.currentUser) {
        try {
          const tokenResult = await auth.currentUser.getIdTokenResult();
          setClaims(tokenResult.claims || {});
        } catch (error) {
          console.error('Error fetching claims:', error);
          setClaims({});
        }
      } else {
        setClaims(null);
      }
      setClaimsLoading(false);
    }
    
    fetchClaims();
  }, [user]);

  if (loading || claimsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Check if module is open access (all authenticated users allowed)
  if (OPEN_ACCESS_MODULES.includes(module)) {
    return <>{children}</>;
  }

  // Check custom claims for role-based access
  const userRole = claims?.role || '';
  const userModules: string[] = claims?.modules || [];
  
  // Admin roles have access to all modules
  const isAdmin = ['platform_admin', 'admin', 'super_admin', 'executive', 'director'].includes(userRole);
  const hasModuleAccess = userModules.includes(module) || isAdmin;

  if (!hasModuleAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
