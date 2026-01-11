// ============================================================================
// COMPETITOR DETAIL PAGE
// DawinOS v2.0 - Market Intelligence Module
// Comprehensive competitor profile and analysis
// ============================================================================

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Building2,
  Globe,
  Linkedin,
  Twitter,
  MapPin,
  Users,
  TrendingUp,
  TrendingDown,
  Star,
  BarChart3,
  FileText,
  Calendar,
  Rocket,
  DollarSign,
  UserPlus,
  Link2,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Skeleton } from '@/core/components/ui/skeleton';

import { useCompetitors } from '../hooks/useCompetitors';
import { TrendIndicator } from '../components/shared/TrendIndicator';
import { ConfidenceIndicator } from '../components/shared/ConfidenceIndicator';
import { DataSourceBadge } from '../components/shared/DataSourceBadge';
import { MODULE_COLOR, THREAT_LEVELS, INDUSTRY_SECTORS } from '../constants';
import { CompetitorActivity } from '../types';

const CompetitorDetailPage: React.FC = () => {
  const { competitorId } = useParams<{ competitorId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { competitors, loading, toggleAlerts } = useCompetitors({});
  
  const competitor = competitors.find(c => c.id === competitorId);

  // Mock activities for demo
  const activities: CompetitorActivity[] = [
    {
      id: '1',
      competitorId: competitorId || '',
      activityType: 'product_launch',
      title: 'Launched New Mobile Banking App',
      description: 'Released redesigned mobile application with enhanced security features.',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      source: 'news',
      sentiment: 'positive',
      impact: 'high',
      tags: ['mobile', 'banking', 'app'],
    },
    {
      id: '2',
      competitorId: competitorId || '',
      activityType: 'funding',
      title: 'Secured $15M Series B Funding',
      description: 'Raised funding from international investors to expand operations.',
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      source: 'news',
      sentiment: 'positive',
      impact: 'high',
      tags: ['funding', 'investment'],
    },
    {
      id: '3',
      competitorId: competitorId || '',
      activityType: 'partnership',
      title: 'Partnership with Local Bank',
      description: 'Announced strategic partnership to expand payment network.',
      date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      source: 'news',
      sentiment: 'neutral',
      impact: 'medium',
      tags: ['partnership', 'banking'],
    },
  ];

  const getActivityIcon = (type: CompetitorActivity['activityType']) => {
    const icons: Record<string, React.ReactNode> = {
      product_launch: <Rocket className="h-4 w-4 text-blue-500" />,
      funding: <DollarSign className="h-4 w-4 text-green-500" />,
      partnership: <Link2 className="h-4 w-4 text-purple-500" />,
      hiring: <UserPlus className="h-4 w-4 text-blue-500" />,
      expansion: <TrendingUp className="h-4 w-4 text-orange-500" />,
      news: <FileText className="h-4 w-4 text-gray-500" />,
      social: <Users className="h-4 w-4 text-blue-400" />,
      other: <Calendar className="h-4 w-4 text-gray-400" />,
    };
    return icons[type] || icons.other;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!competitor) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Competitor Not Found</h3>
          <p className="text-muted-foreground mb-4">The requested competitor could not be found.</p>
          <Button onClick={() => navigate('/market-intel/competitors')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Competitors
          </Button>
        </Card>
      </div>
    );
  }

  const threatConfig = THREAT_LEVELS.find(t => t.id === competitor.threatLevel);
  const sectorConfig = INDUSTRY_SECTORS.find(s => s.id === competitor.sector);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <Card
        className="p-6"
        style={{ background: `linear-gradient(135deg, ${MODULE_COLOR}15 0%, ${MODULE_COLOR}05 100%)` }}
      >
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/market-intel/competitors')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div
            className="h-20 w-20 rounded-xl flex items-center justify-center text-white text-2xl font-bold shrink-0"
            style={{ backgroundColor: MODULE_COLOR }}
          >
            {competitor.logoUrl ? (
              <img src={competitor.logoUrl} alt={competitor.name} className="h-full w-full rounded-xl object-cover" />
            ) : (
              competitor.name.charAt(0)
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{competitor.name}</h1>
              <Badge style={{ backgroundColor: threatConfig?.color, color: 'white' }}>
                {threatConfig?.label}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {competitor.competitorType.replace('_', ' ')}
              </Badge>
            </div>

            <p className="text-muted-foreground mb-3">{competitor.description}</p>

            <div className="flex flex-wrap gap-4 text-sm">
              {competitor.website && (
                <a
                  href={competitor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:underline"
                  style={{ color: MODULE_COLOR }}
                >
                  <Globe className="h-4 w-4" />
                  Website
                </a>
              )}
              {competitor.headquarters && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {competitor.headquarters}
                </span>
              )}
              {competitor.employeeCount && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {competitor.employeeCount.toLocaleString()} employees
                </span>
              )}
              {competitor.socialProfiles?.linkedin && (
                <a href={competitor.socialProfiles.linkedin} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-4 w-4 text-muted-foreground hover:text-blue-600" />
                </a>
              )}
              {competitor.socialProfiles?.twitter && (
                <a href={competitor.socialProfiles.twitter} target="_blank" rel="noopener noreferrer">
                  <Twitter className="h-4 w-4 text-muted-foreground hover:text-blue-400" />
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleAlerts(competitor.id)}
              style={{ borderColor: MODULE_COLOR, color: MODULE_COLOR }}
            >
              {competitor.alertsEnabled ? 'Alerts On' : 'Alerts Off'}
            </Button>
            <Button variant="outline" style={{ borderColor: MODULE_COLOR, color: MODULE_COLOR }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Market Share</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{competitor.marketShare?.toFixed(1) || 'N/A'}%</span>
              <TrendIndicator direction="up" value={2.3} size="small" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Strength Score</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{competitor.strengthScore}/100</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${star <= Math.round(competitor.strengthScore / 20) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Recent Activities</p>
            <span className="text-2xl font-bold">{activities.length}</span>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Data Confidence</p>
            <ConfidenceIndicator score={0.85} variant="bar" showLabel />
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Activity Timeline
          </TabsTrigger>
          <TabsTrigger value="news" className="gap-2">
            <FileText className="h-4 w-4" />
            News & Mentions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Key Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Strong brand recognition in the market</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Extensive distribution network</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Well-funded with strong investor backing</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Key Weaknesses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  Key Weaknesses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <span>Limited rural market penetration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <span>Higher pricing compared to alternatives</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <span>Customer service response times</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Business Info */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Sector</p>
                    <p className="font-medium">{sectorConfig?.label || competitor.sector}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Founded</p>
                    <p className="font-medium">{competitor.foundedYear || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Est. Revenue</p>
                    <p className="font-medium">
                      {competitor.revenueEstimateUSD
                        ? `$${(competitor.revenueEstimateUSD / 1000000).toFixed(1)}M`
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Funding</p>
                    <p className="font-medium">
                      {competitor.fundingTotalUSD
                        ? `$${(competitor.fundingTotalUSD / 1000000).toFixed(1)}M`
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <div
                    key={activity.id}
                    className="flex gap-4 pb-4"
                    style={{ borderBottom: index < activities.length - 1 ? '1px solid var(--border)' : 'none' }}
                  >
                    <div className="p-2 rounded-lg bg-muted shrink-0">
                      {getActivityIcon(activity.activityType)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{activity.title}</h4>
                        <Badge variant="outline" className="capitalize text-xs">
                          {activity.activityType.replace('_', ' ')}
                        </Badge>
                        <Badge
                          className="text-xs"
                          style={{
                            backgroundColor: activity.impact === 'high' ? '#f4433620' : activity.impact === 'medium' ? '#ff980020' : '#4caf5020',
                            color: activity.impact === 'high' ? '#f44336' : activity.impact === 'medium' ? '#ff9800' : '#4caf50',
                          }}
                        >
                          {activity.impact} impact
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{new Date(activity.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        <DataSourceBadge source={activity.source} showLabel={false} />
                      </div>
                    </div>
                  </div>
                ))}

                {activities.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No activities recorded yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="news" className="mt-6">
          <Card className="p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">News Feed Integration</h3>
            <p className="text-muted-foreground mb-4">News and mentions for this competitor will appear here.</p>
            <Button
              variant="outline"
              style={{ borderColor: MODULE_COLOR, color: MODULE_COLOR }}
              onClick={() => navigate(`/market-intel/news?competitor=${competitorId}`)}
            >
              View All News
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompetitorDetailPage;
