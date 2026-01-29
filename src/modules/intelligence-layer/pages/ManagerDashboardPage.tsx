/**
 * Manager Dashboard Page
 * DawinOS v2.0 - Intelligence Layer
 *
 * Manager view for monitoring team workload and task assignments
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  ClipboardList,
  Clock,
  AlertCircle,
  CheckCircle,
  Play,
  TrendingUp,
  RefreshCw,
  User,
  Calendar,
  BarChart3,
  UserPlus,
  Repeat,
} from 'lucide-react';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/shared/services/firebase/firestore';
import { useAuth } from '@/integration/store';

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Progress } from '@/core/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';

import { MODULE_COLOR } from '../constants';
import { TaskAssignmentDialog } from '../components/manager/TaskAssignmentDialog';

// ============================================
// Types
// ============================================

interface TeamMember {
  id: string;
  name: string;
  email: string;
  department?: string;
  role?: string;
  taskStats: {
    pending: number;
    inProgress: number;
    completed: number;
    completedToday: number;
    blocked: number;
    overdue: number;
  };
  utilization: number;
}

interface TeamTask {
  id: string;
  title: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  status: string;
  assignedTo?: string;
  assignedToName?: string;
  dueDate?: Date;
  sourceModule: string;
}

interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedToday: number;
  overdueTasks: number;
  avgUtilization: number;
}

// ============================================
// Manager Dashboard Page Component
// ============================================

export default function ManagerDashboardPage() {
  const { userId } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [recentTasks, setRecentTasks] = useState<TeamTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [assignmentDialog, setAssignmentDialog] = useState<{
    open: boolean;
    task: any;
    mode: 'assign' | 'reassign' | 'takeup';
  } | null>(null);

  // Fetch team data
  const fetchTeamData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch employees — filter by manager's team if possible
      const employeesRef = collection(db, 'employees');
      const employeeQuery = userId
        ? query(
            employeesRef,
            where('status', '==', 'active'),
            where('position.reportsTo', '==', userId),
            limit(50)
          )
        : query(
            employeesRef,
            where('status', '==', 'active'),
            limit(50)
          );

      let employeeSnapshot;
      try {
        employeeSnapshot = await getDocs(employeeQuery);
      } catch {
        // Fallback: if position.reportsTo field doesn't exist, fetch all active
        const fallbackQuery = query(
          employeesRef,
          where('status', '==', 'active'),
          limit(50)
        );
        employeeSnapshot = await getDocs(fallbackQuery);
      }

      const members: TeamMember[] = [];

      for (const empDoc of employeeSnapshot.docs) {
        const empData = empDoc.data();

        // Fetch tasks for this employee
        const tasksRef = collection(db, 'generatedTasks');
        const taskQuery = query(
          tasksRef,
          where('assignedTo', '==', empDoc.id),
          limit(100)
        );
        const taskSnapshot = await getDocs(taskQuery);

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let pending = 0;
        let inProgress = 0;
        let completed = 0;
        let completedToday = 0;
        let blocked = 0;
        let overdue = 0;

        taskSnapshot.docs.forEach((taskDoc) => {
          const task = taskDoc.data();
          switch (task.status) {
            case 'pending':
              pending++;
              break;
            case 'in_progress':
              inProgress++;
              break;
            case 'completed':
              completed++;
              // Check if completed today
              const completedAt = task.completedAt?.toDate?.() || task.updatedAt?.toDate?.();
              if (completedAt && completedAt >= today) {
                completedToday++;
              }
              break;
            case 'blocked':
              blocked++;
              break;
          }

          // Check overdue
          const dueDate = task.dueDate?.toDate();
          if (dueDate && dueDate < today && task.status !== 'completed') {
            overdue++;
          }
        });

        // Calculate utilization (assuming max 10 concurrent tasks)
        const activeTasks = pending + inProgress;
        const maxTasks = 10;
        const utilization = Math.min(Math.round((activeTasks / maxTasks) * 100), 100);

        members.push({
          id: empDoc.id,
          name: empData.displayName || empData.firstName + ' ' + empData.lastName || 'Unknown',
          email: empData.email || '',
          department: empData.department || empData.departmentId,
          role: empData.jobTitle || empData.role,
          taskStats: { pending, inProgress, completed, completedToday, blocked, overdue },
          utilization,
        });
      }

      // Sort by active tasks (descending)
      members.sort((a, b) =>
        (b.taskStats.pending + b.taskStats.inProgress) -
        (a.taskStats.pending + a.taskStats.inProgress)
      );

      setTeamMembers(members);

      // Fetch recent team tasks
      const allTasksQuery = query(
        collection(db, 'generatedTasks'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const allTasksSnapshot = await getDocs(allTasksQuery);

      const tasks: TeamTask[] = allTasksSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          priority: data.priority,
          status: data.status,
          assignedTo: data.assignedTo,
          assignedToName: data.assignedToName,
          dueDate: data.dueDate?.toDate(),
          sourceModule: data.sourceModule,
        };
      });

      setRecentTasks(tasks);
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  // Calculate team stats
  const teamStats = useMemo((): TeamStats => {
    let totalTasks = 0;
    let pendingTasks = 0;
    let inProgressTasks = 0;
    let completedToday = 0;
    let overdueTasks = 0;
    let totalUtilization = 0;

    teamMembers.forEach((member) => {
      const stats = member.taskStats;
      totalTasks += stats.pending + stats.inProgress + stats.completed + stats.blocked;
      pendingTasks += stats.pending;
      inProgressTasks += stats.inProgress;
      completedToday += stats.completedToday;
      overdueTasks += stats.overdue;
      totalUtilization += member.utilization;
    });

    const activeMembers = teamMembers.filter(
      (m) => m.taskStats.pending + m.taskStats.inProgress > 0
    ).length;

    return {
      totalMembers: teamMembers.length,
      activeMembers,
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedToday,
      overdueTasks,
      avgUtilization: teamMembers.length > 0
        ? Math.round(totalUtilization / teamMembers.length)
        : 0,
    };
  }, [teamMembers]);

  // Filter members by department
  const filteredMembers = useMemo(() => {
    if (departmentFilter === 'all') return teamMembers;
    return teamMembers.filter((m) => m.department === departmentFilter);
  }, [teamMembers, departmentFilter]);

  // Get unique departments
  const departments = useMemo(() => {
    const depts = new Set(teamMembers.map((m) => m.department).filter(Boolean));
    return Array.from(depts) as string[];
  }, [teamMembers]);

  // Priority badge helper
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'P0':
        return <Badge className="bg-red-500 hover:bg-red-500 text-white text-xs">P0</Badge>;
      case 'P1':
        return <Badge className="bg-orange-500 hover:bg-orange-500 text-white text-xs">P1</Badge>;
      case 'P2':
        return <Badge className="bg-blue-500 hover:bg-blue-500 text-white text-xs">P2</Badge>;
      case 'P3':
        return <Badge className="bg-gray-500 hover:bg-gray-500 text-white text-xs">P3</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{priority}</Badge>;
    }
  };

  // Status badge helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 text-xs">Done</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-700 text-xs">Active</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 text-xs">Pending</Badge>;
      case 'blocked':
        return <Badge className="bg-red-100 text-red-700 text-xs">Blocked</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  // Utilization badge helper
  const getUtilizationBadge = (utilization: number) => {
    if (utilization >= 90) {
      return <Badge className="bg-red-100 text-red-700">Overloaded</Badge>;
    } else if (utilization >= 70) {
      return <Badge className="bg-amber-100 text-amber-700">High</Badge>;
    } else if (utilization >= 40) {
      return <Badge className="bg-green-100 text-green-700">Balanced</Badge>;
    } else {
      return <Badge className="bg-blue-100 text-blue-700">Available</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div
            className="p-3 rounded-xl"
            style={{ backgroundColor: `${MODULE_COLOR}15` }}
          >
            <Users className="h-8 w-8" style={{ color: MODULE_COLOR }} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: MODULE_COLOR }}>
              Team Dashboard
            </h1>
            <p className="text-muted-foreground">
              Monitor team workload and task progress
            </p>
          </div>
        </div>

        <Button variant="outline" onClick={() => window.location.reload()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{teamStats.totalMembers}</div>
              <div className="text-xs text-muted-foreground">Team Members</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{teamStats.pendingTasks}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Play className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{teamStats.inProgressTasks}</div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{teamStats.overdueTasks}</div>
              <div className="text-xs text-muted-foreground">Overdue</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{teamStats.activeMembers}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{teamStats.avgUtilization}%</div>
              <div className="text-xs text-muted-foreground">Avg Utilization</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            Team Members
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Recent Tasks
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Workload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" style={{ color: MODULE_COLOR }} />
                  Team Workload
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredMembers.slice(0, 5).map((member) => (
                      <div key={member.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                          {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium truncate">{member.name}</span>
                            {getUtilizationBadge(member.utilization)}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={member.utilization} className="h-1.5 flex-1" />
                            <span className="text-xs text-muted-foreground w-8">
                              {member.utilization}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" style={{ color: MODULE_COLOR }} />
                  Recent Team Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentTasks.slice(0, 5).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex gap-1">
                          {getPriorityBadge(task.priority)}
                          {getStatusBadge(task.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {task.assignedToName || 'Unassigned'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Team Members Tab */}
        <TabsContent value="team" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Team Members</CardTitle>
              {departments.length > 0 && (
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No team members found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                        {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{member.name}</span>
                          {getUtilizationBadge(member.utilization)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-0.5">
                          {member.role && <span>{member.role}</span>}
                          {member.department && <span>{member.department}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-semibold text-amber-600">{member.taskStats.pending}</div>
                          <div className="text-xs text-muted-foreground">Pending</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-blue-600">{member.taskStats.inProgress}</div>
                          <div className="text-xs text-muted-foreground">Active</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-red-600">{member.taskStats.overdue}</div>
                          <div className="text-xs text-muted-foreground">Overdue</div>
                        </div>
                        <Progress value={member.utilization} className="w-20 h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Team Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : recentTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No tasks found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex gap-1.5">
                        {getPriorityBadge(task.priority)}
                        {getStatusBadge(task.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{task.title}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {task.assignedToName || 'Unassigned'}
                          </span>
                          {task.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {task.dueDate.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          )}
                          <span>{task.sourceModule.replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!task.assignedTo ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setAssignmentDialog({ open: true, task, mode: 'assign' })}
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            Assign
                          </Button>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setAssignmentDialog({ open: true, task, mode: 'reassign' })}
                            >
                              <Repeat className="h-3 w-3 mr-1" />
                              Reassign
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setAssignmentDialog({ open: true, task, mode: 'takeup' })}
                            >
                              <User className="h-3 w-3 mr-1" />
                              Take Up
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Task Assignment Dialog */}
      {assignmentDialog && (
        <TaskAssignmentDialog
          task={assignmentDialog.task}
          mode={assignmentDialog.mode}
          onClose={() => setAssignmentDialog(null)}
          onSuccess={() => {
            fetchTeamData();
            setAssignmentDialog(null);
          }}
        />
      )}
    </div>
  );
}
