/**
 * Marketing Module
 * Main router component for Marketing Hub
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import {
  MarketingDashboardPage,
  CampaignListPage,
  CampaignDetailPage,
  CampaignCreatePage,
  ContentCalendarPage,
  TemplateLibraryPage,
  AnalyticsReportsPage,
} from './pages';

export function MarketingModule() {
  return (
    <Routes>
      <Route index element={<MarketingDashboardPage />} />
      <Route path="campaigns" element={<CampaignListPage />} />
      <Route path="campaigns/new" element={<CampaignCreatePage />} />
      <Route path="campaigns/:campaignId" element={<CampaignDetailPage />} />
      <Route path="calendar" element={<ContentCalendarPage />} />
      <Route path="templates" element={<TemplateLibraryPage />} />
      <Route path="analytics" element={<AnalyticsReportsPage />} />
      <Route path="*" element={<Navigate to="/marketing" replace />} />
    </Routes>
  );
}

export default MarketingModule;
