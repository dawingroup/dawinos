/**
 * CampaignMetrics Component
 * Displays real-time campaign performance metrics
 */

import { TrendingUp, Users, MessageSquare, CheckCircle, Eye, MessageCircle, DollarSign } from 'lucide-react';
import type { CampaignMetrics as CampaignMetricsType } from '../../types';

interface CampaignMetricsProps {
  metrics: CampaignMetricsType;
  campaignType: 'whatsapp' | 'social_media' | 'product_promotion' | 'hybrid';
  showROI?: boolean;
}

export function CampaignMetrics({ metrics, campaignType, showROI = true }: CampaignMetricsProps) {
  const isWhatsAppCampaign = campaignType === 'whatsapp' || campaignType === 'hybrid';

  return (
    <div className="space-y-4">
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sent */}
        <MetricCard
          icon={MessageSquare}
          label="Total Sent"
          value={metrics.totalSent.toLocaleString()}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
        />

        {/* Total Reached */}
        <MetricCard
          icon={Users}
          label="Total Reached"
          value={metrics.totalReached.toLocaleString()}
          subtitle={`${((metrics.totalReached / metrics.totalSent) * 100 || 0).toFixed(1)}% of sent`}
          iconColor="text-green-600"
          bgColor="bg-green-50"
        />

        {/* Engagements */}
        <MetricCard
          icon={TrendingUp}
          label="Engagements"
          value={metrics.totalEngagements.toLocaleString()}
          subtitle={`${(metrics.engagementRate * 100).toFixed(1)}% rate`}
          iconColor="text-purple-600"
          bgColor="bg-purple-50"
        />

        {/* Conversions */}
        <MetricCard
          icon={CheckCircle}
          label="Conversions"
          value={metrics.totalConversions.toLocaleString()}
          subtitle={`${(metrics.conversionRate * 100).toFixed(2)}% rate`}
          iconColor="text-orange-600"
          bgColor="bg-orange-50"
        />
      </div>

      {/* WhatsApp-specific metrics */}
      {isWhatsAppCampaign && metrics.whatsappDelivered !== undefined && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">WhatsApp Metrics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              icon={CheckCircle}
              label="Delivered"
              value={metrics.whatsappDelivered.toLocaleString()}
              subtitle={`${((metrics.whatsappDelivered / metrics.totalSent) * 100 || 0).toFixed(1)}%`}
              iconColor="text-green-600"
              bgColor="bg-green-50"
              compact
            />
            <MetricCard
              icon={Eye}
              label="Read"
              value={(metrics.whatsappRead || 0).toLocaleString()}
              subtitle={`${(((metrics.whatsappRead || 0) / metrics.whatsappDelivered) * 100 || 0).toFixed(1)}%`}
              iconColor="text-blue-600"
              bgColor="bg-blue-50"
              compact
            />
            <MetricCard
              icon={MessageCircle}
              label="Replied"
              value={(metrics.whatsappReplied || 0).toLocaleString()}
              subtitle={`${(((metrics.whatsappReplied || 0) / metrics.whatsappDelivered) * 100 || 0).toFixed(1)}%`}
              iconColor="text-purple-600"
              bgColor="bg-purple-50"
              compact
            />
          </div>
        </div>
      )}

      {/* ROI */}
      {showROI && metrics.roi !== undefined && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Return on Investment</div>
              <div className="text-2xl font-bold text-gray-900">
                {metrics.roi > 0 ? '+' : ''}{(metrics.roi * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface MetricCardProps {
  icon: any;
  label: string;
  value: string;
  subtitle?: string;
  iconColor: string;
  bgColor: string;
  compact?: boolean;
}

function MetricCard({ icon: Icon, label, value, subtitle, iconColor, bgColor, compact }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`h-${compact ? '4' : '5'} w-${compact ? '4' : '5'} ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-500 mb-1">{label}</div>
          <div className={`font-bold text-gray-900 ${compact ? 'text-lg' : 'text-2xl'}`}>
            {value}
          </div>
          {subtitle && (
            <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CampaignMetrics;
