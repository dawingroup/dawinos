/**
 * Payroll Records Types
 * DawinOS HR Central - Advances, Overtime, Attendance
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// Attendance Types
// ============================================================================

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'leave' | 'holiday' | 'weekend' | 'sick';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD format
  status: AttendanceStatus;
  checkInTime?: string; // HH:mm format
  checkOutTime?: string; // HH:mm format
  hoursWorked?: number;
  overtimeHours?: number;
  leaveType?: 'annual' | 'sick' | 'maternity' | 'paternity' | 'compassionate' | 'unpaid';
  notes?: string;
  approvedBy?: string;
  createdBy: string;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface AttendanceSummary {
  employeeId: string;
  employeeName: string;
  period: string; // YYYY-MM format
  totalDays: number;
  workingDays: number;
  daysPresent: number;
  daysAbsent: number;
  daysLate: number;
  halfDays: number;
  leaveDays: number;
  sickDays: number;
  holidays: number;
  weekends: number;
  totalHoursWorked: number;
  totalOvertimeHours: number;
  attendancePercentage: number;
}

export interface CreateAttendanceInput {
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  leaveType?: AttendanceRecord['leaveType'];
  notes?: string;
}

export interface BulkAttendanceInput {
  date: string;
  records: Array<{
    employeeId: string;
    status: AttendanceStatus;
    checkInTime?: string;
    checkOutTime?: string;
    notes?: string;
  }>;
}

// ============================================================================
// Salary Advance Types
// ============================================================================

export type AdvanceStatus = 'pending' | 'approved' | 'disbursed' | 'partially_recovered' | 'fully_recovered' | 'rejected' | 'cancelled';

export interface SalaryAdvance {
  id: string;
  employeeId: string;
  employeeName: string;
  requestDate: Date | Timestamp;
  amount: number;
  reason: string;
  repaymentMonths: number; // Number of months to repay
  monthlyDeduction: number;
  status: AdvanceStatus;
  
  // Approval
  approvedBy?: string;
  approvedAt?: Date | Timestamp;
  rejectionReason?: string;
  
  // Disbursement
  disbursedBy?: string;
  disbursedAt?: Date | Timestamp;
  disbursementMethod?: 'bank_transfer' | 'mobile_money' | 'cash' | 'cheque';
  disbursementReference?: string;
  
  // Recovery tracking
  totalRecovered: number;
  balanceRemaining: number;
  recoveryStartMonth: string; // YYYY-MM format
  lastRecoveryMonth?: string;
  recoveryHistory: Array<{
    month: string;
    amount: number;
    payrollId?: string;
    date: Date | Timestamp;
  }>;
  
  // Audit
  createdBy: string;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  notes?: string;
}

export interface CreateAdvanceInput {
  employeeId: string;
  amount: number;
  reason: string;
  repaymentMonths: number;
  notes?: string;
}

export interface ApproveAdvanceInput {
  advanceId: string;
  approved: boolean;
  rejectionReason?: string;
}

export interface DisburseAdvanceInput {
  advanceId: string;
  disbursementMethod: SalaryAdvance['disbursementMethod'];
  disbursementReference?: string;
  recoveryStartMonth: string;
}

// ============================================================================
// Overtime Types (Extended from existing)
// ============================================================================

export type OvertimeType = 'regular' | 'weekend' | 'holiday' | 'night';
export type OvertimeStatus = 'pending' | 'approved' | 'processed' | 'rejected';

export interface OvertimeEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD format
  type: OvertimeType;
  hours: number;
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  hourlyRate: number;
  multiplier: number; // 1.5x for regular, 2x for weekend/holiday
  amount: number;
  reason: string;
  status: OvertimeStatus;
  
  // Approval
  approvedBy?: string;
  approvedAt?: Date | Timestamp;
  rejectionReason?: string;
  
  // Payroll processing
  payrollPeriod?: string; // YYYY-MM
  processedAt?: Date | Timestamp;
  
  // Audit
  createdBy: string;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  notes?: string;
}

export interface CreateOvertimeInput {
  employeeId: string;
  date: string;
  type: OvertimeType;
  hours: number;
  startTime?: string;
  endTime?: string;
  reason: string;
  notes?: string;
}

export interface ApproveOvertimeInput {
  overtimeId: string;
  approved: boolean;
  rejectionReason?: string;
}

// ============================================================================
// Summary Types for Payroll Page
// ============================================================================

export interface PayrollPeriodSummary {
  period: string; // YYYY-MM
  
  // Attendance summary
  attendance: {
    totalEmployees: number;
    avgAttendanceRate: number;
    totalWorkingDays: number;
    totalAbsentDays: number;
    totalLeaveDays: number;
  };
  
  // Overtime summary
  overtime: {
    totalEntries: number;
    totalHours: number;
    totalAmount: number;
    pendingApproval: number;
  };
  
  // Advances summary
  advances: {
    activeAdvances: number;
    totalOutstanding: number;
    monthlyRecovery: number;
    newRequests: number;
  };
}

// ============================================================================
// Filter Types
// ============================================================================

export interface AttendanceFilters {
  employeeId?: string;
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
}

export interface AdvanceFilters {
  employeeId?: string;
  status?: AdvanceStatus;
  startDate?: string;
  endDate?: string;
}

export interface OvertimeFilters {
  employeeId?: string;
  status?: OvertimeStatus;
  type?: OvertimeType;
  startDate?: string;
  endDate?: string;
  payrollPeriod?: string;
}
