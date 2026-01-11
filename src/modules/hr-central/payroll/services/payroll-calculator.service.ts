/**
 * Payroll Calculator Service
 * DawinOS HR Central - Payroll Module
 * 
 * Comprehensive payroll calculation engine with Uganda-specific
 * tax computations, proration, overtime, and deduction handling.
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc,
  query, 
  where, 
  orderBy,
  Timestamp,
  limit as firestoreLimit
} from 'firebase/firestore';
import { db } from '../../../../shared/services/firebase/firestore';

import {
  EmployeePayroll,
  EarningsItem,
  DeductionItem,
  ProrationDetails,
  YearToDateTotals,
  CalculatePayrollInput,
  LoanRecovery,
  OvertimeRecord,
  PAYEBreakdown,
  NSSFBreakdown,
  LSTBreakdown,
  EmployeePayrollSummary,
  PayrollSummary
} from '../types/payroll.types';

import {
  calculatePAYE,
  calculateNSSF,
  calculateLST,
  calculateTaxableIncome,
  calculateNSSFApplicableIncome,
  calculateOvertime,
  calculateProrationFactor,
  getAllowanceTaxTreatment,
  roundCurrency,
  getTaxYear,
  getFiscalYearDates,
  getDaysInMonth,
  getRemainingMonthsInFiscalYear,
  getPeriodString
} from '../utils/tax-calculator';

import {
  AllowanceType
} from '../constants/uganda-tax-constants';

import { Employee } from '../../types/employee.types';
import { Contract } from '../../types/contract.types';

// ============================================================================
// Collection Constants
// ============================================================================

const PAYROLL_COLLECTION = 'payroll';
// const PAYROLL_PERIODS_COLLECTION = 'payroll_periods';
const EMPLOYEE_COLLECTION = 'employees';
const CONTRACT_COLLECTION = 'contracts';
const LOAN_COLLECTION = 'loan_recoveries';
const OVERTIME_COLLECTION = 'overtime_records';
const YTD_COLLECTION = 'payroll_ytd';

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return doc(collection(db, '_')).id;
}

// ============================================================================
// Main Payroll Calculation
// ============================================================================

/**
 * Calculate payroll for a single employee
 */
export async function calculateEmployeePayroll(
  input: CalculatePayrollInput,
  performedBy: string
): Promise<EmployeePayroll> {
  const { employeeId, year, month, overrides, recalculate } = input;

  // Check for existing payroll
  const existingPayroll = await getEmployeePayrollForPeriod(employeeId, year, month);
  if (existingPayroll && !recalculate) {
    throw new Error(`Payroll already calculated for ${year}-${month}. Use recalculate option to override.`);
  }

  // Fetch employee data
  const employee = await getEmployee(employeeId);
  if (!employee) {
    throw new Error(`Employee not found: ${employeeId}`);
  }

  // Check employee status
  if (employee.employmentStatus !== 'active' && employee.employmentStatus !== 'on_leave') {
    throw new Error(`Cannot calculate payroll for employee with status: ${employee.employmentStatus}`);
  }

  // Fetch active contract
  const contract = await getActiveContract(employeeId);
  if (!contract) {
    throw new Error(`No active contract found for employee: ${employeeId}`);
  }

  // Fetch year-to-date totals
  const ytd = await getYearToDateTotals(employeeId, year, month);

  // Calculate proration if applicable
  const proration = calculateProration(employee, year, month, overrides?.unpaidLeaveDays);

  // Build earnings
  const earnings = await buildEarnings(
    employee,
    contract,
    proration,
    overrides,
    year,
    month
  );

  // Calculate totals
  const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
  const grossPay = roundCurrency(totalEarnings);
  const taxableIncome = calculateTaxableIncome(earnings);
  const nssfApplicableIncome = calculateNSSFApplicableIncome(earnings);

  // Calculate statutory deductions
  const payeBreakdown = calculatePAYE(taxableIncome);
  const nssfBreakdown = calculateNSSF(nssfApplicableIncome, {
    employeeAge: calculateAge(employee.dateOfBirth?.toDate?.() || employee.dateOfBirth),
    employmentCategory: employee.employmentType
  });
  const lstBreakdown = calculateLST(
    grossPay,
    ytd.grossEarnings,
    ytd.lst,
    getRemainingMonthsInFiscalYear(new Date(year, month - 1, 1))
  );

  // Build deductions
  const deductions = await buildDeductions(
    employeeId,
    payeBreakdown,
    nssfBreakdown,
    lstBreakdown,
    contract,
    overrides,
    year,
    month
  );

  // Calculate deduction totals
  const totalStatutoryDeductions = deductions
    .filter(d => d.category === 'statutory')
    .reduce((sum, d) => sum + d.amount, 0);
  const totalVoluntaryDeductions = deductions
    .filter(d => d.category !== 'statutory')
    .reduce((sum, d) => sum + d.amount, 0);
  const totalDeductions = roundCurrency(totalStatutoryDeductions + totalVoluntaryDeductions);

  // Calculate net pay
  const netPay = roundCurrency(grossPay - totalDeductions);

  // Get payment details from employee
  const paymentDetails = getPaymentDetails(employee);

  // Build payroll record
  const payrollId = existingPayroll?.id || generateId();
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0);
  const basicSalaryAmount = overrides?.basicSalary ?? contract.compensation.baseSalary;

  const payroll: EmployeePayroll = {
    id: payrollId,
    payrollPeriodId: '', // Will be set when added to batch
    subsidiaryId: employee.subsidiaryId,
    employeeId: employee.id,
    employeeNumber: employee.employeeNumber,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    departmentId: employee.position.departmentId,
    departmentName: '', // Will be resolved from department lookup
    position: employee.position.title,
    contractId: contract.id,

    year,
    month,
    periodStart,
    periodEnd,
    paymentDate: new Date(year, month - 1, 28), // Default to 28th
    paymentFrequency: (contract.compensation.paymentFrequency as EmployeePayroll['paymentFrequency']) || 'monthly',

    paymentMethod: paymentDetails.method,
    bankDetails: paymentDetails.bankDetails,
    mobileMoneyDetails: paymentDetails.mobileMoneyDetails,

    proration,
    basicSalary: roundCurrency(basicSalaryAmount * proration.prorationFactor),
    earnings,
    totalEarnings: roundCurrency(totalEarnings),
    grossPay,

    taxableIncome,
    payeBreakdown,
    nssfBreakdown,
    lstBreakdown,

    deductions,
    totalStatutoryDeductions: roundCurrency(totalStatutoryDeductions),
    totalVoluntaryDeductions: roundCurrency(totalVoluntaryDeductions),
    totalDeductions,

    netPay,

    ytd: updateYTD(ytd, {
      grossEarnings: grossPay,
      basicSalary: basicSalaryAmount * proration.prorationFactor,
      allowances: earnings.filter(e => e.type === 'allowance').reduce((s, e) => s + e.amount, 0),
      overtime: earnings.filter(e => e.type === 'overtime').reduce((s, e) => s + e.amount, 0),
      bonuses: earnings.filter(e => e.type === 'bonus').reduce((s, e) => s + e.amount, 0),
      commissions: earnings.filter(e => e.type === 'commission').reduce((s, e) => s + e.amount, 0),
      taxableEarnings: taxableIncome,
      nssfApplicableEarnings: nssfApplicableIncome,
      paye: payeBreakdown.netPAYE,
      nssfEmployee: nssfBreakdown.employeeContribution,
      nssfEmployer: nssfBreakdown.employerContribution,
      lst: lstBreakdown.monthlyLST,
      voluntaryDeductions: totalVoluntaryDeductions,
      netPay
    }, year, month),

    status: 'calculated',

    calculatedBy: performedBy,
    calculatedAt: new Date(),
    createdAt: existingPayroll?.createdAt || new Date(),
    updatedAt: new Date(),
    version: existingPayroll ? existingPayroll.version + 1 : 1
  };

  // Save payroll record
  await savePayroll(payroll);

  // Update YTD totals
  await saveYearToDateTotals(payroll.ytd, employeeId, year, month);

  return payroll;
}

// ============================================================================
// Earnings Building
// ============================================================================

/**
 * Build earnings array from contract and overrides
 */
async function buildEarnings(
  employee: Employee,
  contract: Contract,
  proration: ProrationDetails,
  overrides: CalculatePayrollInput['overrides'],
  year: number,
  month: number
): Promise<EarningsItem[]> {
  const earnings: EarningsItem[] = [];
  const compensation = contract.compensation;

  // Basic salary (prorated)
  const basicAmount = overrides?.basicSalary ?? compensation.baseSalary;
  const proratedBasic = roundCurrency(basicAmount * proration.prorationFactor);
  
  earnings.push({
    id: generateId(),
    type: 'basic_salary',
    category: 'basic',
    description: 'Basic Salary',
    amount: proratedBasic,
    taxable: true,
    taxableAmount: proratedBasic,
    nssfApplicable: true,
    nssfApplicableAmount: proratedBasic
  });

  // Contract allowances (prorated)
  if (compensation.allowances && Array.isArray(compensation.allowances)) {
    for (const allowance of compensation.allowances) {
      const treatment = getAllowanceTaxTreatment(allowance.type as AllowanceType);
      const proratedAmount = roundCurrency(allowance.amount * proration.prorationFactor);
      const isTaxable = allowance.taxable ?? treatment.taxable;
      
      earnings.push({
        id: generateId(),
        type: 'allowance',
        category: allowance.type as AllowanceType,
        description: formatAllowanceName(allowance.type),
        amount: proratedAmount,
        taxable: isTaxable,
        taxableAmount: isTaxable ? roundCurrency(proratedAmount * treatment.taxRate) : 0,
        nssfApplicable: treatment.nssfApplicable,
        nssfApplicableAmount: treatment.nssfApplicable ? proratedAmount : 0
      });
    }
  }

  // Overtime records
  const overtimeRecords = await getApprovedOvertimeForPeriod(employee.id, year, month);
  for (const overtime of overtimeRecords) {
    const otCalc = calculateOvertime(
      compensation.baseSalary,
      overtime.hours,
      overtime.type
    );
    
    earnings.push({
      id: generateId(),
      type: 'overtime',
      category: 'overtime',
      description: `${formatOvertimeType(overtime.type)} Overtime - ${overtime.hours} hours`,
      amount: otCalc.amount,
      taxable: true,
      taxableAmount: otCalc.amount,
      nssfApplicable: true,
      nssfApplicableAmount: otCalc.amount,
      metadata: {
        hours: overtime.hours,
        rate: otCalc.multiplier
      }
    });
  }

  // Additional earnings from overrides
  if (overrides?.additionalEarnings) {
    for (const additional of overrides.additionalEarnings) {
      const treatment = getAllowanceTaxTreatment(additional.type as AllowanceType);
      const isTaxable = additional.taxable ?? treatment.taxable;
      
      earnings.push({
        id: generateId(),
        type: 'other',
        category: additional.type as AllowanceType,
        description: additional.description,
        amount: roundCurrency(additional.amount),
        taxable: isTaxable,
        taxableAmount: isTaxable ? roundCurrency(additional.amount * treatment.taxRate) : 0,
        nssfApplicable: treatment.nssfApplicable,
        nssfApplicableAmount: treatment.nssfApplicable ? roundCurrency(additional.amount) : 0
      });
    }
  }

  return earnings;
}

// ============================================================================
// Deductions Building
// ============================================================================

/**
 * Build deductions array
 */
async function buildDeductions(
  employeeId: string,
  payeBreakdown: PAYEBreakdown,
  nssfBreakdown: NSSFBreakdown,
  lstBreakdown: LSTBreakdown,
  contract: Contract,
  overrides: CalculatePayrollInput['overrides'],
  _year: number,
  _month: number
): Promise<DeductionItem[]> {
  const deductions: DeductionItem[] = [];

  // PAYE
  if (payeBreakdown.netPAYE > 0) {
    deductions.push({
      id: generateId(),
      type: 'paye',
      category: 'statutory',
      description: `PAYE - ${(payeBreakdown.effectiveRate * 100).toFixed(2)}% effective rate`,
      amount: payeBreakdown.netPAYE,
      mandatory: true
    });
  }

  // NSSF Employee Contribution
  if (nssfBreakdown.employeeContribution > 0) {
    deductions.push({
      id: generateId(),
      type: 'nssf_employee',
      category: 'statutory',
      description: 'NSSF Employee Contribution (5%)',
      amount: nssfBreakdown.employeeContribution,
      mandatory: true
    });
  }

  // LST
  if (lstBreakdown.monthlyLST > 0) {
    deductions.push({
      id: generateId(),
      type: 'lst',
      category: 'statutory',
      description: `Local Service Tax - ${lstBreakdown.bandLabel}`,
      amount: lstBreakdown.monthlyLST,
      mandatory: true
    });
  }

  // Contract-based deductions
  if (contract.compensation.deductions && Array.isArray(contract.compensation.deductions)) {
    for (const deduction of contract.compensation.deductions) {
      // Skip statutory deductions already handled
      if (['nssf', 'paye', 'lst'].includes(deduction.type)) continue;
      
      deductions.push({
        id: generateId(),
        type: deduction.type as DeductionItem['type'],
        category: deduction.mandatory ? 'statutory' : 'voluntary',
        description: `${formatDeductionType(deduction.type)} Deduction`,
        amount: roundCurrency(deduction.amount || 0),
        mandatory: deduction.mandatory ?? false
      });
    }
  }

  // Loan recoveries
  const loanRecoveries = await getActiveLoanRecoveries(employeeId);
  for (const loan of loanRecoveries) {
    deductions.push({
      id: generateId(),
      type: 'loan',
      category: 'recovery',
      description: `${formatLoanType(loan.loanType)} Recovery`,
      amount: roundCurrency(loan.monthlyDeduction),
      mandatory: true,
      reference: loan.id,
      metadata: {
        installmentNumber: loan.paidInstallments + 1,
        totalInstallments: loan.installments,
        balanceRemaining: loan.balanceRemaining,
        loanId: loan.id
      }
    });
  }

  // Additional deductions from overrides
  if (overrides?.additionalDeductions) {
    for (const additional of overrides.additionalDeductions) {
      deductions.push({
        id: generateId(),
        type: additional.type as DeductionItem['type'],
        category: 'voluntary',
        description: additional.description,
        amount: roundCurrency(additional.amount),
        mandatory: false
      });
    }
  }

  return deductions;
}

// ============================================================================
// Proration Calculation
// ============================================================================

/**
 * Calculate proration for partial month
 */
function calculateProration(
  employee: Employee,
  year: number,
  month: number,
  unpaidLeaveDays?: number
): ProrationDetails {
  const daysInMonth = getDaysInMonth(year, month);
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0);
  
  const joiningDateTs = employee.employmentDates?.joiningDate;
  const exitDateTs = employee.employmentDates?.lastWorkingDate;
  const joiningDate = joiningDateTs ? (joiningDateTs.toDate?.() || new Date(joiningDateTs as any)) : null;
  const exitDate = exitDateTs ? (exitDateTs.toDate?.() || new Date(exitDateTs as any)) : null;

  let workedDays = daysInMonth;
  let reason: ProrationDetails['reason'] = 'none';
  let isProrated = false;
  let effectiveFrom: Date | undefined;
  let effectiveTo: Date | undefined;

  // Check if joined during this month
  if (joiningDate && joiningDate >= periodStart && joiningDate <= periodEnd) {
    workedDays = daysInMonth - joiningDate.getDate() + 1;
    reason = 'joining';
    isProrated = true;
    effectiveFrom = joiningDate;
  }

  // Check if exiting during this month
  if (exitDate && exitDate >= periodStart && exitDate <= periodEnd) {
    const exitDays = exitDate.getDate();
    workedDays = Math.min(workedDays, exitDays);
    reason = 'exit';
    isProrated = true;
    effectiveTo = exitDate;
  }

  // Deduct unpaid leave days
  if (unpaidLeaveDays && unpaidLeaveDays > 0) {
    workedDays = Math.max(0, workedDays - unpaidLeaveDays);
    reason = 'unpaid_leave';
    isProrated = true;
  }

  const prorationFactor = calculateProrationFactor(workedDays, daysInMonth);

  return {
    isProrated,
    reason,
    totalDays: daysInMonth,
    workedDays,
    prorationFactor,
    effectiveFrom,
    effectiveTo,
    unpaidDays: unpaidLeaveDays
  };
}

// ============================================================================
// Payment Details
// ============================================================================

/**
 * Get payment details from employee
 */
function getPaymentDetails(employee: Employee): {
  method: EmployeePayroll['paymentMethod'];
  bankDetails?: EmployeePayroll['bankDetails'];
  mobileMoneyDetails?: EmployeePayroll['mobileMoneyDetails'];
} {
  // Check preferred payment method and available accounts
  const primaryBank = employee.bankAccounts?.find(b => b.isPrimary) || employee.bankAccounts?.[0];
  const primaryMobile = employee.mobileMoneyAccounts?.find(m => m.isPrimary) || employee.mobileMoneyAccounts?.[0];

  // Check for bank details
  if (employee.preferredPaymentMethod === 'bank' && primaryBank?.accountNumber) {
    return {
      method: 'bank_transfer',
      bankDetails: {
        bankName: primaryBank.bankName || '',
        branchName: primaryBank.branchName,
        accountNumber: primaryBank.accountNumber,
        accountName: primaryBank.accountName || `${employee.firstName} ${employee.lastName}`,
        swiftCode: primaryBank.swiftCode
      }
    };
  }

  // Check for mobile money
  if (employee.preferredPaymentMethod === 'mobile_money' && primaryMobile?.phoneNumber) {
    return {
      method: 'mobile_money',
      mobileMoneyDetails: {
        provider: primaryMobile.provider as 'mtn' | 'airtel',
        phoneNumber: primaryMobile.phoneNumber,
        registeredName: primaryMobile.accountName || `${employee.firstName} ${employee.lastName}`
      }
    };
  }

  // Fallback to bank if available
  if (primaryBank?.accountNumber) {
    return {
      method: 'bank_transfer',
      bankDetails: {
        bankName: primaryBank.bankName || '',
        branchName: primaryBank.branchName,
        accountNumber: primaryBank.accountNumber,
        accountName: primaryBank.accountName || `${employee.firstName} ${employee.lastName}`,
        swiftCode: primaryBank.swiftCode
      }
    };
  }

  // Fallback to mobile money if available
  if (primaryMobile?.phoneNumber) {
    return {
      method: 'mobile_money',
      mobileMoneyDetails: {
        provider: primaryMobile.provider as 'mtn' | 'airtel',
        phoneNumber: primaryMobile.phoneNumber,
        registeredName: primaryMobile.accountName || `${employee.firstName} ${employee.lastName}`
      }
    };
  }

  return { method: 'cash' };
}

// ============================================================================
// YTD Calculations
// ============================================================================

/**
 * Update YTD totals with current period
 */
function updateYTD(
  ytd: YearToDateTotals,
  current: Partial<YearToDateTotals>,
  year: number,
  month: number
): YearToDateTotals {
  return {
    ...ytd,
    grossEarnings: ytd.grossEarnings + (current.grossEarnings || 0),
    basicSalary: ytd.basicSalary + (current.basicSalary || 0),
    allowances: ytd.allowances + (current.allowances || 0),
    overtime: ytd.overtime + (current.overtime || 0),
    bonuses: ytd.bonuses + (current.bonuses || 0),
    commissions: ytd.commissions + (current.commissions || 0),
    taxableEarnings: ytd.taxableEarnings + (current.taxableEarnings || 0),
    nssfApplicableEarnings: ytd.nssfApplicableEarnings + (current.nssfApplicableEarnings || 0),
    totalDeductions: ytd.totalDeductions + (current.paye || 0) + 
                     (current.nssfEmployee || 0) + (current.lst || 0) + 
                     (current.voluntaryDeductions || 0),
    paye: ytd.paye + (current.paye || 0),
    nssfEmployee: ytd.nssfEmployee + (current.nssfEmployee || 0),
    nssfEmployer: ytd.nssfEmployer + (current.nssfEmployer || 0),
    lst: ytd.lst + (current.lst || 0),
    voluntaryDeductions: ytd.voluntaryDeductions + (current.voluntaryDeductions || 0),
    netPay: ytd.netPay + (current.netPay || 0),
    periodsProcessed: ytd.periodsProcessed + 1,
    lastProcessedPeriod: getPeriodString(year, month)
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth?: Date | string): number {
  if (!dateOfBirth) return 30; // Default age
  
  const today = new Date();
  const birthDate = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Format allowance name for display
 */
function formatAllowanceName(type: string): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') + ' Allowance';
}

/**
 * Format overtime type for display
 */
function formatOvertimeType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Format deduction type for display
 */
function formatDeductionType(type: string): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format loan type for display
 */
function formatLoanType(type: string): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ============================================================================
// Data Access Functions
// ============================================================================

/**
 * Get employee by ID
 */
async function getEmployee(employeeId: string): Promise<Employee | null> {
  const docRef = doc(db, EMPLOYEE_COLLECTION, employeeId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  return { id: docSnap.id, ...docSnap.data() } as Employee;
}

/**
 * Get active contract for employee
 */
async function getActiveContract(employeeId: string): Promise<Contract | null> {
  const q = query(
    collection(db, CONTRACT_COLLECTION),
    where('employeeId', '==', employeeId),
    where('status', '==', 'active'),
    firestoreLimit(1)
  );
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Contract;
}

/**
 * Get existing payroll for employee/period
 */
async function getEmployeePayrollForPeriod(
  employeeId: string,
  year: number,
  month: number
): Promise<EmployeePayroll | null> {
  const q = query(
    collection(db, PAYROLL_COLLECTION),
    where('employeeId', '==', employeeId),
    where('year', '==', year),
    where('month', '==', month),
    firestoreLimit(1)
  );
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as EmployeePayroll;
}

/**
 * Get year-to-date totals
 */
async function getYearToDateTotals(
  employeeId: string,
  year: number,
  month: number
): Promise<YearToDateTotals> {
  const taxYear = getTaxYear(new Date(year, month - 1, 1));
  const { start, end } = getFiscalYearDates(new Date(year, month - 1, 1));
  
  const docId = `${employeeId}_${taxYear}`;
  const docRef = doc(db, YTD_COLLECTION, docId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as YearToDateTotals;
  }

  // Return empty YTD
  return {
    taxYear,
    fiscalYearStart: start,
    fiscalYearEnd: end,
    grossEarnings: 0,
    basicSalary: 0,
    allowances: 0,
    overtime: 0,
    bonuses: 0,
    commissions: 0,
    otherEarnings: 0,
    taxableEarnings: 0,
    nssfApplicableEarnings: 0,
    totalDeductions: 0,
    paye: 0,
    nssfEmployee: 0,
    nssfEmployer: 0,
    lst: 0,
    voluntaryDeductions: 0,
    loanRecoveries: 0,
    otherDeductions: 0,
    netPay: 0,
    periodsProcessed: 0,
    lastProcessedPeriod: ''
  };
}

/**
 * Save year-to-date totals
 */
async function saveYearToDateTotals(
  ytd: YearToDateTotals,
  employeeId: string,
  year: number,
  month: number
): Promise<void> {
  const taxYear = getTaxYear(new Date(year, month - 1, 1));
  const docId = `${employeeId}_${taxYear}`;
  const docRef = doc(db, YTD_COLLECTION, docId);
  
  await setDoc(docRef, {
    ...ytd,
    lastProcessedPeriod: getPeriodString(year, month),
    updatedAt: Timestamp.now()
  }, { merge: true });
}

/**
 * Get approved overtime records for period
 */
async function getApprovedOvertimeForPeriod(
  employeeId: string,
  year: number,
  month: number
): Promise<OvertimeRecord[]> {
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0);

  const q = query(
    collection(db, OVERTIME_COLLECTION),
    where('employeeId', '==', employeeId),
    where('status', '==', 'approved'),
    where('date', '>=', Timestamp.fromDate(periodStart)),
    where('date', '<=', Timestamp.fromDate(periodEnd))
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({
    id: d.id,
    ...d.data(),
    date: d.data().date?.toDate?.() || d.data().date
  })) as OvertimeRecord[];
}

/**
 * Get active loan recoveries for employee
 */
async function getActiveLoanRecoveries(employeeId: string): Promise<LoanRecovery[]> {
  const q = query(
    collection(db, LOAN_COLLECTION),
    where('employeeId', '==', employeeId),
    where('status', '==', 'active')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({
    id: d.id,
    ...d.data()
  })) as LoanRecovery[];
}

/**
 * Save payroll record
 */
async function savePayroll(payroll: EmployeePayroll): Promise<void> {
  const docRef = doc(db, PAYROLL_COLLECTION, payroll.id);
  await setDoc(docRef, {
    ...payroll,
    periodStart: Timestamp.fromDate(payroll.periodStart),
    periodEnd: Timestamp.fromDate(payroll.periodEnd),
    paymentDate: Timestamp.fromDate(payroll.paymentDate),
    calculatedAt: Timestamp.fromDate(payroll.calculatedAt),
    createdAt: Timestamp.fromDate(payroll.createdAt),
    updatedAt: Timestamp.now()
  });
}

// ============================================================================
// Public Query Functions
// ============================================================================

/**
 * Get payroll by ID
 */
export async function getPayroll(payrollId: string): Promise<EmployeePayroll | null> {
  const docRef = doc(db, PAYROLL_COLLECTION, payrollId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    periodStart: data.periodStart?.toDate?.() || data.periodStart,
    periodEnd: data.periodEnd?.toDate?.() || data.periodEnd,
    paymentDate: data.paymentDate?.toDate?.() || data.paymentDate,
    calculatedAt: data.calculatedAt?.toDate?.() || data.calculatedAt,
    createdAt: data.createdAt?.toDate?.() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
  } as EmployeePayroll;
}

/**
 * Get payroll history for employee
 */
export async function getPayrollHistory(
  employeeId: string,
  options?: {
    year?: number;
    limitCount?: number;
  }
): Promise<EmployeePayroll[]> {
  let q;
  
  if (options?.year) {
    q = query(
      collection(db, PAYROLL_COLLECTION),
      where('employeeId', '==', employeeId),
      where('year', '==', options.year),
      orderBy('month', 'desc')
    );
  } else {
    q = query(
      collection(db, PAYROLL_COLLECTION),
      where('employeeId', '==', employeeId),
      orderBy('year', 'desc'),
      orderBy('month', 'desc'),
      firestoreLimit(options?.limitCount || 24)
    );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      periodStart: data.periodStart?.toDate?.() || data.periodStart,
      periodEnd: data.periodEnd?.toDate?.() || data.periodEnd,
      paymentDate: data.paymentDate?.toDate?.() || data.paymentDate,
      calculatedAt: data.calculatedAt?.toDate?.() || data.calculatedAt,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
    };
  }) as EmployeePayroll[];
}

/**
 * Get payroll records for a period
 */
export async function getPayrollsForPeriod(
  subsidiaryId: string,
  year: number,
  month: number
): Promise<EmployeePayrollSummary[]> {
  const q = query(
    collection(db, PAYROLL_COLLECTION),
    where('subsidiaryId', '==', subsidiaryId),
    where('year', '==', year),
    where('month', '==', month),
    orderBy('employeeName', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      employeeId: data.employeeId,
      employeeNumber: data.employeeNumber,
      employeeName: data.employeeName,
      departmentName: data.departmentName,
      position: data.position,
      grossPay: data.grossPay,
      totalDeductions: data.totalDeductions,
      netPay: data.netPay,
      status: data.status,
      paymentMethod: data.paymentMethod
    };
  }) as EmployeePayrollSummary[];
}

/**
 * Get payroll summary for a period
 */
export async function getPayrollSummary(
  subsidiaryId: string,
  year: number,
  month: number
): Promise<PayrollSummary> {
  const payrolls = await getPayrollsForPeriod(subsidiaryId, year, month);
  
  // Initialize department breakdown map
  const departmentMap = new Map<string, PayrollSummary['departmentBreakdown'][0]>();
  const paymentMethodMap = new Map<string, { count: number; amount: number }>();
  const bankMap = new Map<string, { count: number; amount: number }>();
  
  // Initialize totals
  const totals = {
    employeeCount: 0,
    totalGross: 0,
    totalTaxableIncome: 0,
    totalPAYE: 0,
    totalNSSFEmployee: 0,
    totalNSSFEmployer: 0,
    totalLST: 0,
    totalVoluntaryDeductions: 0,
    totalNet: 0
  };

  // Process each payroll
  for (const payroll of payrolls) {
    const fullPayroll = await getPayroll(payroll.id);
    if (!fullPayroll) continue;

    // Update totals
    totals.employeeCount++;
    totals.totalGross += fullPayroll.grossPay;
    totals.totalTaxableIncome += fullPayroll.taxableIncome;
    totals.totalPAYE += fullPayroll.payeBreakdown.netPAYE;
    totals.totalNSSFEmployee += fullPayroll.nssfBreakdown.employeeContribution;
    totals.totalNSSFEmployer += fullPayroll.nssfBreakdown.employerContribution;
    totals.totalLST += fullPayroll.lstBreakdown.monthlyLST;
    totals.totalVoluntaryDeductions += fullPayroll.totalVoluntaryDeductions;
    totals.totalNet += fullPayroll.netPay;

    // Update department breakdown
    const deptKey = fullPayroll.departmentId;
    if (!departmentMap.has(deptKey)) {
      departmentMap.set(deptKey, {
        departmentId: fullPayroll.departmentId,
        departmentName: fullPayroll.departmentName,
        employeeCount: 0,
        totalGross: 0,
        totalNet: 0,
        totalPAYE: 0,
        totalNSSF: 0,
        totalLST: 0
      });
    }
    const dept = departmentMap.get(deptKey)!;
    dept.employeeCount++;
    dept.totalGross += fullPayroll.grossPay;
    dept.totalNet += fullPayroll.netPay;
    dept.totalPAYE += fullPayroll.payeBreakdown.netPAYE;
    dept.totalNSSF += fullPayroll.nssfBreakdown.employeeContribution;
    dept.totalLST += fullPayroll.lstBreakdown.monthlyLST;

    // Update payment method breakdown
    const methodKey = fullPayroll.paymentMethod;
    if (!paymentMethodMap.has(methodKey)) {
      paymentMethodMap.set(methodKey, { count: 0, amount: 0 });
    }
    const method = paymentMethodMap.get(methodKey)!;
    method.count++;
    method.amount += fullPayroll.netPay;

    // Update bank breakdown
    if (fullPayroll.bankDetails?.bankName) {
      const bankKey = fullPayroll.bankDetails.bankName;
      if (!bankMap.has(bankKey)) {
        bankMap.set(bankKey, { count: 0, amount: 0 });
      }
      const bank = bankMap.get(bankKey)!;
      bank.count++;
      bank.amount += fullPayroll.netPay;
    }
  }

  return {
    period: getPeriodString(year, month),
    subsidiaryId,
    departmentBreakdown: Array.from(departmentMap.values()),
    totals,
    paymentMethodBreakdown: Array.from(paymentMethodMap.entries()).map(([method, data]) => ({
      method,
      count: data.count,
      amount: data.amount
    })),
    bankBreakdown: Array.from(bankMap.entries()).map(([bankName, data]) => ({
      bankName,
      count: data.count,
      amount: data.amount
    }))
  };
}

/**
 * Approve payroll record
 */
export async function approvePayroll(
  payrollId: string,
  approvedBy: string,
  notes?: string
): Promise<EmployeePayroll> {
  const payroll = await getPayroll(payrollId);
  if (!payroll) throw new Error('Payroll not found');
  
  if (payroll.status !== 'calculated' && payroll.status !== 'reviewed') {
    throw new Error(`Cannot approve payroll in status: ${payroll.status}`);
  }

  const docRef = doc(db, PAYROLL_COLLECTION, payrollId);
  await updateDoc(docRef, {
    status: 'approved',
    approvedBy,
    approvedAt: Timestamp.now(),
    notes: notes || payroll.notes,
    updatedAt: Timestamp.now(),
    version: payroll.version + 1
  });

  return { ...payroll, status: 'approved', approvedBy, approvedAt: new Date() };
}

/**
 * Mark payroll as paid
 */
export async function markPayrollPaid(
  payrollId: string,
  _paidBy: string
): Promise<EmployeePayroll> {
  const payroll = await getPayroll(payrollId);
  if (!payroll) throw new Error('Payroll not found');
  
  if (payroll.status !== 'approved') {
    throw new Error(`Cannot mark as paid - payroll must be approved first`);
  }

  const docRef = doc(db, PAYROLL_COLLECTION, payrollId);
  await updateDoc(docRef, {
    status: 'paid',
    updatedAt: Timestamp.now(),
    version: payroll.version + 1
  });

  // Update loan recovery if applicable
  for (const deduction of payroll.deductions) {
    if (deduction.type === 'loan' && deduction.metadata?.loanId) {
      await updateLoanRecoveryAfterPayment(deduction.metadata.loanId, deduction.amount);
    }
  }

  return { ...payroll, status: 'paid' };
}

/**
 * Update loan recovery after payment
 */
async function updateLoanRecoveryAfterPayment(
  loanId: string,
  amountPaid: number
): Promise<void> {
  const docRef = doc(db, LOAN_COLLECTION, loanId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return;
  
  const loan = docSnap.data() as LoanRecovery;
  const newPaidInstallments = loan.paidInstallments + 1;
  const newBalance = Math.max(0, loan.balanceRemaining - amountPaid);
  const newStatus = newBalance <= 0 ? 'completed' : 'active';

  await updateDoc(docRef, {
    paidInstallments: newPaidInstallments,
    balanceRemaining: newBalance,
    status: newStatus,
    updatedAt: Timestamp.now()
  });
}
