/**
 * DashboardStats Component
 * Displays overview statistics for design items
 */

import { Package, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card } from '@/shared/components/ui';

interface DesignItem {
  id: string;
  stage: string;
  ragStatus: { red: number; amber: number; green: number; na: number };
  priority: string;
}

interface DashboardStatsProps {
  items: DesignItem[];
}

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  color: 'blue' | 'amber' | 'green' | 'red';
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600 border-blue-200',
  amber: 'bg-amber-50 text-amber-600 border-amber-200',
  green: 'bg-green-50 text-green-600 border-green-200',
  red: 'bg-red-50 text-red-600 border-red-200',
};

const iconBgClasses = {
  blue: 'bg-blue-100',
  amber: 'bg-amber-100',
  green: 'bg-green-100',
  red: 'bg-red-100',
};

function StatCard({ title, value, subtitle, icon, trend, color }: StatCardProps) {
  return (
    <Card className={`p-4 border ${colorClasses[color]} transition-all hover:shadow-hover`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className={`text-xs mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}% from last week
            </p>
          )}
        </div>
        <div className={`p-2 rounded-lg ${iconBgClasses[color]}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

export default function DashboardStats({ items }: DashboardStatsProps) {
  // Calculate statistics
  const totalItems = items.length;
  const inProgress = items.filter(i => !['production-ready', 'procure-received'].includes(i.stage)).length;
  const productionReady = items.filter(i => ['production-ready', 'procure-received'].includes(i.stage)).length;
  const criticalItems = items.filter(i => i.ragStatus.red > 2 || i.priority === 'urgent').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="Total Designs"
        value={totalItems}
        subtitle="Active projects"
        icon={<Package className="h-5 w-5" />}
        color="blue"
      />
      <StatCard
        title="In Progress"
        value={inProgress}
        subtitle="Across all stages"
        icon={<Clock className="h-5 w-5" />}
        trend={{ value: 12, isPositive: true }}
        color="amber"
      />
      <StatCard
        title="Production Ready"
        value={productionReady}
        subtitle="Ready to manufacture"
        icon={<CheckCircle className="h-5 w-5" />}
        color="green"
      />
      <StatCard
        title="Needs Attention"
        value={criticalItems}
        subtitle="Critical items"
        icon={<AlertTriangle className="h-5 w-5" />}
        color="red"
      />
    </div>
  );
}
