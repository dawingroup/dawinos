/**
 * App Component
 * Main application entry point with routing
 */

import { RouterProvider } from 'react-router-dom';
import { router } from './routes/index';
import { AuthProvider } from '@/contexts/AuthContext';
import { SubsidiaryProvider } from '@/contexts/SubsidiaryContext';
import { TooltipProvider } from '@/core/components/ui/tooltip';
import { DynamicFavicon } from '@/shared/components/branding';

/**
 * Error Boundary fallback
 */
function ErrorFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-gray-600 mb-4">Please refresh the page to try again.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-[#872E5C] text-white rounded-md hover:bg-[#6a2449]"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}

/**
 * Main App Component
 */
export default function App() {
  return (
    <AuthProvider>
      <SubsidiaryProvider>
        <TooltipProvider delayDuration={300}>
          <DynamicFavicon />
          <RouterProvider router={router} />
        </TooltipProvider>
      </SubsidiaryProvider>
    </AuthProvider>
  );
}
