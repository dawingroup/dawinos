// ============================================================================
// RECENT ACTIVITY FEED COMPONENT
// DawinOS v2.0 - Capital Hub Module
// Shows recent capital hub activities
// ============================================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { 
  Briefcase, 
  DollarSign, 
  UserPlus, 
  FileText,
  ArrowRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { MODULE_COLOR } from '../../constants';

interface Activity {
  id: string;
  type: 'deal' | 'investment' | 'investor' | 'document';
  title: string;
  subtitle: string;
  timestamp: Date;
  link: string;
}

interface RecentActivityFeedProps {
  activities: Activity[];
}

const activityIcons = {
  deal: Briefcase,
  investment: DollarSign,
  investor: UserPlus,
  document: FileText,
};

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  activities,
}) => {
  const navigate = useNavigate();

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          <Badge style={{ backgroundColor: MODULE_COLOR }}>
            {activities.length} updates
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type];
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                onClick={() => navigate(activity.link)}
              >
                <div 
                  className="p-2 rounded-full"
                  style={{ backgroundColor: `${MODULE_COLOR}20` }}
                >
                  <Icon className="h-4 w-4" style={{ color: MODULE_COLOR }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{activity.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{activity.subtitle}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
              </div>
            );
          })}
          
          {activities.length === 0 && (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              No recent activity
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivityFeed;
