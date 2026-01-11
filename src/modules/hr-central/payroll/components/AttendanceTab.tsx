/**
 * Attendance Tab Component
 * Track employee attendance and working days
 */

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Plus,
  Users,
  Percent,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Input } from '@/core/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { useAttendance } from '../hooks/usePayrollRecords';
import type { AttendanceStatus, CreateAttendanceInput } from '../types/payroll-records.types';

interface AttendanceTabProps {
  period: string;
  employees: Array<{ id: string; fullName: string }>;
}

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; icon: React.ReactNode }> = {
  present: { label: 'Present', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3 w-3" /> },
  absent: { label: 'Absent', color: 'bg-red-100 text-red-700', icon: <XCircle className="h-3 w-3" /> },
  late: { label: 'Late', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-3 w-3" /> },
  half_day: { label: 'Half Day', color: 'bg-orange-100 text-orange-700', icon: <AlertCircle className="h-3 w-3" /> },
  leave: { label: 'Leave', color: 'bg-blue-100 text-blue-700', icon: <Calendar className="h-3 w-3" /> },
  holiday: { label: 'Holiday', color: 'bg-purple-100 text-purple-700', icon: <Calendar className="h-3 w-3" /> },
  weekend: { label: 'Weekend', color: 'bg-gray-100 text-gray-700', icon: <Calendar className="h-3 w-3" /> },
  sick: { label: 'Sick', color: 'bg-pink-100 text-pink-700', icon: <AlertCircle className="h-3 w-3" /> },
};

export function AttendanceTab({ period, employees }: AttendanceTabProps) {
  const { records, loading, createRecord, refetch } = useAttendance(undefined, period);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateAttendanceInput>>({
    date: format(new Date(), 'yyyy-MM-dd'),
    status: 'present',
  });

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const leave = records.filter(r => r.status === 'leave' || r.status === 'sick').length;
    const total = records.length;
    
    return {
      present,
      absent,
      late,
      leave,
      total,
      attendanceRate: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
    };
  }, [records]);

  // Group records by employee for display
  const recordsByEmployee = useMemo(() => {
    const grouped: Record<string, typeof records> = {};
    records.forEach(record => {
      if (!grouped[record.employeeId]) {
        grouped[record.employeeId] = [];
      }
      grouped[record.employeeId].push(record);
    });
    return grouped;
  }, [records]);

  const handleSubmit = async () => {
    if (!formData.employeeId || !formData.date || !formData.status) return;
    
    const employee = employees.find(e => e.id === formData.employeeId);
    if (!employee) return;

    try {
      await createRecord(formData as CreateAttendanceInput, employee.fullName);
      setShowAddDialog(false);
      setFormData({ date: format(new Date(), 'yyyy-MM-dd'), status: 'present' });
    } catch (error) {
      console.error('Failed to create attendance record:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-green-100">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Present</p>
                <p className="text-xl font-bold">{summaryStats.present}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-red-100">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Absent</p>
                <p className="text-xl font-bold">{summaryStats.absent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-yellow-100">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Late</p>
                <p className="text-xl font-bold">{summaryStats.late}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-blue-100">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">On Leave</p>
                <p className="text-xl font-bold">{summaryStats.leave}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-emerald-100">
                <Percent className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Attendance Rate</p>
                <p className="text-xl font-bold">{summaryStats.attendanceRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Records */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Attendance Records</CardTitle>
              <CardDescription>
                {format(new Date(period + '-01'), 'MMMM yyyy')} attendance tracking
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Record
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 px-6">
              <Users className="h-10 w-10 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No Attendance Records</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start tracking attendance by adding records.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.slice(0, 20).map(record => {
                  const config = STATUS_CONFIG[record.status];
                  return (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.employeeName}</TableCell>
                      <TableCell>{format(new Date(record.date), 'dd MMM yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`${config.color} flex items-center gap-1 w-fit`}>
                          {config.icon}
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.checkInTime || '-'}</TableCell>
                      <TableCell>{record.checkOutTime || '-'}</TableCell>
                      <TableCell className="text-right">{record.hoursWorked?.toFixed(1) || '-'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Record Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Attendance Record</DialogTitle>
            <DialogDescription>
              Record employee attendance for a specific date.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Employee</label>
              <Select
                value={formData.employeeId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as AttendanceStatus }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Check In</label>
                <Input
                  type="time"
                  value={formData.checkInTime || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, checkInTime: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Check Out</label>
                <Input
                  type="time"
                  value={formData.checkOutTime || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, checkOutTime: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Input
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes"
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Add Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AttendanceTab;
