/**
 * CampaignListPage
 * Page wrapper for CampaignList component
 */

import { useState } from 'react';
import { CampaignList, CampaignForm } from '../components/campaigns';

export default function CampaignListPage() {
  const [showNewCampaign, setShowNewCampaign] = useState(false);

  return (
    <div className="px-6 py-6">
      <CampaignList onNewCampaign={() => setShowNewCampaign(true)} />

      {showNewCampaign && (
        <CampaignForm onClose={() => setShowNewCampaign(false)} />
      )}
    </div>
  );
}
