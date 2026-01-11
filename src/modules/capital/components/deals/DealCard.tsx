// ============================================================================
// DEAL CARD COMPONENT
// DawinOS v2.0 - Capital Hub Module
// Card view for deal pipeline
// ============================================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';

import { Card, CardContent } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Progress } from '@/core/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/core/components/ui/tooltip';

import { DealStageChip } from '../shared/DealStageChip';
import { formatCurrency } from '../shared/CurrencyDisplay';
import { MODULE_COLOR, DEAL_STAGES } from '../../constants';

interface TeamMember {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface Deal {
  id: string;
  companyName: string;
  sector: string;
  stage: string;
  dealType?: string;
  targetRaiseUSD?: number;
  logoUrl?: string;
  stageUpdatedAt?: string;
  createdAt: string;
  dueDiligence?: { completed: boolean }[];
  teamMembers?: TeamMember[];
}

interface DealCardProps {
  deal: Deal;
  onClick?: (deal: Deal) => void;
  compact?: boolean;
}

export const DealCard: React.FC<DealCardProps> = ({ deal, onClick, compact = false }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick(deal);
    } else {
      navigate(`/capital/deals/${deal.id}`);
    }
  };

  const ddProgress = deal.dueDiligence
    ? (deal.dueDiligence.filter(item => item.completed).length / deal.dueDiligence.length) * 100
    : 0;

  const daysInStage = Math.floor(
    (new Date().getTime() - new Date(deal.stageUpdatedAt || deal.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const stageConfig = DEAL_STAGES.find(s => s.id === deal.stage);

  if (compact) {
    return (
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow"
        style={{ borderLeft: `3px solid ${stageConfig?.color || MODULE_COLOR}` }}
        onClick={handleClick}
      >
        <CardContent className="p-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-sm truncate max-w-[200px]">{deal.companyName}</p>
              <p className="text-xs text-muted-foreground">{deal.sector}</p>
            </div>
            <span className="text-sm font-medium">
              {formatCurrency(deal.targetRaiseUSD || 0, 'USD', true)}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5"
      style={{ borderTop: `4px solid ${stageConfig?.color || MODULE_COLOR}` }}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="h-12 w-12 rounded-lg flex items-center justify-center text-white"
            style={{ backgroundColor: `${MODULE_COLOR}20`, color: MODULE_COLOR }}
          >
            {deal.logoUrl ? (
              <img src={deal.logoUrl} alt={deal.companyName} className="h-full w-full rounded-lg object-cover" />
            ) : (
              <Building2 className="h-6 w-6" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{deal.companyName}</h3>
            <p className="text-sm text-muted-foreground">{deal.sector}</p>
          </div>
        </div>

        {/* Stage */}
        <div className="flex items-center gap-2 mb-3">
          <DealStageChip stage={deal.stage} />
          <span className="text-xs text-muted-foreground">{daysInStage} days</span>
        </div>

        {/* Deal Size */}
        <div className="mb-3">
          <p className="text-xs text-muted-foreground">Target Raise</p>
          <p className="text-lg font-semibold">{formatCurrency(deal.targetRaiseUSD || 0, 'USD', true)}</p>
        </div>

        {/* Deal Type */}
        <div className="flex gap-2 flex-wrap mb-3">
          {deal.dealType && (
            <Badge variant="outline" className="capitalize">{deal.dealType}</Badge>
          )}
        </div>

        {/* DD Progress */}
        {deal.stage === 'due_diligence' && deal.dueDiligence && (
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Due Diligence Progress</span>
              <span className="font-medium">{Math.round(ddProgress)}%</span>
            </div>
            <Progress value={ddProgress} className="h-1.5" />
          </div>
        )}

        {/* Team */}
        {deal.teamMembers && deal.teamMembers.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Deal Team</p>
            <div className="flex -space-x-2">
              {deal.teamMembers.slice(0, 4).map((member) => (
                <TooltipProvider key={member.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="h-7 w-7 rounded-full border-2 border-background flex items-center justify-center text-xs font-medium text-white"
                        style={{ backgroundColor: MODULE_COLOR }}
                      >
                        {member.name.charAt(0)}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>{member.name}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
              {deal.teamMembers.length > 4 && (
                <div className="h-7 w-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs">
                  +{deal.teamMembers.length - 4}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DealCard;
