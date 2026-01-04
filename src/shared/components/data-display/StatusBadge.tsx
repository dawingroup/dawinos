/**
 * StatusBadge Component
 * Display status with color-coded badges
 */

import { Badge } from '@/core/components/ui/badge';
import { cn } from '@/shared/lib/utils';

type StatusType = 
  | 'draft' 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'active' 
  | 'completed' 
  | 'cancelled'
  | 'on_hold'
  | 'in_progress'
  | 'submitted'
  | 'under_review';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; variant: string }> = {
  draft: { label: 'Draft', variant: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
  pending: { label: 'Pending', variant: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
  approved: { label: 'Approved', variant: 'bg-green-100 text-green-800 hover:bg-green-100' },
  rejected: { label: 'Rejected', variant: 'bg-red-100 text-red-800 hover:bg-red-100' },
  active: { label: 'Active', variant: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  completed: { label: 'Completed', variant: 'bg-green-100 text-green-800 hover:bg-green-100' },
  cancelled: { label: 'Cancelled', variant: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
  on_hold: { label: 'On Hold', variant: 'bg-orange-100 text-orange-800 hover:bg-orange-100' },
  in_progress: { label: 'In Progress', variant: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  submitted: { label: 'Submitted', variant: 'bg-purple-100 text-purple-800 hover:bg-purple-100' },
  under_review: { label: 'Under Review', variant: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status as StatusType] || {
    label: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    variant: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
  };

  return (
    <Badge className={cn('font-medium', config.variant, className)}>
      {config.label}
    </Badge>
  );
}
