/**
 * Advisory Home Page
 * 
 * Entry point for the Advisory module.
 */

import { AdvisoryDashboard } from '../components/dashboard';

interface AdvisoryHomePageProps {
  userId?: string;
}

export function AdvisoryHomePage({ userId = '' }: AdvisoryHomePageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AdvisoryDashboard userId={userId} />
      </div>
    </div>
  );
}

export default AdvisoryHomePage;
