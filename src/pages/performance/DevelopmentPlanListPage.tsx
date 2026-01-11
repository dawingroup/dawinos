/**
 * DevelopmentPlanListPage.tsx
 * Employee development plans with activity tracking and progress monitoring
 * DawinOS v2.0 - Phase 8.9
 */

import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Archive,
  Download,
  GraduationCap,
} from 'lucide-react';
import { format } from 'date-fns';

import { Card, CardContent } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Badge } from '@/core/components/ui/badge';
import { Progress } from '@/core/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import { Skeleton } from '@/core/components/ui/skeleton';
import { cn } from '@/shared/lib/utils';

const PERFORMANCE_COLOR = '#FF5722';

// Plan status options
const PLAN_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  { value: 'active', label: 'Active', color: 'bg-blue-100 text-blue-800' },
  { value: 'on_track', label: 'On Track', color: 'bg-green-100 text-green-800' },
  { value: 'at_risk', label: 'At Risk', color: 'bg-amber-100 text-amber-800' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
  { value: 'archived', label: 'Archived', color: 'bg-gray-100 text-gray-800' },
];

// Mock development plan data
const mockPlans = [
  { id: '1', title: 'Leadership Development', employeeName: 'Alice Namutebi', employeeId: 'user1', status: 'on_track', progress: 65, activitiesCompleted: 8, totalActivities: 12, startDate: new Date(2025, 9, 1), targetDate: new Date(2026, 2, 31) },
  { id: '2', title: 'Technical Skills Enhancement', employeeName: 'Brian Musoke', employeeId: 'user2', status: 'at_risk', progress: 40, activitiesCompleted: 4, totalActivities: 10, startDate: new Date(2025, 10, 1), targetDate: new Date(2026, 1, 28) },
  { id: '3', title: 'Management Track', employeeName: 'Catherine Nyeko', employeeId: 'user3', status: 'completed', progress: 100, activitiesCompleted: 20, totalActivities: 20, startDate: new Date(2025, 6, 1), targetDate: new Date(2025, 11, 31) },
  { id: '4', title: 'Sales Excellence', employeeName: 'Daniel Ouma', employeeId: 'user4', status: 'active', progress: 50, activitiesCompleted: 5, totalActivities: 10, startDate: new Date(2025, 11, 1), targetDate: new Date(2026, 4, 31) },
  { id: '5', title: 'Communication Mastery', employeeName: 'Eva Kemigisa', employeeId: 'user5', status: 'draft', progress: 0, activitiesCompleted: 0, totalActivities: 8, startDate: new Date(2026, 1, 1), targetDate: new Date(2026, 6, 31) },
  { id: '6', title: 'Data Analytics Pathway', employeeName: 'Francis Ssekabira', employeeId: 'user1', status: 'on_track', progress: 75, activitiesCompleted: 9, totalActivities: 12, startDate: new Date(2025, 8, 1), targetDate: new Date(2026, 1, 28) },
];

export function DevelopmentPlanListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [activeTab, setActiveTab] = useState('all');
  const [loading] = useState(false);

  // Filter plans
  const filteredPlans = useMemo(() => {
    return mockPlans.filter(plan => {
      // Tab filter
      if (activeTab === 'my' && plan.employeeId !== 'user1') return false;
      if (activeTab === 'active' && !['active', 'on_track', 'at_risk'].includes(plan.status)) return false;
      if (activeTab === 'completed' && plan.status !== 'completed') return false;

      // Search filter
      if (search && !plan.title.toLowerCase().includes(search.toLowerCase()) &&
          !plan.employeeName.toLowerCase().includes(search.toLowerCase())) return false;

      // Status filter
      if (statusFilter !== 'all' && plan.status !== statusFilter) return false;

      return true;
    });
  }, [search, statusFilter, activeTab]);

  // Stats
  const activePlans = mockPlans.filter(p => ['active', 'on_track', 'at_risk'].includes(p.status));
  const stats = {
    total: mockPlans.length,
    active: activePlans.length,
    atRisk: mockPlans.filter(p => p.status === 'at_risk').length,
    completed: mockPlans.filter(p => p.status === 'completed').length,
    avgProgress: Math.round(activePlans.reduce((sum, p) => sum + p.progress, 0) / (activePlans.length || 1)),
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16" />)}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6" style={{ color: PERFORMANCE_COLOR }} />
            Development Plans
          </h1>
          <p className="text-muted-foreground">Track employee growth and development activities</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => navigate('/performance/development/new')} style={{ backgroundColor: PERFORMANCE_COLOR }}>
            <Plus className="h-4 w-4 mr-2" />
            New Plan
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card className="text-center p-3">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total Plans</p>
        </Card>
        <Card className="text-center p-3">
          <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
          <p className="text-xs text-muted-foreground">Active</p>
        </Card>
        <Card className="text-center p-3">
          <p className="text-2xl font-bold text-amber-600">{stats.atRisk}</p>
          <p className="text-xs text-muted-foreground">At Risk</p>
        </Card>
        <Card className="text-center p-3">
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </Card>
        <Card className="text-center p-3">
          <p className="text-2xl font-bold" style={{ color: PERFORMANCE_COLOR }}>{stats.avgProgress}%</p>
          <p className="text-xs text-muted-foreground">Avg Progress</p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Plans</TabsTrigger>
          <TabsTrigger value="my">My Plans</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search plans..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {PLAN_STATUSES.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Plans Grid */}
      {filteredPlans.length === 0 ? (
        <Card className="p-12 text-center">
          <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Development Plans Found</h3>
          <p className="text-muted-foreground mb-4">
            {search || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create a development plan to track employee growth'}
          </p>
          <Button onClick={() => navigate('/performance/development/new')} style={{ backgroundColor: PERFORMANCE_COLOR }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Plan
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlans.map(plan => {
            const statusInfo = PLAN_STATUSES.find(s => s.value === plan.status);
            return (
              <Card
                key={plan.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/performance/development/${plan.id}`)}
              >
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{plan.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium">
                          {plan.employeeName[0]}
                        </div>
                        <span className="text-sm text-muted-foreground">{plan.employeeName}</span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/performance/development/${plan.id}/edit`); }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Status */}
                  <div className="mt-3">
                    <Badge className={cn("text-xs", statusInfo?.color)}>
                      {statusInfo?.label}
                    </Badge>
                  </div>

                  {/* Progress */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{plan.activitiesCompleted}/{plan.totalActivities} activities</span>
                    </div>
                    <Progress 
                      value={plan.progress} 
                      className={cn(
                        "h-2",
                        plan.status === 'completed' ? "[&>div]:bg-green-500" : ""
                      )}
                    />
                    <p className="text-xs text-muted-foreground mt-1">{plan.progress}% complete</p>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                    <span>Started: {format(plan.startDate, 'MMM d, yyyy')}</span>
                    <span>Target: {format(plan.targetDate, 'MMM d, yyyy')}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DevelopmentPlanListPage;
