/**
 * CampaignDetail Component
 * Displays full campaign details with real-time metrics and send history
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Users, MessageSquare, TrendingUp,
  CheckCircle, Clock, AlertCircle, Edit
} from 'lucide-react';
import { useCampaign, useCampaignSends } from '../../hooks';
import { CampaignMetrics } from './CampaignMetrics';
import { CAMPAIGN_STATUS_LABELS, CAMPAIGN_TYPE_LABELS } from '../../constants';
import type { CampaignSend } from '../../types';

const SEND_STATUS_CONFIG = {
  pending: { bg: 'bg-gray-100', text: 'text-gray-800', icon: Clock },
  sent: { bg: 'bg-blue-100', text: 'text-blue-800', icon: MessageSquare },
  delivered: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
  failed: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle },
  read: { bg: 'bg-purple-100', text: 'text-purple-800', icon: CheckCircle },
  replied: { bg: 'bg-orange-100', text: 'text-orange-800', icon: MessageSquare },
};

export function CampaignDetail() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const [showSends, setShowSends] = useState(false);

  const { campaign, loading: campaignLoading, error: campaignError } = useCampaign(campaignId);
  const { sends, loading: sendsLoading, error: sendsError } = useCampaignSends(
    showSends ? campaignId : undefined,
    100
  );

  if (campaignLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (campaignError || !campaign) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        Error loading campaign: {campaignError?.message || 'Campaign not found'}
      </div>
    );
  }

  const startDate = campaign.scheduledStartDate?.toDate();
  const endDate = campaign.scheduledEndDate?.toDate();
  const createdDate = campaign.createdAt?.toDate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/marketing/campaigns')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-gray-500">
                {CAMPAIGN_TYPE_LABELS[campaign.campaignType]?.label}
              </span>
              <span className="text-sm text-gray-300">•</span>
              <span className="text-sm text-gray-500">
                {CAMPAIGN_STATUS_LABELS[campaign.status]?.label}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate(`/marketing/campaigns/${campaignId}/edit`)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Edit className="h-4 w-4" />
          Edit Campaign
        </button>
      </div>

      {/* Description */}
      {campaign.description && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-700">{campaign.description}</p>
        </div>
      )}

      {/* Campaign Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Schedule */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Schedule</span>
          </div>
          {startDate ? (
            <div className="text-sm text-gray-700">
              <div>Start: {startDate.toLocaleString()}</div>
              {endDate && <div>End: {endDate.toLocaleString()}</div>}
            </div>
          ) : (
            <div className="text-sm text-gray-500">Not scheduled</div>
          )}
        </div>

        {/* Audience */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">Target Audience</span>
          </div>
          <div className="text-sm text-gray-700">
            <div>Estimated: {campaign.estimatedReach.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">
              {campaign.targetAudience.segmentType === 'all' ? 'All customers' : campaign.targetAudience.segmentType === 'filters' ? 'Filtered segment' : 'Custom segment'}
            </div>
          </div>
        </div>

        {/* Created */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Created</span>
          </div>
          <div className="text-sm text-gray-700">
            {createdDate?.toLocaleString() || 'Unknown'}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaign Performance</h2>
        <CampaignMetrics
          metrics={campaign.metrics}
          campaignType={campaign.campaignType}
          showROI={!!campaign.budget}
        />
      </div>

      {/* WhatsApp Configuration */}
      {campaign.whatsappConfig && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">WhatsApp Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Template</div>
              <div className="font-medium text-gray-900">{campaign.whatsappConfig.templateName}</div>
            </div>
            <div>
              <div className="text-gray-500">Send Rate</div>
              <div className="font-medium text-gray-900">
                {campaign.whatsappConfig.sendRate === 'immediate' ? 'Immediate' : 'Throttled'}
                {campaign.whatsappConfig.throttleConfig &&
                  ` (${campaign.whatsappConfig.throttleConfig.messagesPerMinute}/min)`
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goals */}
      {campaign.goals && campaign.goals.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Campaign Goals</h3>
          <div className="space-y-2">
            {campaign.goals.map((goal, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-700">{goal.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  Target: {goal.targetValue.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campaign Sends */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => setShowSends(!showSends)}
            className="flex items-center justify-between w-full"
          >
            <h3 className="text-sm font-semibold text-gray-900">
              Campaign Sends ({campaign.metrics.totalSent.toLocaleString()})
            </h3>
            <span className="text-sm text-primary">
              {showSends ? 'Hide' : 'Show'} Details
            </span>
          </button>
        </div>

        {showSends && (
          <div className="p-4">
            {sendsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : sendsError ? (
              <div className="text-sm text-red-600 py-4">
                Error loading sends: {sendsError.message}
              </div>
            ) : sends.length === 0 ? (
              <div className="text-sm text-gray-500 py-4 text-center">
                No sends recorded yet
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sends.map((send) => (
                  <SendItem key={send.id} send={send} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SendItem({ send }: { send: CampaignSend }) {
  const statusConfig = SEND_STATUS_CONFIG[send.status];
  const StatusIcon = statusConfig.icon;
  const sentDate = send.sentAt?.toDate();

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">
            {send.customerName || send.phoneNumber}
          </span>
          <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
            <StatusIcon className="h-3 w-3" />
            {send.status}
          </span>
        </div>
        {sentDate && (
          <div className="text-xs text-gray-500 mt-1">
            {sentDate.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}

export default CampaignDetail;
