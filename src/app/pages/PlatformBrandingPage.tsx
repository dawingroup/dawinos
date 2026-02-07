/**
 * Platform Branding Page
 * Manage platform-level branding (header logo and favicon)
 */

import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { BrandingSettings } from '@/shared/components/branding';

export default function PlatformBrandingPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Branding</h1>
          <p className="text-gray-500">Manage logo and favicon for your platform</p>
        </div>
      </div>

      {/* Branding Settings Component */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <BrandingSettings />
      </div>
    </div>
  );
}
